import type { TSESTree } from '@typescript-eslint/experimental-utils'
import {
  isIdentifier,
  isLiteral,
  isFunctionDeclaration,
  isFunctionExpression,
  isMethodDefinition,
  isVariableDeclarator,
  isArrowFunctionExpression,
  isPropertyDefinition,
  isCallExpression,
  isTSTypeReference,
  isTSArrayType,
  isMemberExpression,
} from './node-utils'

export function getDecorators(
  node: TSESTree.Node | undefined
): TSESTree.Decorator[] {
  if (
    (isMethodDefinition(node) || isPropertyDefinition(node)) &&
    node.decorators
  ) {
    return node.decorators
  }
  return []
}

export function getSpecifiedDecorator(
  decorators: TSESTree.Decorator[],
  decoratorToFind: string
) {
  return decorators.find((decorator) => {
    // Check if @prop decorator
    if (isIdentifier(decorator.expression)) {
      return decorator.expression.name === decoratorToFind
    }
    // Check if @propArray<type, size> decorator
    else if (
      isCallExpression(decorator.expression) &&
      isIdentifier(decorator.expression.callee)
    ) {
      return decorator.expression.callee.name === decoratorToFind
    } else return false
  })
}

export function getDecoratorType(decorator: TSESTree.Decorator) {
  if (
    isCallExpression(decorator.expression) &&
    isIdentifier(decorator.expression.callee)
  ) {
    if (
      decorator.expression.arguments.length > 0 &&
      isIdentifier(decorator.expression.arguments[0])
    ) {
      return decorator.expression.arguments[0].name
    }
  }
  return undefined
}

export function getDecoratorTypeSize(decorator: TSESTree.Decorator) {
  if (
    isCallExpression(decorator.expression) &&
    isIdentifier(decorator.expression.callee)
  ) {
    if (
      decorator.expression.arguments.length >= 2 &&
      isLiteral(decorator.expression.arguments[1]) &&
      typeof decorator.expression.arguments[1].value === 'number'
    ) {
      return decorator.expression.arguments[1].value
    }
  }
  return undefined
}

export function getPropertyType(node: TSESTree.Node) {
  if (isPropertyDefinition(node) && node.typeAnnotation) {
    if (
      isTSTypeReference(node.typeAnnotation.typeAnnotation) &&
      isIdentifier(node.typeAnnotation.typeAnnotation.typeName)
    ) {
      return node.typeAnnotation.typeAnnotation.typeName.name
    }
    if (
      isTSArrayType(node.typeAnnotation.typeAnnotation) &&
      isTSTypeReference(node.typeAnnotation.typeAnnotation.elementType) &&
      isIdentifier(node.typeAnnotation.typeAnnotation.elementType.typeName)
    ) {
      return node.typeAnnotation.typeAnnotation.elementType.typeName.name
    }
  }
  return undefined
}

export function getFunctionName(node: TSESTree.Node) {
  if (isFunctionDeclaration(node)) {
    return node.id?.name
  } else if (isMethodDefinition(node)) {
    if (isIdentifier(node.key)) {
      return node.key.name
    }
  } else if (isFunctionExpression(node) || isArrowFunctionExpression(node)) {
    if (isVariableDeclarator(node.parent) && node.parent.init === node) {
      if (isIdentifier(node.parent.id)) return node.parent.id.name
    }
  }
  return undefined
}
export let isBanned = (
  node: TSESTree.CallExpression,
  bannedImports: Set<string>,
  bannedFunctions: Set<string>
) => {
  if (isMemberExpression(node.callee)) {
    if (
      isIdentifier(node.callee.property) &&
      isIdentifier(node.callee.object) &&
      bannedImports.has(node.callee.object.name) &&
      bannedFunctions.has(node.callee.property.name)
    ) {
      return true
    }
  } else if (
    isIdentifier(node.callee) &&
    bannedFunctions.has(node.callee.name)
  ) {
    return true
  }
  return false
}
