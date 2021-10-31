import ts, { factory } from 'typescript'

type CreateFunctionParams = Parameters<typeof factory.createFunctionDeclaration>

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

type CreateVariableParams = Parameters<typeof factory.createVariableDeclaration>
type VariableName = CreateVariableParams[0]

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
export function findChildByType<T extends ts.Node>(node: ts.Node, test: (node: ts.Node) => boolean): T | undefined {
  return ts.forEachChild(node, child => test(child) ? child as T : findChildByType(child, test))
}

/**
 * 生成绑定了名称的 isIdentifierName 函数。
 *
 * @param identifier 预绑定的名称
 */
export function isIdentifierNameFunction(identifier: ts.Identifier) {
  const name = identifier.escapedText.toString()
  return (node: ts.Node) => ts.isIdentifier(node) && node.escapedText.toString() == name
}

/**
 * 顶级函数类型。
 */
export type FunctionLike = ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration

/**
 * 使用指定的名称，查找顶级函数。
 *
 * @param sourceFile 源文件对象
 * @param identifier 函数名称
 */
export function findTopLevelFunctionByIdentifier(
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
      const found = name && findChildByType<FunctionLike>(name.parent, n => ts.isArrowFunction(n) || ts.isFunctionExpression(n))
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
