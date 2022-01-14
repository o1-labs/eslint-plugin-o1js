import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'
import { isIdentifier, isCallExpression } from '../utils/node-utils'
import { getFunctionName, isBannedCallExpression } from '../utils/ast-utils'
import { CIRCUIT_METHOD_DECORATOR } from '../utils/selectors'

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      noRandomInCircuit:
        'JavaScript randomness usage should be avoided in a circuit. The randomness cannot be verified and thus should not be included in a circuit',
    },
    schema: [],
    type: 'suggestion',
    docs: {
      description:
        'JavaScript randomness usage should be avoided in a circuit. The randomness cannot be verified and thus should not be included in a circuit',
      recommended: 'warn',
    },
  },

  create(context) {
    const bannedImports = new Set<string>(['Math', 'crypto'])
    const bannedFunctions = new Set<string>([
      'random',
      'getRandomValues',
      'randomBytes',
    ])
    let snarkyCircuitMap = new Map<string, TSESTree.Node>()
    let randomSet = new Set<string>()
    let callees: Record<string, string[]> = {}
    let callStack: (string | undefined)[] = []
    let currentFunction = () => callStack[callStack.length - 1]

    function callsRandom(functionName: string) {
      return (
        randomSet.has(functionName) ||
        !!callees[functionName]?.some(callsRandom)
      )
    }

    return {
      'Program:exit': function (_) {
        for (let circuitNode of snarkyCircuitMap.values()) {
          simpleTraverse(circuitNode, {
            enter: (node: TSESTree.Node) => {
              if (
                isCallExpression(node) &&
                isBannedCallExpression(node, bannedImports, bannedFunctions)
              ) {
                context.report({
                  messageId: 'noRandomInCircuit',
                  loc: node.loc,
                })
              }
              if (
                isCallExpression(node) &&
                isIdentifier(node.callee) &&
                callsRandom(node.callee.name)
              ) {
                context.report({
                  messageId: `noRandomInCircuit`,
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
        let functionName = currentFunction()
        if (
          functionName &&
          isBannedCallExpression(node, bannedImports, bannedFunctions)
        ) {
          randomSet.add(functionName)
        }
        if (functionName && isIdentifier(node.callee)) {
          let currentCallees =
            callees[functionName] || (callees[functionName] = [])
          currentCallees.push(node.callee.name)
        }
      },
    }
  },
}

export = rule
