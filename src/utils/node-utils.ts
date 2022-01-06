import type { TSESTree } from '@typescript-eslint/experimental-utils'

export function isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
  return node !== undefined && node.type === 'Identifier'
}

export function isLiteral(node: TSESTree.Node): node is TSESTree.Literal {
  return node !== undefined && node.type === 'Literal'
}

export function isFunctionDeclaration(
  node: TSESTree.Node | undefined
): node is TSESTree.FunctionDeclaration {
  return node !== undefined && node.type === 'FunctionDeclaration'
}

export function isFunctionExpression(
  node: TSESTree.Node | undefined
): node is TSESTree.FunctionExpression {
  return node !== undefined && node.type === 'FunctionExpression'
}

export function isMethodDefinition(
  node: TSESTree.Node | undefined
): node is TSESTree.MethodDefinition {
  return node !== undefined && node.type === 'MethodDefinition'
}

export function isArrowFunctionExpression(
  node: TSESTree.Node | undefined
): node is TSESTree.ArrowFunctionExpression {
  return node !== undefined && node.type === 'ArrowFunctionExpression'
}

export function isVariableDeclarator(
  node: TSESTree.Node | undefined
): node is TSESTree.VariableDeclarator {
  return node !== undefined && node.type === 'VariableDeclarator'
}

export function isCallExpression(
  node: TSESTree.Node | undefined
): node is TSESTree.CallExpression {
  return node !== undefined && node.type === 'CallExpression'
}

export function isConditionalExpression(
  node: TSESTree.Node | undefined
): node is TSESTree.ConditionalExpression {
  return node !== undefined && node.type === 'ConditionalExpression'
}

export function isIfStatement(
  node: TSESTree.Node | undefined
): node is TSESTree.IfStatement {
  return node !== undefined && node.type === 'IfStatement'
}

export function isThrowStatement(
  node: TSESTree.Node | undefined
): node is TSESTree.ThrowStatement {
  return node !== undefined && node.type === 'ThrowStatement'
}

export function isClassDeclaration(
  node: TSESTree.Node | undefined
): node is TSESTree.ClassDeclaration {
  return node !== undefined && node.type === 'ClassDeclaration'
}

export function isPropertyDefinition(
  node: TSESTree.Node | undefined
): node is TSESTree.PropertyDefinition {
  return node !== undefined && node.type === 'PropertyDefinition'
}

export function isProgramStatement(
  node: TSESTree.Node | undefined
): node is TSESTree.ProgramStatement {
  return node !== undefined && node.type === 'Program'
}

export function isTSTypeReference(
  node: TSESTree.Node
): node is TSESTree.TSTypeReference {
  return node !== undefined && node.type === 'TSTypeReference'
}

export function isTSArrayType(
  node: TSESTree.Node
): node is TSESTree.TSArrayType {
  return node !== undefined && node.type === 'TSArrayType'
}
