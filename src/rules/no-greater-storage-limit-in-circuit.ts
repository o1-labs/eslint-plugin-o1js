import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import type { ContractTypeKind } from '../types'
import {
  MAX_CONTRACT_STATES,
  geto1jsPrimitive,
  o1jsPrimitiveSizeInfo,
} from '../types'
import {
  getSecondDecoratorValue,
  getValidDecorator,
  getPropertyType,
  getFirstDecoratorValue,
  getClassBodyStatements,
  getClassName,
} from '../utils/ast-utils'
import {
  SMART_CONTRACT_DEFINITION,
  CIRCUIT_VALUE_DEFINITION,
} from '../utils/selectors'

interface UnknownStateInfo {
  kind: 'UnknownStateInfo'
  type: ContractTypeKind
  dependsOn: string
  node: TSESTree.Node
}

interface KnownStateInfo {
  kind: 'KnownStateInfo'
  type: ContractTypeKind
  size: number
  node: TSESTree.Node
  reported: boolean
}

type StateInfo = UnknownStateInfo | KnownStateInfo

// A map containing all Smart Contracts that we can immediately derive state count from
const knownContractState = new Map<string, KnownStateInfo[]>()
// A map containing all Smart Contracts that need their state to be derived from other Smart Contracts
const unknownContractState = new Map<string, StateInfo[]>()

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      noGreaterStorageLimitInCircuit: `A Smart Contract can only have ${MAX_CONTRACT_STATES} allowed storage fields.`,
    },
    schema: [],
    type: 'problem',
    docs: {
      description: `A Smart Contract can only have ${MAX_CONTRACT_STATES} allowed storage fields.`,
      recommended: 'error',
      url: '',
    },
  },

  create(context) {
    return {
      'Program:exit': function () {
        let derivedUnknownState = true
        // Continue to derive unknown states if we can succesfully derive a previous unknown state.
        while (derivedUnknownState) {
          derivedUnknownState = false // Assume we can't derive an unknown state to break out of the while
          unknownContractState.forEach((stateInfo, className) => {
            stateInfo = stateInfo.map((state) => {
              if (state.kind === 'UnknownStateInfo') {
                const { dependsOn, type, node } = state
                const contractState = knownContractState.get(dependsOn) ?? []
                const contractStateCount = calculateContractState(contractState)

                // Succesfully derived an unknown state, continue looping in the parent while loop
                if (contractStateCount > 0) {
                  derivedUnknownState = true
                  return {
                    kind: 'KnownStateInfo',
                    size: contractStateCount,
                    type,
                    node,
                  } as KnownStateInfo
                }
              }
              return state
            })

            const unknownRemaining = stateInfo.filter((state) => {
              return state.kind === 'UnknownStateInfo'
            }).length

            if (unknownRemaining === 0) {
              unknownContractState.delete(className)
              knownContractState.set(className, stateInfo as KnownStateInfo[])
            }
          })
        }

        for (const [, contractState] of knownContractState) {
          const stateDecoratorInfo = getStateDecoratorInfo(contractState)
          const contractStateCount = calculateContractState(contractState)
          if (stateDecoratorInfo && !stateDecoratorInfo.reported) {
            if (contractStateCount > MAX_CONTRACT_STATES) {
              context.report({
                messageId: `noGreaterStorageLimitInCircuit`,
                loc: stateDecoratorInfo.node.loc,
              })
              stateDecoratorInfo.reported = true // Set reported to true to avoid reporting same error in multiple files
            }
          }
        }
      },

      [SMART_CONTRACT_DEFINITION]: function (
        smartContractNode: TSESTree.ClassDeclaration
      ) {
        findKnownAndUnknownStates(smartContractNode)
      },

      [CIRCUIT_VALUE_DEFINITION]: function (
        circuitValueNode: TSESTree.ClassDeclaration
      ) {
        findKnownAndUnknownStates(circuitValueNode)
      },
    }
  },
}

function calculateContractState(contractState: KnownStateInfo[]) {
  return contractState.reduce((acc, state) => {
    if (state.type.kind === 'arrayProp') {
      return acc + state.size * state.type.arrayPropLength
    } else {
      return acc + state.size
    }
  }, 0)
}

function getStateDecoratorInfo(stateInfo: KnownStateInfo[]) {
  return stateInfo.find((state) => {
    return state.type.kind === 'state'
  })
}

function findKnownAndUnknownStates(
  smartContractNode: TSESTree.ClassDeclaration
) {
  const stateInfo: StateInfo[] = []
  const classBody = getClassBodyStatements(smartContractNode) ?? []
  let isAllPrimitiveState = true

  for (const classStatement of classBody) {
    // Get the kind of decorator (`prop`, `state` or `arrayProp`) as well as the TS decorator node
    const decorator = getValidDecorator(classStatement)

    if (!decorator) {
      continue
    }

    // Get the user specified type from the decorator node (e.g `Field`, `Group` or a CircuitValue)
    const o1DecoratorType =
      getFirstDecoratorValue(decorator.decorator) ??
      getPropertyType(classStatement)

    if (!o1DecoratorType) {
      continue
    }

    // If the decorator type is a o1js primitive, get it's value
    const primitive = geto1jsPrimitive(o1DecoratorType)
    if (!primitive) {
      isAllPrimitiveState = false
    }

    if (decorator.kind === 'prop' || decorator.kind === 'state') {
      if (primitive) {
        const { size } = o1jsPrimitiveSizeInfo[primitive]
        stateInfo.push({
          kind: 'KnownStateInfo',
          type: { kind: decorator.kind },
          node: smartContractNode,
          reported: false,
          size,
        })
      } else {
        stateInfo.push({
          kind: 'UnknownStateInfo',
          type: {
            kind: decorator.kind,
          },
          node: smartContractNode,
          dependsOn: o1DecoratorType,
        })
      }
    } else if (decorator.kind === 'arrayProp') {
      const arrayPropLength =
        (getSecondDecoratorValue(decorator.decorator) as number) ?? 0
      if (primitive) {
        const { size } = o1jsPrimitiveSizeInfo[primitive]
        stateInfo.push({
          kind: 'KnownStateInfo',
          type: {
            kind: decorator.kind,
            arrayPropLength,
          },
          node: smartContractNode,
          reported: false,
          size,
        })
      } else {
        stateInfo.push({
          kind: 'UnknownStateInfo',
          type: {
            kind: decorator.kind,
            arrayPropLength,
          },
          node: smartContractNode,
          dependsOn: o1DecoratorType,
        })
      }
    }
  }

  // If all decorators are a o1js primitive, we can calculate the Smart Contract state count and
  // insert it into the `knownContractStateMap`. If the user specifies a CircuitValue, we store the state info
  // in `unknownContractState` to derive it's state count later.
  const className = getClassName(smartContractNode) ?? ''
  if (isAllPrimitiveState) {
    knownContractState.set(className, stateInfo as KnownStateInfo[])
  } else {
    unknownContractState.set(className, stateInfo)
  }
}

export = rule
