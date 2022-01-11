import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'
import {
  isCallExpression,
  isIdentifier,
  isMemberExpression,
} from '../utils/node-utils'
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
    let isMathRandom = (node: TSESTree.CallExpression) => {
      if (
        isMemberExpression(node.callee) &&
        isIdentifier(node.callee.object) &&
        node.callee.object.name === 'Math' &&
        isIdentifier(node.callee.property) &&
        node.callee.property.name === 'random'
      ) {
        return true
      } else {
        return false
      }
    }

    return {
      [CIRCUIT_METHOD_DECORATOR]: function (
        circuitMethodNode: TSESTree.Decorator
      ) {
        if (circuitMethodNode.parent) {
          simpleTraverse(circuitMethodNode.parent, {
            enter: (node: TSESTree.Node) => {
              if (isCallExpression(node) && isMathRandom(node)) {
                context.report({
                  messageId: `noRandomInCircuit`,
                  loc: node.loc,
                })
              }
            },
          })
        }
      },
    }
  },
}

export = rule
