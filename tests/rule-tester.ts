import { RuleTester } from '@typescript-eslint/experimental-utils/dist/eslint-utils'

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

const ruleTesterScript = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
})

export { ruleTester, ruleTesterScript, RuleTester }
