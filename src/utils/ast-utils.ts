import type { TSESTree } from '@typescript-eslint/experimental-utils'
import type { ContractStateType } from '../types'
import { findValidContractType } from '../types'
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
  isClassDeclaration,
} from './node-utils'

/**
 * Get a list of all decorators on a node.
 * @param node Node to get decorators from
 * @returns A list of decorators. Returns an empty list if none are found.
 */
export function getDecorators(node: TSESTree.Node): TSESTree.Decorator[] {
  if (
    (isMethodDefinition(node) || isPropertyDefinition(node)) &&
    node.decorators
  ) {
    return node.decorators
  }
  return []
}

/**
 * Return an object that contains what kind of SnarkyJS decorator was used
 * (e.g `@state` `@prop`, or `@arrayProp`)
 * and the decorator node.
 * @param node The node to get the decorators from
 * @returns An object indicating what decorator was used and the node
 */
export function getValidDecorator(node: TSESTree.Node) {
  let decorators = getDecorators(node)
  for (const decorator of decorators) {
    if (isIdentifier(decorator.expression)) {
      const decoratorName = decorator.expression.name
      const validDecorator = findValidContractType(decoratorName)
      if (validDecorator) {
        return {
          kind: validDecorator as ContractStateType,
          decorator,
        }
      }
    } else if (
      isCallExpression(decorator.expression) &&
      isIdentifier(decorator.expression.callee)
    ) {
      const decoratorName = decorator.expression.callee.name
      const validDecorator = findValidContractType(decoratorName)
      if (validDecorator) {
        return {
          kind: validDecorator as ContractStateType,
          decorator,
        }
      }
    }
  }
  return undefined
}

/**
 * Gets the first value of a decorator expression if it has one, otherwiser returns `undefined`.
 * For example, if called on `@state(T)`, it will return `T`.
 * @param decorator The specified decorator
 * @returns The first value of the decorator or undefined
 */
export function getFirstDecoratorValue(decorator: TSESTree.Decorator) {
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
/**
 * Gets the second value of a decorator expression if it has one, otherwise returns `undefined`.
 * For example, if called on `@state(T, U)`, it will return `U`
 * @param decorator The specified decorator
 * @returns The second value of the decorator or undefined
 */
export function getSecondDecoratorValue(decorator: TSESTree.Decorator) {
  if (
    isCallExpression(decorator.expression) &&
    isIdentifier(decorator.expression.callee)
  ) {
    if (
      decorator.expression.arguments.length >= 2 &&
      isLiteral(decorator.expression.arguments[1])
    ) {
      return decorator.expression.arguments[1].value
    }
  }
  return undefined
}

/**
 * Gets the annotated type of a node if it has one. For example, if a node has the statement
 * `node: T`, it will return `T`. Otherwise return undefined.
 * @param node The specified node
 * @returns The type annotation of the node or undefined
 */
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

/**
 * Gets the function name of a node if it has one, otherwise return undefined.
 * @param node The specified node
 * @returns The function name or undefined
 */
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

/**
 */
export function getClassBodyStatements(node: TSESTree.Node) {
  if (isClassDeclaration(node)) {
    return node.body.body
  }
  return undefined
}

export function getClassName(node: TSESTree.Node) {
  if (isClassDeclaration(node)) {
    return node.id?.name
  }
  return undefined
}

/**
 * Checks to see if the specified `CallExpression` node uses a banned import or calls upon
 * a banned function.
 * @param node The specified `CallExpression` node
 * @param bannedImports A set of banned imports
 * @param bannedFunctions A set of banned functions
 * @returns True if the `CallExpression` calls on a banned import or function or false
 */
export let isBannedCallExpression = (
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
