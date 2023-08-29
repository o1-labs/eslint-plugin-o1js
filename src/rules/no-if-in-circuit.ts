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
      recommended: 'warn',
    },
  },

  create(context) {
    const o1CircuitMap = new Map<string, TSESTree.Node>()
    const ifSet = new Set<string>()
    const callees: Record<string, string[]> = {}
    const callStack: (string | undefined)[] = []
    const currentFunction = () => callStack[callStack.length - 1]

    function callsIf(functionName: string) {
      return ifSet.has(functionName) || !!callees[functionName]?.some(callsIf)
    }

    return {
      'Program:exit': function () {
        for (const circuitNode of o1CircuitMap.values()) {
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
        circuitMethodNode: TSESTree.MethodDefinition
      ) {
        const functionName = getFunctionName(circuitMethodNode)
        if (functionName) o1CircuitMap.set(functionName, circuitMethodNode)
      },

      ':function'(node: TSESTree.Node) {
        callStack.push(getFunctionName(node))
      },

      ':function:exit'() {
        callStack.pop()
      },

      IfStatement() {
        const functionName = currentFunction()
        if (functionName) ifSet.add(functionName)
      },

      CallExpression(node: TSESTree.CallExpression) {
        const functionName = currentFunction()
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
