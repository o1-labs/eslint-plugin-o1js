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
      noTernaryInCircuit:
        'A "ternary" statement should not be used in a circuit. Please use "Circuit.if" instead.',
    },
    schema: [],
    type: 'suggestion',
    docs: {
      description:
        'A "ternary" statement should not be used in a circuit. Please use "Circuit.if" instead.',
      recommended: 'error',
    },
  },

  create(context) {
    let snarkyCircuitMap = new Map<string, TSESTree.Node>()
    let ternarySet = new Set<string>()

    return {
      'Program:exit': function (_node) {
        for (let circuitNode of snarkyCircuitMap.values()) {
          simpleTraverse(circuitNode, {
            enter: (node: TSESTree.Node) => {
              if (
                isCallExpression(node) &&
                isIdentifier(node.callee) &&
                ternarySet.has(node.callee.name)
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
        circuitMethodNode: TSESTree.Decorator
      ) {
        if (circuitMethodNode.parent) {
          const functionName = getFunctionName(circuitMethodNode.parent)
          if (functionName)
            snarkyCircuitMap.set(functionName, circuitMethodNode.parent)
        }
      },

      ConditionalExpression(node: TSESTree.Node) {
        crawlUpAST(node, (currentNode) => {
          const decorators = getDecorators(currentNode)
          const methodDecorator = getSpecifiedDecorator(decorators, 'method')
          const functionName = getFunctionName(currentNode)

          if (methodDecorator) {
            context.report({
              messageId: `noTernaryInCircuit`,
              loc: currentNode.loc,
            })
            return 'Stop'
          } else if (functionName) {
            ternarySet.add(functionName)
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
