import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'
import { getFunctionName } from '../utils/ast-utils'
import {
  isCallExpression,
  isIdentifier,
  isIfStatement,
} from '../utils/node-utils'
import { CIRCUIT_METHOD_DECORATOR } from '../utils/selectors'

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      noIfInCircuit:
        'A "if" statement should not be used in a circuit. Please use "Circuit.if" instead.',
    },
    schema: [],
    type: 'suggestion',
    docs: {
      description:
        'A "if" statement should not be used in a circuit. Please use "Circuit.if" instead.',
      recommended: 'error',
    },
  },

  create(context) {
    let snarkyCircuitMap = new Map<string, TSESTree.Node>()
    let ifSet = new Set<string>()
    let callees: Record<string, string[]> = {}
    let callStack: (string | undefined)[] = []
    let currentFunction = () => callStack[callStack.length - 1]

    function callsIf(functionName: string) {
      return ifSet.has(functionName) || !!callees[functionName]?.some(callsIf)
    }

    return {
      'Program:exit': function (_node) {
        for (let circuitNode of snarkyCircuitMap.values()) {
          simpleTraverse(circuitNode, {
            enter: (node: TSESTree.Node) => {
              if (isIfStatement(node)) {
                context.report({ messageId: 'noIfInCircuit', loc: node.loc })
              }
              if (
                isCallExpression(node) &&
                isIdentifier(node.callee) &&
                callsIf(node.callee.name)
              ) {
                context.report({
                  messageId: `noIfInCircuit`,
                  loc: node.loc,
                })
              }
            },
          })
        }
      },

      [CIRCUIT_METHOD_DECORATOR]: function (
        circuitMethodNode: TSESTree.Decorator
      ) {
        if (circuitMethodNode.parent) {
          const functionName = getFunctionName(circuitMethodNode.parent)
          if (functionName)
            snarkyCircuitMap.set(functionName, circuitMethodNode.parent)
        }
      },

      ':function'(node: TSESTree.Node) {
        callStack.push(getFunctionName(node))
      },

      ':function:exit'() {
        callStack.pop()
      },

      IfStatement() {
        let functionName = currentFunction()
        if (functionName) ifSet.add(functionName)
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
