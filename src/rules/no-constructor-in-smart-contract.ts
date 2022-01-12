import type { TSESLint, TSESTree } from '@typescript-eslint/experimental-utils'
import { SMART_CONTRACT_DEFINITION } from '../utils/selectors'

const rule: TSESLint.RuleModule<string, string[]> = {
  meta: {
    messages: {
      noConstructorInSmartContract:
        'Overriding the constructor in a circuit is disallowed in snarkyjs. Please remove the constructor.',
    },
    schema: [],
    type: 'problem',
    docs: {
      description:
        'Overriding the constructor in a circuit is disallowed in snarkyjs. Please remove the constructor.',
      recommended: 'error',
    },
  },

  create(context) {
    return {
      [`${SMART_CONTRACT_DEFINITION} > ClassBody > MethodDefinition[key.name="constructor"]`]:
        function (constructorNode: TSESTree.MethodDefinition) {
          context.report({
            messageId: `noConstructorInSmartContract`,
            loc: constructorNode.loc,
          })
        },
    }
  },
}

export = rule
