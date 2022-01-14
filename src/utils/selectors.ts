export const CIRCUIT_METHOD_DECORATOR =
  'MethodDefinition:has(Decorator[expression.name="method"])'

export const SMART_CONTRACT_DEFINITION =
  'ClassDeclaration:has(Identifier[name="SmartContract"])'

export const CIRCUIT_VALUE_DEFINITION =
  'ClassDeclaration:has(Identifier[name="CircuitValue"])'
