import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/no-ternary-in-circuit'

const message = 'noTernaryInCircuit'

ruleTester.run('no-ternary-in-circuit', rule, {
  valid: [
    {
      code: `
			class Foo {
				async bar() {
          let a = true ? true : false;
				}
			}`,
    },
    {
      code: `
    	function testTernary() { let a = true ? true : false; };
    	class Foo {
    		async bar() {
    			testTernary();
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
          let a = true ? true : false;
    		}
    	}`,
      errors: [{ messageId: message }],
    },
    {
      code: `
    	function testTernary() { let a = true ? true : false; };
    	class Foo {
    		@method async bar() {
    			testTernary();
    		}
    	}`,
      errors: [{ messageId: message }],
    },
    {
      code: `
    	let testTernary = () => { true ? true : false; };
      function indirectTernary() { testTernary(); }
    	class Foo {
    		@method async myMethod() {
    			indirectTernary();
    		}
    	}
      `,
      errors: [{ messageId: message }],
    },
  ],
})
