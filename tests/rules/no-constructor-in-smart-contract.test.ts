import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/no-constructor-in-smart-contract'

const message = 'noConstructorInSmartContract'

ruleTester.run('no-constructor-in-smart-contract', rule, {
  valid: [
    {
      code: `
      class Foo {
        constructor() {};
      }`,
    },
    {
      code: `
      class Foo extends SmartContract {
     	  @method async bar() {};
      }`,
    },
  ],
  invalid: [
    {
      code: `
      class Foo extends SmartContract {
        constructor() {};
      }`,
      errors: [{ messageId: message }],
    },
  ],
})
