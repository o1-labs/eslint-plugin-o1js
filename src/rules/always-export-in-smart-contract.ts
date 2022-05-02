import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { SMART_CONTRACT_DEFINITION } from '../utils/selectors'
import { hasExportNamedDeclaration } from '../utils/node-utils'

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
    return {
      [`${SMART_CONTRACT_DEFINITION}`]: function (
        classNode: TSESTree.ClassDeclaration
      ) {
        if (classNode.parent && !hasExportNamedDeclaration(classNode.parent)) {
          context.report({
            messageId: `alwaysExportSmartContract`,
            loc: classNode.loc,
          })
        }
      },
    }
  },
}

export = rule
