import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'
import { isIdentifier, isCallExpression } from '../utils/node-utils'
import { getFunctionName, isBannedCallExpression } from '../utils/ast-utils'
import { CIRCUIT_METHOD_DECORATOR } from '../utils/selectors'

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      noJSONFunctionInCircuit:
        'JavaScript JSON function usage should be avoided in a circuit. The resulting values do not make it into the circuit.',
    },
    schema: [],
    type: 'suggestion',
    docs: {
      description:
        'JavaScript JSON function usage should be avoided in a circuit. The resulting values do not make it into the circuit.',
      recommended: 'warn',
    },
  },

  create(context) {
    const bannedImports = new Set<string>(['JSON'])
    const bannedFunctions = new Set<string>(['stringify', 'parse'])
    const snarkyCircuitMap = new Map<string, TSESTree.Node>()
    const jsonSet = new Set<string>()
    const callees: Record<string, string[]> = {}
    const callStack: (string | undefined)[] = []
    const currentFunction = () => callStack[callStack.length - 1]

    function callsJSON(functionName: string) {
      return (
        jsonSet.has(functionName) || !!callees[functionName]?.some(callsJSON)
      )
    }

    return {
      'Program:exit': function () {
        for (const circuitNode of snarkyCircuitMap.values()) {
          simpleTraverse(circuitNode, {
            enter: (node: TSESTree.Node) => {
              if (
                isCallExpression(node) &&
                isBannedCallExpression(node, bannedImports, bannedFunctions)
              ) {
                context.report({
                  messageId: 'noJSONFunctionInCircuit',
                  loc: node.loc,
                })
              }
              if (
                isCallExpression(node) &&
                isIdentifier(node.callee) &&
                callsJSON(node.callee.name)
              ) {
                context.report({
                  messageId: `noJSONFunctionInCircuit`,
                  loc: node.loc,
                })
              }
            },
          })
        }
      },

      ':function'(node: TSESTree.Node) {
        callStack.push(getFunctionName(node))
      },

      ':function:exit'() {
        callStack.pop()
      },

      [CIRCUIT_METHOD_DECORATOR]: function (
        circuitMethodNode: TSESTree.MethodDefinition
      ) {
        const functionName = getFunctionName(circuitMethodNode)
        if (functionName) snarkyCircuitMap.set(functionName, circuitMethodNode)
      },

      CallExpression(node: TSESTree.CallExpression) {
        const functionName = currentFunction()
        if (
          functionName &&
          isBannedCallExpression(node, bannedImports, bannedFunctions)
        ) {
          jsonSet.add(functionName)
        }
        if (functionName && isIdentifier(node.callee)) {
          const currentCallees =
            callees[functionName] || (callees[functionName] = [])
          currentCallees.push(node.callee.name)
        }
      },
    }
  },
}

export = rule
