import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/no-greater-storage-limit-in-circuit'

const message = 'noGreaterStorageLimitInCircuit'

ruleTester.run('no-greater-storage-limit-in-circuit', rule, {
  valid: [
    {
      code: `
    	class A extends SmartContract {
        @state(Field) state1: State<Field>;
    	}`,
    },
    {
      code: `
    	class A extends SmartContract {
        @state(Field) state1: State<Field>;
        @state(Field) state2: State<Field>;
        @state(Field) state3: State<Field>;
        @state(Field) state4: State<Field>;
        @state(Field) state5: State<Field>;
        @state(Field) state6: State<Field>;
        @state(Field) state7: State<Field>;
        @state(Field) state8: State<Field>;
    	}`,
    },
    {
      code: `
      class A extends CircuitValue {
        @prop prop1: Field;
      }
    	class B extends SmartContract {
        @state(A) state1: State<A>;
    	}`,
    },
    {
      code: `
      class A extends CircuitValue {
        @prop prop1: Field;
        @prop prop2: Field;
        @prop prop3: Field;
        @prop prop4: Field;
        @prop prop5: Field;
        @prop prop7: Field;
        @prop prop7: Field;
        @prop prop8: Field;
      }
    	class B extends SmartContract {
        @state(A) state1: State<A>;
    	}`,
    },
    {
      code: `
      class A extends CircuitValue {
        @prop a: Field;
        @arrayProp(Field, 6) a: Field[];
      }
    	class B extends SmartContract {
        @state(A) state1: State<A>;
        @state(Field) value1: Field;
    	}`,
    },
  ],
  invalid: [
    {
      code: `
    	class A extends SmartContract {
        @state(Field) state1: State<Field>;
        @state(Field) state2: State<Field>;
        @state(Field) state3: State<Field>;
        @state(Field) state4: State<Field>;
        @state(Field) state5: State<Field>;
        @state(Field) state6: State<Field>;
        @state(Field) state7: State<Field>;
        @state(Field) state8: State<Field>;
        @state(Field) state9: State<Field>;
    	}`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class A extends CircuitValue {
        @prop prop1: Field;
        @prop prop2: Field;
        @prop prop3: Field;
        @prop prop4: Field;
        @prop prop5: Field;
        @prop prop6: Field;
        @prop prop7: Field;
        @prop prop8: Field;
        @prop prop9: Field;
      }
    	class B extends SmartContract {
        @state(A) state1: State<A>;
    	}`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class A extends CircuitValue {
        @prop prop1: Field;
        @arrayProp(Field, 8) arrayProp1: Field[];
      }
    	class B extends SmartContract {
        @state(A) state1: State<A>;
    	}`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      class A extends CircuitValue {
        @arrayProp(Field, 8) arrayProp1: Field[];
      }
    	class B extends SmartContract {
        @state(A) state1: State<A>;
        @state(Field) value1: Field;
    	}`,
      errors: [{ messageId: message }],
    },
  ],
})
