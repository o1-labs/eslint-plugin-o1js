import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'
import {
  getDecorators,
  getFunctionName,
  getSpecifiedDecorator,
  crawlUpAST,
} from '../utils/ast-utils'
import {
  isCallExpression,
  isIdentifier,
  isProgramStatement,
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

    return {
      'Program:exit': function (_) {
        for (let circuitNode of snarkyCircuitMap.values()) {
          simpleTraverse(circuitNode, {
            enter: (node: TSESTree.Node) => {
              if (
                isCallExpression(node) &&
                isIdentifier(node.callee) &&
                throwSet.has(node.callee.name)
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
        circuitMethodNode: TSESTree.Decorator
      ) {
        if (circuitMethodNode.parent) {
          const functionName = getFunctionName(circuitMethodNode.parent)
          if (functionName)
            snarkyCircuitMap.set(functionName, circuitMethodNode.parent)
        }
      },

      ThrowStatement(throwNode: TSESTree.Node) {
        crawlUpAST(throwNode, (currentNode) => {
          const decorators = getDecorators(currentNode)
          const methodDecorator = getSpecifiedDecorator(decorators, 'method')
          const functionName = getFunctionName(currentNode)

          if (methodDecorator) {
            context.report({
              messageId: `noThrowInCircuit`,
              loc: throwNode.loc,
            })
            return 'Stop'
          } else if (functionName) {
            throwSet.add(functionName)
            return 'Stop'
          } else if (isProgramStatement(currentNode)) {
            return 'Stop'
          }
          return 'Continue'
        })
      },
    }
  },
}

export = rule
