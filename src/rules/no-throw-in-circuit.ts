import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'
import { getFunctionName } from '../utils/ast-utils'
import {
  isCallExpression,
  isIdentifier,
  isThrowStatement,
} from '../utils/node-utils'
import { CIRCUIT_METHOD_DECORATOR } from '../utils/selectors'

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      noThrowInCircuit: 'A "throw" statement should not be used in a circuit.',
    },
    schema: [],
    type: 'problem',
    docs: {
      description: 'A "throw" statement should not be used in a circuit.',
      recommended: 'error',
    },
  },

  create(context) {
    let snarkyCircuitMap = new Map<string, TSESTree.Node>()
    let throwSet = new Set<string>()
    let callees: Record<string, string[]> = {}
    let callStack: (string | undefined)[] = []
    let currentFunction = () => callStack[callStack.length - 1]

    function callsThrow(functionName: string) {
      return (
        throwSet.has(functionName) || !!callees[functionName]?.some(callsThrow)
      )
    }

    return {
      'Program:exit': function (_) {
        for (let circuitNode of snarkyCircuitMap.values()) {
          simpleTraverse(circuitNode, {
            enter: (node: TSESTree.Node) => {
              if (isThrowStatement(node)) {
                context.report({ messageId: 'noThrowInCircuit', loc: node.loc })
              }
              if (
                isCallExpression(node) &&
                isIdentifier(node.callee) &&
                callsThrow(node.callee.name)
              ) {
                context.report({
                  messageId: `noThrowInCircuit`,
                  loc: node.loc,
                })
              }
            },
          })
        }
      },

      [CIRCUIT_METHOD_DECORATOR]: function (
        circuitMethodNode: TSESTree.MethodDefinition
      ) {
        const functionName = getFunctionName(circuitMethodNode)
        if (functionName) snarkyCircuitMap.set(functionName, circuitMethodNode)
      },

      ':function'(node: TSESTree.Node) {
        callStack.push(getFunctionName(node))
      },

      ':function:exit'() {
        callStack.pop()
      },

      ThrowStatement() {
        let functionName = currentFunction()
        if (functionName) throwSet.add(functionName)
      },

      CallExpression(node: TSESTree.CallExpression) {
        let functionName = currentFunction()
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
