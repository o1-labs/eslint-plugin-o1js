import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { SMART_CONTRACT_DEFINITION } from '../utils/selectors'
import { hasExportNamedDeclaration } from '../utils/node-utils'
import { getClassName } from '../utils/ast-utils'

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      alwaysExportSmartContract:
        'All Smart Contracts should be exported using a named export. Please add `export` to your Smart Contract class',
    },
    schema: [],
    type: 'problem',
    docs: {
      description:
        'All Smart Contracts should be exported using a named export. Please add `export` to your Smart Contract class',
      recommended: 'error',
    },
  },

  create(context) {
    const smartContracts = new Map<string, TSESTree.Node>()
    const exportedContracts = new Map<string, TSESTree.Node>()

    return {
      'Program:exit': function () {
        // Check if all Smart Contracts are exported
        for (const [name, node] of smartContracts) {
          if (!exportedContracts.has(name)) {
            context.report({
              node,
              messageId: 'alwaysExportSmartContract',
            })
          }
        }
      },
      ExportNamedDeclaration: function (
        classNode: TSESTree.ExportNamedDeclaration
      ) {
        classNode.specifiers.forEach((specifier) => {
          if (specifier.type === 'ExportSpecifier') {
            const className = specifier.local.name
            if (className) exportedContracts.set(className, specifier)
          }
        })
      },
      [`${SMART_CONTRACT_DEFINITION}`]: function (
        classNode: TSESTree.ClassDeclaration
      ) {
        const className = getClassName(classNode)
        if (classNode.parent && hasExportNamedDeclaration(classNode.parent)) {
          if (className) exportedContracts.set(className, classNode)
        } else {
          if (className) smartContracts.set(className, classNode)
        }
      },
    }
  },
}

export = rule
