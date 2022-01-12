import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { simpleTraverse } from '@typescript-eslint/typescript-estree'
import {
  isIdentifier,
  isMemberExpression,
  isCallExpression,
} from '../utils/node-utils'
import { getFunctionName } from '../utils/ast-utils'
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
    let snarkyCircuitMap = new Map<string, TSESTree.Node>()
    let jsonSet = new Set<string>()
    let callees: Record<string, string[]> = {}
    let callStack: (string | undefined)[] = []
    let currentFunction = () => callStack[callStack.length - 1]

    function callsJSON(functionName: string) {
      return (
        jsonSet.has(functionName) || !!callees[functionName]?.some(callsJSON)
      )
    }

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
      'Program:exit': function (_) {
        for (let circuitNode of snarkyCircuitMap.values()) {
          simpleTraverse(circuitNode, {
            enter: (node: TSESTree.Node) => {
              if (
                isCallExpression(node) &&
                (isJSONParse(node) || isJSONStringify(node))
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

      [`CallExpression[callee.object.name="JSON"]`]: function (
        callExpressionNode: TSESTree.CallExpression
      ) {
        let functionName = currentFunction()
        if (
          (isJSONParse(callExpressionNode) ||
            isJSONStringify(callExpressionNode)) &&
          functionName
        )
          jsonSet.add(functionName)
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
