import type { TSESLint } from '@typescript-eslint/experimental-utils'

const o1jsRules: string[] = [
  'no-greater-storage-limit-in-circuit',
  'no-if-in-circuit',
  'no-ternary-in-circuit',
  'no-throw-in-circuit',
  'no-json-functions-in-circuit',
  'no-random-in-circuit',
  'no-constructor-in-smart-contract',
]

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const o1jsRuleModules: { [key: string]: any } = {}

const configs: { recommended: TSESLint.Linter.Config } = {
  recommended: { plugins: ['o1js'], rules: {} },
}

o1jsRules.forEach((rule) => {
  o1jsRuleModules[rule] = require(`./rules/${rule}`)
  const {
    meta: {
      docs: { recommended },
    },
  } = o1jsRuleModules[rule]
  if (configs.recommended.rules) {
    configs.recommended.rules[`o1js/${rule}`] =
      recommended === false ? 'off' : recommended
  }
})

export { o1jsRuleModules as rules, configs }
