import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/no-random-in-circuit'

const message = 'noRandomInCircuit'

ruleTester.run('no-random-in-circuit', rule, {
  valid: [
    {
      code: `
      class Foo {
        async bar() {
          let a = Math.random(a)
        }
      }`,
    },
    {
      code: `
      class Foo {
        async bar() {
          let t = Math.random(a)
        }
      }`,
    },
    {
      code: `
      class Foo {
        async bar() {
          Math.random(a)
        }
      }`,
    },
    {
      code: `
      class Foo {
        async bar() {
          Math.random(a)
        }
      }`,
    },
    {
      code: `
      class Foo {
        async bar() {
          crypto.getRandomValues(arr)
        }
      }`,
    },
    {
      code: `
      class Foo {
        async bar() {
          getRandomValues(arr);
        }
      }`,
    },
  ],
  invalid: [
    {
      code: `
      class Foo {
        @method async bar() {
          let t = Math.random(a)
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class Foo {
        @method async bar() {
          let t = Math.random(a)
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class Foo {
        @method async bar() {
          Math.random(a)
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class Foo {
        @method async bar() {
          Math.random(a)
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      let testRandom = () => { Math.random(); };
      function indirectRandom () { testRandom(); };
      class Foo {
        @method async bar() {
          indirectRandom();
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      let testRandom = () => { let t = Math.random(); };
      function indirectRandom() { testRandom(); };
      class Foo {
        @method async bar() {
          indirectRandom();
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class Foo {
        @method async bar() {
          crypto.getRandomValues(arr);
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class Foo {
        @method async bar() {
          getRandomValues(arr);
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      let testRandom = () => { crypto.getRandomValues(arr); };
      function indirectRandom() { testRandom(); };
      class Foo {
        @method async bar() {
          indirectRandom();
        }
      }`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      let testRandom = () => { getRandomValues(arr); };
      function indirectRandom() { testRandom(); };
      class Foo {
        @method async bar() {
          indirectRandom();
        }
      }`,
      errors: [{ messageId: message }],
    },
  ],
})
