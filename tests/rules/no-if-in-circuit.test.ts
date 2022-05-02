import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/no-if-in-circuit'

const message = 'noIfInCircuit'

ruleTester.run('no-if-in-circuit', rule, {
  valid: [
    {
      code: `
      class Foo {
        async bar() {
          if(true) {};
        }
      }`,
    },
    {
      code: `
      function testIf() { if (true) {}; };
      class Foo {
        async bar() {
          testIf();
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
          if (true) {};
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      function testIf() { if (true) {}; };
      class Foo {
        @method async bar() {
         testIf();
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      let testIf = () => { if (true); };
      function indirectIf() { testIf(); }
      class Foo {
        @method async myMethod() {
          indirectIf();
        }
      }
      `,
      errors: [{ messageId: message }],
    },
  ],
})
