import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/no-json-functions-in-circuit'

const message = 'noJSONFunctionInCircuit'

ruleTester.run('no-json-functions-in-circuit', rule, {
  valid: [
    {
      code: `
      class Foo {
        async bar() {
          let a = JSON.stringify(a)
        }
      }`,
    },
    {
      code: `
      class Foo {
        async bar() {
          let t = JSON.parse(a)
        }
      }`,
    },
    {
      code: `
      class Foo {
        async bar() {
          JSON.stringify(a)
        }
      }`,
    },
    {
      code: `
      class Foo {
        async bar() {
          JSON.parse(a)
        }
      }`,
    },
  ],
  invalid: [
    {
      code: `
      class Foo {
        @method async bar() {
          let t = JSON.stringify(a)
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class Foo {
        @method async bar() {
          let t = JSON.parse(a)
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class Foo {
        @method async bar() {
          JSON.stringify(a)
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class Foo {
        @method async bar() {
          JSON.parse(a)
        }
      }`,
      errors: [{ messageId: message }],
    },
  ],
})
