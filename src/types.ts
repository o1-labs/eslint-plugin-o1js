export const MAX_CONTRACT_STATES = 8 as const

const SnarkyJSPrimitives = [
  'Field',
  'Bool',
  'UInt32',
  'Uint64',
  'Scalar',
  'PrivateKey',
  'Group',
  'PublicKey',
  'Signature',
] as const

export type SnarkyJSPrimitive = typeof SnarkyJSPrimitives[number]

export function getSnarkyJSPrimitive(s: string) {
  return SnarkyJSPrimitives.find((primitiveType) => s === primitiveType)
}

export const SnarkyJSPrimitiveSizeInfo = {
  Field: { size: 1 },
  Bool: { size: 1 },
  Scalar: { size: 1 },
  UInt32: { size: 1 },
  Uint64: { size: 1 },
  PrivateKey: { size: 1 },
  Group: { size: 2 },
  PublicKey: { size: 2 },
  Signature: { size: 2 },
} as Record<SnarkyJSPrimitive, { size: number }>

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
