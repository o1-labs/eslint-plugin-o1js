import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/no-throw-in-circuit'

const message = 'noThrowInCircuit'

ruleTester.run('no-throw-in-circuit', rule, {
  valid: [
    {
      code: `
      class Foo {
        async bar() {
          throw "foobar";
        }
      }`,
    },
    {
      code: `
      function testThrow() { throw "test" };
      class Foo {
        async bar() {
          testThrow();
        }
      }`,
    },
    {
      code: `
      class Foo {
        @method async bar() {}
      }`,
    },
  ],
  invalid: [
    {
      code: `
      class Foo {
        @method async bar() {
          throw "foobar";
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      function testThrow() { throw "test" };
      class Foo {
        @method async bar() {
          testThrow();
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      let testThrow = () => { throw "test"; };
      function indirectThrow() { testThrow(); }
      class Foo {
        @method async myMethod() {
          indirectThrow();
        }
      }
      `,
      errors: [{ messageId: message }],
    },
  ],
})
