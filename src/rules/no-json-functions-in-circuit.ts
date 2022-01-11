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
    let isJSONStringify = (node: TSESTree.CallExpression) => {
      if (
        isMemberExpression(node.callee) &&
        isIdentifier(node.callee.object) &&
        node.callee.object.name === 'JSON' &&
        isIdentifier(node.callee.property) &&
        node.callee.property.name === 'stringify'
      ) {
        return true
      } else {
        return false
      }
    }

    let isJSONParse = (node: TSESTree.CallExpression) => {
      if (
        isMemberExpression(node.callee) &&
        isIdentifier(node.callee.object) &&
        node.callee.object.name === 'JSON' &&
        isIdentifier(node.callee.property) &&
        node.callee.property.name === 'parse'
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
              if (
                isCallExpression(node) &&
                (isJSONStringify(node) || isJSONParse(node))
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
    }
  },
}

export = rule
