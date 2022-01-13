import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'

import {
  getDecorators,
  getSecondDecoratorValue,
  getSpecifiedDecorator,
  getPropertyType,
  getFirstDecoratorValue,
} from '../utils/ast-utils'
import {
  SMART_CONTRACT_DEFINITION,
  CIRCUIT_VALUE_DEFINITION,
} from '../utils/selectors'

const MAX_CONTRACT_STATES = 8

const SnarkyJSPrimitiveNames = [
  'Field',
  'Bool',
  'UInt32',
  'Uint64',
  'Scalar',
  'PrivateKey',
  'Group',
  'PublicKey',
  'Signature',
] as const

type SnarkyJSPrimitiveName = typeof SnarkyJSPrimitiveNames[number]

const isSnarkyJSPrimitive = (p: any): p is SnarkyJSPrimitiveName =>
  SnarkyJSPrimitiveNames.includes(p)

const SnarkyJSPrimitiveSizeInfo = {
  Field: { size: 1 },
  Bool: { size: 1 },
  Scalar: { size: 1 },
  UInt32: { size: 1 },
  Uint64: { size: 1 },
  PrivateKey: { size: 1 },
  Group: { size: 2 },
  PublicKey: { size: 2 },
  Signature: { size: 2 },
} as Record<SnarkyJSPrimitiveName, { size: number }>

type CircuitDecoratorInfo = {
  decoratorType: string
  decoratorKind: 'state' | 'arrayProp' | 'prop'
  typeSize?: number
  node: TSESTree.Node
}

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      noGreaterStorageLimitInCircuit: `A circuit can only have ${MAX_CONTRACT_STATES} allowed storage fields.`,
    },
    schema: [],
    type: 'problem',
    docs: {
      description: `A circuit can only have ${MAX_CONTRACT_STATES} allowed storage fields.`,
      recommended: 'error',
      url: '',
    },
  },

  create(context) {
    // Store SmartContact class name as the key and a list of `CircuitDecoratorInfo` that represents each storage state
    let smartContractMap = new Map<string, CircuitDecoratorInfo[]>()

    // Store CircuitValue class name as the key and a list of `CircuitDecoratorInfo` that represents each storage state
    let circuitValueMap = new Map<string, CircuitDecoratorInfo[]>()

    return {
      'Program:exit': function (_) {
        smartContractMap.forEach((circuitDecorators, _) => {
          let stateCount = 0
          circuitDecorators.forEach((circuitDecorator) => {
            // Check if the state decorator is held within a CircuitValue class
            // otherwise check if it is a SnarkyJS primitive to get it's state size
            if (circuitValueMap.has(circuitDecorator.decoratorType)) {
              const circuitValueStates =
                circuitValueMap.get(circuitDecorator.decoratorType) ?? []

              circuitValueStates.forEach((circuitValueState) => {
                if (circuitValueState.typeSize)
                  stateCount += circuitValueState.typeSize
              })
            } else if (isSnarkyJSPrimitive(circuitDecorator.decoratorType)) {
              const stateSize =
                SnarkyJSPrimitiveSizeInfo[
                  circuitDecorator.decoratorType as SnarkyJSPrimitiveName
                ].size
              stateCount += stateSize
            }
            if (stateCount > MAX_CONTRACT_STATES) {
              context.report({
                messageId: `noGreaterStorageLimitInCircuit`,
                loc: circuitDecorator.node.loc,
              })
            }
          })
        })
      },

      [SMART_CONTRACT_DEFINITION]: function (
        smartContractNode: TSESTree.ClassDeclaration
      ) {
        let circuitStates = [] as CircuitDecoratorInfo[]

        simpleTraverse(smartContractNode, {
          enter: (node: TSESTree.Node) => {
            const decorators = getDecorators(node)
            const stateDecorator = getSpecifiedDecorator(decorators, 'state')
            if (stateDecorator) {
              const decoratorType =
                getFirstDecoratorValue(stateDecorator) ?? getPropertyType(node)
              if (decoratorType) {
                circuitStates.push({
                  decoratorType,
                  decoratorKind: 'state',
                  node,
                })
              }
            }
          },
        })
        if (smartContractNode.id?.name)
          smartContractMap.set(smartContractNode.id?.name, circuitStates)
      },

      [CIRCUIT_VALUE_DEFINITION]: function (
        circuitValueNode: TSESTree.ClassDeclaration
      ) {
        let circuitStates = [] as CircuitDecoratorInfo[]

        simpleTraverse(circuitValueNode, {
          enter: (node: TSESTree.Node) => {
            const decorators = getDecorators(node)
            const propDecorator = getSpecifiedDecorator(decorators, 'prop')
            const arrayPropDecorator = getSpecifiedDecorator(
              decorators,
              'arrayProp'
            )
            if (propDecorator) {
              const decoratorType =
                getFirstDecoratorValue(propDecorator) ?? getPropertyType(node)

              if (decoratorType) {
                const typeSize =
                  SnarkyJSPrimitiveSizeInfo[
                    decoratorType as SnarkyJSPrimitiveName
                  ].size
                circuitStates.push({
                  decoratorType,
                  decoratorKind: 'prop',
                  typeSize,
                  node: circuitValueNode,
                })
              }
            } else if (arrayPropDecorator) {
              const decoratorType =
                getFirstDecoratorValue(arrayPropDecorator) ??
                getPropertyType(node)
              if (decoratorType) {
                const size =
                  SnarkyJSPrimitiveSizeInfo[
                    decoratorType as SnarkyJSPrimitiveName
                  ].size
                circuitStates.push({
                  decoratorType,
                  decoratorKind: 'arrayProp',
                  typeSize:
                    (getSecondDecoratorValue(arrayPropDecorator) as number)! *
                    size,
                  node: circuitValueNode,
                })
              }
            }
          },
        })
        if (circuitValueNode.id?.name)
          circuitValueMap.set(circuitValueNode.id?.name, circuitStates)
      },
    }
  },
}

export = rule
