import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/no-greater-storage-limit-in-circuit'

const messageId = 'noGreaterStorageLimitInCircuit'

ruleTester.run('no-greater-storage-limit-in-circuit', rule, {
  valid: [
    {
      code: `
      class A extends SmartContract {
        @state(Field) state1 = State<Field>();
      }`,
    },
    {
      code: `
      class A extends SmartContract {
        @state(Field) state1 = State<Field>();
        @state(Field) state2 = State<Field>();
        @state(Field) state3 = State<Field>();
        @state(Field) state4 = State<Field>();
        @state(Field) state5 = State<Field>();
        @state(Field) state6 = State<Field>();
        @state(Field) state7 = State<Field>();
        @state(Field) state8 = State<Field>();
      }`,
    },
    {
      code: `
      class A extends CircuitValue {
        @prop prop1: Field;
      }
      class B extends SmartContract {
        @state(A) state1 = State<A>();
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
        @state(A) state1 = State<A>();
      }`,
    },
    {
      code: `
      class A extends CircuitValue {
        @prop a: Field;
        @arrayProp(Field, 6) a: Field[];
      }
      class B extends SmartContract {
        @state(A) state1 = State<A>();
        @state(Field) value1 = State<Field>();
      }`,
    },
    {
      code: `
      class A extends CircuitValue {
        @arrayProp(PublicKey, 4) arrayProp1 = State<PublicKey[]>();
      }
      class B extends SmartContract {
        @state(A) state1 = State<A>();
      }`,
    },
    {
      code: `
      class A extends CircuitValue {
        @arrayProp(PublicKey, 3) arrayProp1: PublicKey[];
      }
      class B extends SmartContract {
        @state(A) state1 = State<A>();
        @state(Field) state1 = Field();
      }`,
    },
    {
      code: `
      class C extends CircuitValue {
        @prop prop1: Field;
      }
      class B extends CircuitValue {
        @arrayProp(C, 8) prop1: C[];
      }
      class A extends SmartContract {
        @state(B) state1 = State<B>();
      }`,
    },
  ],
  invalid: [
    {
      code: `
      class C extends CircuitValue {
        @prop prop1: Field;
        @prop prop2: Field;
      }
      class A extends CircuitValue {
        @arrayProp(C, 5) values: C[];
      }`,
      errors: [{ messageId }],
    },
    {
      code: `
      class C extends CircuitValue {
        @prop prop1: Field;
        @prop prop2: Field;
      }
      class B extends CircuitValue {
        @arrayProp(C, 1) values: C[];
        @prop prop2: Field;
      }
      class A extends CircuitValue {
        @arrayProp(B, 3) values: C[];
      }`,
      errors: [{ messageId }],
    },
    {
      code: `
      class D extends CircuitValue {
        @prop prop1: Field;
      }
      class C extends CircuitValue {
        @arrayProp(D, 1) values: D[];
        @prop prop2: Field;
      }
      class B extends CircuitValue {
        @arrayProp(C, 1) values: C[];
        @prop prop2: Field;
      }
      class A extends CircuitValue {
        @arrayProp(B, 3) values: B[];
        @prop prop2: Field;
      }`,
      errors: [{ messageId }],
    },
    {
      code: `
      class A extends CircuitValue {
        @arrayProp(B, 5) values: B[];
        @prop prop2: Field;
      }
      class B extends CircuitValue {
        @arrayProp(C, 1) values: C[];
        @prop prop2: Field;
      }
      class C extends CircuitValue {
        @arrayProp(D, 1) values: D[];
        @prop prop2: Field;
      }
      class D extends CircuitValue {
        @prop prop1: Field;
      }
      `,
      errors: [{ messageId }],
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
        @state(A) state1 = State<A>();
      }`,
      errors: [{ messageId }, { messageId }],
    },
    {
      code: `
      class A extends CircuitValue {
        @prop prop1: Field;
        @arrayProp(Field, 8) arrayProp1: Field[];
      }
      class B extends SmartContract {
        @state(A) state1 = State<A>();
      }`,
      errors: [{ messageId }, { messageId }],
    },
    {
      code: `
      class B extends CircuitValue {
        @arrayProp(Field, 8) arrayProp1: Field[];
      }
      class A extends SmartContract {
        @state(B) state1 = State<B>();
        @state(Field) value1 = State<Field>();
      }`,
      errors: [{ messageId }],
    },
    {
      code: `
      class A extends CircuitValue {
        @arrayProp(PublicKey, 5) arrayProp1: PublicKey[];
      }
      class B extends SmartContract {
        @state(A) state1 = State<A>();
      }`,
      errors: [{ messageId }, { messageId }],
    },
  ],
})
