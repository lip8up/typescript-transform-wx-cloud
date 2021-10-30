import ts, { TransformationContext, Transformer, SourceFile, Visitor, Node } from 'typescript'

const factory = ts.factory
const wxCloudFunctionName = 'main'
const wxCloudParamName = 'event'

function generateWxParams(parameters: ts.NodeArray<ts.ParameterDeclaration>) {
  const callParams = parameters.map(param => {
  })
}

/**
 * 生成微信导出函数。
 *
 * 函数中的表达式，使用以下网址生成：
 *
 * https://ts-ast-viewer.com/#code/KYDwDg9gTgLgBAQwM4E8B2BjOAzArpmASwjTgFsFC0AKYAN2DRgC5E0UBKOAbwCg4BcKMBi4opACbBsCXABsYAfQCMtBkwB0CADRx6jGBoBGHXgF8gA
 *
 * 生成的函数举例：
 *
 * ```ts
 * export async function main(event: any) {
 *   return default_1(event.a, event.b)
 * }
 * ```
 *
 * @param idDefault   默认导出的函数
 * @param parameters  函数参数
 */
function generateWxMain(idDefault: ts.Identifier, parameters: ts.NodeArray<ts.ParameterDeclaration>) {
  const cloudParam = factory.createIdentifier(wxCloudParamName)
  const callParams = parameters.map(param => {
  })
  factory.createFunctionDeclaration(
    undefined,
    [
      factory.createModifier(ts.SyntaxKind.ExportKeyword),
      factory.createModifier(ts.SyntaxKind.AsyncKeyword)
    ],
    undefined,
    factory.createIdentifier(wxCloudFunctionName),
    undefined,
    [factory.createParameterDeclaration(
      undefined,
      undefined,
      undefined,
      cloudParam,
      undefined,
      factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
      undefined
    )],
    undefined,
    factory.createBlock(
      [factory.createReturnStatement(factory.createCallExpression(
        idDefault,
        undefined,
        [
          factory.createPropertyAccessExpression(
            cloudParam,
            factory.createIdentifier("a")
          ),
          factory.createPropertyAccessExpression(
            cloudParam,
            factory.createIdentifier("b")
          )
        ]
      ))],
      true
    )
  )
}

function updateExportAssignment(node: Node, ctx: TransformationContext) {
  const nodeList: Node[] = []

  const exportAssignment = node as ts.ExportAssignment
  const exprNode = exportAssignment.expression

  // const visitor: Visitor = node => {
    if (ts.isArrowFunction(exprNode)) {
      const idDefault = factory.createUniqueName('default')
      const declaration = factory.createVariableDeclaration(idDefault, undefined, undefined, exprNode)
      const declarationList = factory.createVariableDeclarationList([declaration], ts.NodeFlags.Const)
      const statement = factory.createVariableStatement(undefined, declarationList)
      nodeList.push(statement)

      return statement

      const arrowFunction = node as ts.ArrowFunction
      const parameters = arrowFunction.parameters


    }

    // return ts.visitEachChild(node, visitor, ctx)
  // }

  // const remain = ts.visitEachChild(node, visitor, ctx)

  return node

  // return [ ...nodeList, remain ]
}

function transformer(ctx: TransformationContext): Transformer<SourceFile> {
  const visitor: Visitor = node => {
    if (ts.isExportAssignment(node)) {
      return updateExportAssignment(node, ctx)
    }

    return ts.visitEachChild(node, visitor, ctx)
  }

  return (sf: SourceFile) => {
    return ts.visitNode(sf, visitor)
  }
}

export default transformer
