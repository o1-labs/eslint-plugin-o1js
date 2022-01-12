import type { TSESLint } from '@typescript-eslint/experimental-utils'

const snarkyJSRules: string[] = [
  'no-greater-storage-limit-in-circuit',
  'no-if-in-circuit',
  'no-ternary-in-circuit',
  'no-throw-in-circuit',
  'no-json-functions-in-circuit',
  'no-random-in-circuit',
  'no-constructor-in-smart-contract',
]

const snarkyJSRuleModules: { [key: string]: any } = {}

const configs: { recommended: TSESLint.Linter.Config } = {
  recommended: { plugins: ['snarkyjs'], rules: {} },
}

snarkyJSRules.forEach((rule) => {
  snarkyJSRuleModules[rule] = require(`./rules/${rule}`)
  const {
    meta: {
      docs: { recommended },
    },
  } = snarkyJSRuleModules[rule]
  configs.recommended.rules![`snarkyjs/${rule}`] =
    recommended === false ? 'off' : recommended
})

export { snarkyJSRuleModules as rules, configs }
