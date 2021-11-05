import ts, { factory } from 'typescript'

type CreateFunctionParams = Parameters<typeof factory.createFunctionDeclaration>

export function isEqual<T extends ts.Identifier>(node: T, name: string | T): node is T {
  if (ts.isIdentifier(node)) {
    const text = typeof name === 'string' ? name : name.escapedText.toString()
    return node.escapedText.toString() === text
  }
  return false
}

/**
 * 函数配置。
 */
export interface FunctionOptions {
  decorators?: CreateFunctionParams[0],
  modifiers?: CreateFunctionParams[1],
  asteriskToken?: CreateFunctionParams[2],
  name?: CreateFunctionParams[3],
  typeParameters?: CreateFunctionParams[4],
  // 支持传单个参数
  parameters?: CreateFunctionParams[5] | CreateFunctionParams[5][0],
  type?: CreateFunctionParams[6],
  body?: CreateFunctionParams[7],
}

/**
 * 创建函数声明。
 *
 * @param options 函数配置
 */
export function createFunctionDeclaration(options: FunctionOptions) {
  // 支持传单个参数
  const params = options.parameters
  const parameters = params === undefined || Array.isArray(params) ? params : [ params ]
  return factory.createFunctionDeclaration(
    options.decorators,
    options.modifiers,
    options.asteriskToken,
    options.name,
    options.typeParameters,
    parameters ?? [],
    options.type,
    options.body
  )
}

/**
 * 使用新的配置，复制函数声明。
 *
 * @param func 要复制的函数
 * @param options 新配置
 */
export function cloneFunctionDeclaration(func: ts.FunctionDeclaration, options: FunctionOptions) {
  const config = {
    decorators: func.decorators,
    modifiers: func.modifiers,
    asteriskToken: func.asteriskToken,
    name: func.name,
    typeParameters: func.typeParameters,
    parameters: func.parameters,
    type: func.type,
    body: func.body,
    ...options
  }
  return createFunctionDeclaration(config)
}

type CreateParameterParams = Parameters<typeof factory.createParameterDeclaration>

/**
 * 参数配置。
 */
export interface ParamsOptions {
  decorators?: CreateParameterParams[0],
  modifiers?: CreateParameterParams[1],
  dotDotDotToken?: CreateParameterParams[2],
  name: CreateParameterParams[3],
  questionToken?: CreateParameterParams[4],
  type?: CreateParameterParams[5],
  initializer?: CreateParameterParams[6],
}

/**
 * 创建参数声明，若省略 type，默认为 any。
 * @param options 参数配置
 */
export function createParameterDeclaration(options: ParamsOptions) {
  const type = options.type ?? factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
  return factory.createParameterDeclaration(
    options.decorators,
    options.modifiers,
    options.dotDotDotToken,
    options.name,
    options.questionToken,
    type,
    options.initializer
  )
}

/**
 * 创建单个变量声明语句。
 *
 * @param name 变量名
 * @param initializer 初始化表达式
 * @param flags 变量类型标志，默认 const
 */
export function createSingleVariableStatement(
  name: string | ts.BindingName,
  initializer?: ts.Expression,
  flags?: ts.NodeFlags
) {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(name, undefined, undefined, initializer)
      ],
      flags ?? ts.NodeFlags.Const
    )
  )
}

/**
 * 返回符合条件的子孙对象。
 *
 * @param node 要查找的父节点
 * @param test 测试函数
 */
export function findChildByType<T extends ts.Node>(node: ts.Node, test: (node: ts.Node) => node is T): T | undefined {
  return ts.forEachChild(node, child => test(child) ? child : findChildByType(child, test))
}

/**
 * 生成绑定了名称的 isIdentifierName 函数。
 *
 * @param identifier 预绑定的名称
 */
export function isIdentifierNameFunction(identifier: ts.Identifier) {
  return (node: ts.Node): node is ts.Node =>
    ts.isIdentifier(node) && isEqual(node, identifier)
}

/**
 * 顶级函数类型。
 */
export type FunctionLike = ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration

const isArrowFunctionOrFunctionExpression = (node: ts.Node): node is FunctionLike =>
  ts.isArrowFunction(node) || ts.isFunctionExpression(node)

/**
 * 使用指定的名称，查找顶级函数。
 *
 * @param sourceFile 源文件对象
 * @param identifier 函数名称
 */
export function findTopFunction(
  sourceFile: ts.SourceFile,
  identifier: ts.Identifier
): FunctionLike | undefined {
  const isIdentifierName = isIdentifierNameFunction(identifier)
  return ts.forEachChild(sourceFile, child => {
    // const sum = (a: number, b: number) => {}
    // const sum = function name(a: number, b: number) {}
    // 更怪异的加多个无用的括号也支持
    // const sum = ((a: number, b: number) => {})
    // const sum = (function name(a: number, b: number) {})
    if (ts.isVariableStatement(child)) {
      const name = findChildByType(child, isIdentifierName)
      const found = name && findChildByType(name.parent, isArrowFunctionOrFunctionExpression)
      if (found != null) {
        return found
      }
    }

    // function sum(a: number, b: number) {}
    if (ts.isFunctionDeclaration(child)) {
      const name = findChildByType(child, isIdentifierName)
      if (name != null) {
        return child
      }
    }
  })
}

