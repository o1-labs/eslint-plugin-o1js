export const MAX_CONTRACT_STATES = 8 as const

const o1jsPrimitives = [
  'Field',
  'Bool',
  'UInt32',
  'UInt64',
  'Scalar',
  'PrivateKey',
  'Group',
  'PublicKey',
  'Signature',
] as const

export type o1jsPrimitive = typeof o1jsPrimitives[number]

export function geto1jsPrimitive(s: string) {
  return o1jsPrimitives.find((primitiveType) => s === primitiveType)
}

export const o1jsPrimitiveSizeInfo = {
  Field: { size: 1 },
  Bool: { size: 1 },
  Scalar: { size: 1 },
  UInt32: { size: 1 },
  UInt64: { size: 1 },
  PrivateKey: { size: 1 },
  Group: { size: 2 },
  PublicKey: { size: 2 },
  Signature: { size: 2 },
} as Record<o1jsPrimitive, { size: number }>

export type PropKind = {
  kind: 'prop'
}

export type ArrayPropKind = {
  kind: 'arrayProp'
  arrayPropLength: number
}

export type StateKind = {
  kind: 'state'
  size?: number
}

export const ContractStateTypes = ['prop', 'arrayProp', 'state'] as const
export function findValidContractType(s: string) {
  return ContractStateTypes.find((type) => s === type)
}

export type ContractStateType = typeof ContractStateTypes[number]
export type ContractTypeKind = PropKind | ArrayPropKind | StateKind
