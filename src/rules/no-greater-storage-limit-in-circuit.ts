import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'

import {
  getDecorators,
  getDecoratorTypeSize,
  getSpecifiedDecorator,
  getPropertyType,
  getDecoratorType,
} from '../utils/ast-utils'
import {
  SMART_CONTRACT_DEFINITION,
  CIRCUIT_VALUE_DEFINITION,
} from '../utils/selectors'

const MAX_CONTRACT_STATES = 8

const SnarkyJSPrimitive = [
  'Field',
  'Bool',
  'Circuit',
  'Poseidon',
  'Group',
  'Scalar',
] as const
type SnarkyJSPrimitive = typeof SnarkyJSPrimitive[number]
const isSnarkyJSPrimitive = (p: any): p is SnarkyJSPrimitive =>
  SnarkyJSPrimitive.includes(p)

type CircuitDecoratorInfo = {
  decoratorType: string
  kind: 'state' | 'arrayProp' | 'prop'
  size?: number
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
    fixable: 'code',
  },

  create(context) {
    let smartContractMap = new Map<string, CircuitDecoratorInfo[]>()
    let circuitValueMap = new Map<string, CircuitDecoratorInfo[]>()

    return {
      'Program:exit': function (_) {
        for (const smartContractStates of smartContractMap.values()) {
          let stateCount = 0
          for (const circuitDecorator of smartContractStates) {
            // Check if the state decorator is held within a CircuitValue otherwise check if it is a SnarkyJS primitive
            if (circuitValueMap.has(circuitDecorator.decoratorType)) {
              const circuitStates =
                circuitValueMap.get(circuitDecorator.decoratorType) || []
              for (let circuitState of circuitStates) {
                if (circuitState.size) {
                  stateCount += circuitState.size
                }
              }
            } else if (isSnarkyJSPrimitive(circuitDecorator.decoratorType)) {
              stateCount++
            }
            if (stateCount > MAX_CONTRACT_STATES) {
              context.report({
                messageId: `noGreaterStorageLimitInCircuit`,
                loc: circuitDecorator.node.loc,
              })
            }
          }
        }
      },

      [SMART_CONTRACT_DEFINITION]: function (smartContractNode: TSESTree.Node) {
        let parent = smartContractNode.parent as TSESTree.ClassDeclaration
        if (parent) {
          let circuitStates = [] as CircuitDecoratorInfo[]

          simpleTraverse(parent, {
            enter: (node: TSESTree.Node) => {
              const decorators = getDecorators(node)
              const stateDecorator = getSpecifiedDecorator(decorators, 'state')
              if (stateDecorator) {
                const decoratorType =
                  getDecoratorType(stateDecorator) || getPropertyType(node)
                if (decoratorType) {
                  circuitStates.push({
                    decoratorType,
                    kind: 'state',
                    node,
                  })
                }
              }
            },
          })
          if (parent.id?.name)
            smartContractMap.set(parent.id?.name, circuitStates)
        }
      },

      [CIRCUIT_VALUE_DEFINITION]: function (circuitValueNode: TSESTree.Node) {
        let parent = circuitValueNode.parent as TSESTree.ClassDeclaration
        if (parent) {
          let circuitStates = [] as CircuitDecoratorInfo[]

          simpleTraverse(parent, {
            enter: (node: TSESTree.Node) => {
              const decorators = getDecorators(node)
              const propDecorator = getSpecifiedDecorator(decorators, 'prop')
              const arrayPropDecorator = getSpecifiedDecorator(
                decorators,
                'arrayProp'
              )
              if (propDecorator) {
                const decoratorType =
                  getDecoratorType(propDecorator) || getPropertyType(node)
                if (decoratorType) {
                  circuitStates.push({
                    decoratorType,
                    kind: 'prop',
                    size: 1,
                    node: parent,
                  })
                }
              } else if (arrayPropDecorator) {
                const decoratorType =
                  getDecoratorType(arrayPropDecorator) || getPropertyType(node)
                if (decoratorType) {
                  circuitStates.push({
                    decoratorType,
                    kind: 'arrayProp',
                    size: getDecoratorTypeSize(arrayPropDecorator)!,
                    node: parent,
                  })
                }
              }
            },
          })
          if (parent.id?.name)
            circuitValueMap.set(parent.id?.name, circuitStates)
        }
      },
    }
  },
}

export = rule