/**
 * 查找 import name from moduleName 中的 name。
 *
 * @param sourceFile 源文件对象
 * @param moduleName 模块名称
 */
export function findImport(
  sourceFile: ts.SourceFile,
  moduleName: string
) {
  return ts.forEachChild(sourceFile, child => {
    if (ts.isImportDeclaration(child)) {
      const text = child.moduleSpecifier.getText().replace(/'|"/g, '')
      if (text == moduleName) {
        return {
          importName: child.importClause?.name,
          importDeclaration: child
        }
      }
    }
  })
}

/**
 * 创建导入语句 import name from moduleName。
 *
 * @param name 导入变量名
 * @param moduleName 导入的模块名
 */
export function createImport(name: string | ts.Identifier, moduleName: string) {
  const importName = typeof name === 'string' ? factory.createUniqueName(name) : name
  const importDeclaration = factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(false, importName, undefined),
    factory.createStringLiteral(moduleName)
  )
  return { importName, importDeclaration }
}

/**
 * 确保 import name from moduleName 语句被声明，若没有声明，则添加声明。
 *
 * @param sourceFile 源文件
 * @param name 导入变量名
 * @param moduleName 导入的模块名
 */
export function ensureImport(
  sourceFile: ts.SourceFile,
  name: string | ts.Identifier,
  moduleName: string
) {
  const { importName } = findImport(sourceFile, moduleName) || {}
  return importName == null
    ? createImport(name, moduleName)
    : { importName, importDeclaration: undefined }
}

/**
 * 查找是否有 cloud.init({}) 这样的对象属性调用。
 *
 * @param sourceFile 源文件
 * @param object 对象名
 * @param name 对象属性名
 */
export function hasTopPropertyAccessCall(
  sourceFile: ts.SourceFile,
  object: string | ts.Identifier,
  property: string | ts.Identifier
) {
  const found = ts.forEachChild(sourceFile, child => {
    if (ts.isExpressionStatement(child)) {
      const call = findChildByType(child, ts.isCallExpression)
      if (call != null) {
        const access = findChildByType(call, ts.isPropertyAccessExpression)
        if (access != null) {
          const { expression, name } = access
          if (
            ts.isIdentifier(expression)
            && ts.isIdentifier(name)
            && isEqual(expression, object)
            && isEqual(name, property)
          ) {
            return call
          }
        }
      }
    }
  })
  return found !== undefined
}

/**
 * 确保 cloud.init 被调用，若没有，则添加 cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) 调用。
 *
 * @param sourceFile 源文件
 * @param object 对象名
 * @param property 对象属性名
 */
export function ensureCloudInit(
  sourceFile: ts.SourceFile,
  object: ts.Identifier
) {
  const property = 'init'
  // 若已有 cloud.init 调用，返回 undefined
  if (hasTopPropertyAccessCall(sourceFile, object, property)) {
    return undefined
  }
  // cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  // prettier-ignore
  const cloudInit = factory.createExpressionStatement(factory.createCallExpression(
    factory.createPropertyAccessExpression(object, property),
    undefined,
    [factory.createObjectLiteralExpression(
      [factory.createPropertyAssignment(
        'env',
        factory.createPropertyAccessExpression(object, 'DYNAMIC_CURRENT_ENV')
      )],
      false
    )]
  ))
  return cloudInit
}

/**
 * 判断节点的 modifiers 是否含有特定的 modifier。
 *
 * @param node 节点
 * @param kind 类型
 */
export function hasModifier(node: ts.Node, kind: ts.SyntaxKind) {
  const has = node.modifiers?.some(mod => mod.kind == kind)
  return has === true
}

/**
 * 是否含有 default 修饰符。
 *
 * @param node 节点
 */
export function hasDefault(node: ts.Node) {
  return hasModifier(node, ts.SyntaxKind.DefaultKeyword)
}

/**
 * 是否含有 export 修饰符。
 *
 * @param node 节点
 */
 export function hasExport(node: ts.Node) {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword)
}

/**
 * 获取顶层导出的 export main 函数。
 *
 * 支持以下形式：
 * export const main = async () => {}
 * export const main = function() {}
 * export async function main() {}
 * function sum() {}
 * export const main = sum
 *
 * @param node 节点
 * @param name 名称，通常为 main
 */
export function getExportMain(node: ts.Node, name: string) {
  // export const main = async () => {}
  if (ts.isVariableStatement(node) && hasExport(node)) {
    const variable = findChildByType(node, ts.isVariableDeclaration)
    if (
      variable != null
      && ts.isIdentifier(variable.name)
      && isEqual(variable.name, name)
      && variable.initializer != null
    ) {
      const main = variable.name
      if (isArrowFunctionOrFunctionExpression(variable.initializer)) {
        return { main, func: variable.initializer }
      }
      // 支持以下情况
      // function sum() {}
      // export const main = sum
      if (ts.isIdentifier(variable.initializer)) {
        const func = findTopFunction(node.getSourceFile(), variable.initializer)
        if (func != null) {
          return { main, func }
        }
      }
    }
  }

  if (ts.isFunctionDeclaration(node) && hasExport(node)) {
    if (
      node.name != null
      && ts.isIdentifier(node.name)
      && isEqual(node.name, name)
    ) {
      return { main: node.name, func: node }
    }
  }
}
