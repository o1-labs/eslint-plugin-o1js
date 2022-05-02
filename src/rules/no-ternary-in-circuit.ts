import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'
import { getFunctionName } from '../utils/ast-utils'
import {
  isCallExpression,
  isIdentifier,
  isConditionalExpression,
} from '../utils/node-utils'
import { CIRCUIT_METHOD_DECORATOR } from '../utils/selectors'

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      noTernaryInCircuit:
        'A "ternary" statement should not be used in a circuit. Please use "Circuit.if" instead.',
    },
    schema: [],
    type: 'suggestion',
    docs: {
      description:
        'A "ternary" statement should not be used in a circuit. Please use "Circuit.if" instead.',
      recommended: 'warn',
    },
  },

  create(context) {
    const snarkyCircuitMap = new Map<string, TSESTree.Node>()
    const ternarySet = new Set<string>()
    const callees: Record<string, string[]> = {}
    const callStack: (string | undefined)[] = []
    const currentFunction = () => callStack[callStack.length - 1]

    function callsTernary(functionName: string) {
      return (
        ternarySet.has(functionName) ||
        !!callees[functionName]?.some(callsTernary)
      )
    }

    return {
      'Program:exit': function () {
        for (const circuitNode of snarkyCircuitMap.values()) {
          simpleTraverse(circuitNode, {
            enter: (node: TSESTree.Node) => {
              if (isConditionalExpression(node)) {
                context.report({
                  messageId: 'noTernaryInCircuit',
                  loc: node.loc,
                })
              }
              if (
                isCallExpression(node) &&
                isIdentifier(node.callee) &&
                callsTernary(node.callee.name)
              ) {
                context.report({
                  messageId: `noTernaryInCircuit`,
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

      ConditionalExpression() {
        const functionName = currentFunction()
        if (functionName) ternarySet.add(functionName)
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
