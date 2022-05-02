import { ruleTester } from '../rule-tester'
import rule from '../../src/rules/always-export-in-smart-contract'

const message = 'alwaysExportSmartContract'

ruleTester.run('always-export-in-smart-contract', rule, {
  valid: [
    {
      code: `export class Foo extends SmartContract {}`,
    },
    {
      code: `
      export class Foo extends SmartContract {}
      export class Bar extends SmartContract {}
      `,
    },
    {
      code: `
      class Foo {}
      class Bar {}
      `,
    },
  ],
  invalid: [
    {
      code: `class Foo extends SmartContract {}`,
      errors: [{ messageId: message }],
    },
    {
      code: `export default class Foo extends SmartContract {}`,
      errors: [{ messageId: message }],
    },
    {
      code: `
      export class Bar extends SmartContract {}
      class Foo extends SmartContract {}
      `,
      errors: [{ messageId: message }],
    },
    {
      code: `
      export class Bar extends SmartContract {}
      export default class Foo extends SmartContract {}
      `,
      errors: [{ messageId: message }],
    },
  ],
})
