import ts, { factory } from 'typescript'
import {
  createFunctionDeclaration,
  cloneFunctionDeclaration,
  createParameterDeclaration,
  createSingleVariableStatement,
  findChildByType,
  findTopLevelFunctionByIdentifier
} from './util'

const wxCloudFunctionName = 'main'
const wxCloudParamName = 'event'

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
 * @param func 导出的函数
 * @param parameters 函数参数
 */
function generateWxMain(func: ts.Identifier, params: ts.NodeArray<ts.ParameterDeclaration>) {
  const cloudParam = factory.createIdentifier(wxCloudParamName)
  const wxParams: string[] = []
  const callParams = params.map(param => {
    const name = param.name as ts.Identifier
    wxParams.push(name.escapedText.toString())
    return factory.createPropertyAccessExpression(cloudParam, name)
  })
  // export async function main(event: any) {
  //   return default_1(event.a, event.b)
  // }
  // prettier-ignore
  const wxMain = createFunctionDeclaration({
    modifiers: [
      factory.createModifier(ts.SyntaxKind.ExportKeyword),
      factory.createModifier(ts.SyntaxKind.AsyncKeyword)
    ],
    name: factory.createIdentifier(wxCloudFunctionName),
    parameters: createParameterDeclaration({ name: cloudParam }),
    body: factory.createBlock(
      [
        // return default_1(event.a, event.b)
        factory.createReturnStatement(
          factory.createCallExpression(func, undefined, callParams)
        )
      ],
      true
    )
  })
  return { wxMain, wxParams }
}

/**
 * 处理 export default async (a: number, b: number) => {} 语句
 *
 * @param node 节点
 */
function dealExportAssignment(node: ts.ExportAssignment) {
  // export default async (a: number, b: number) => {}
  const arrowFunction = findChildByType<ts.ArrowFunction>(node, ts.isArrowFunction)
  if (arrowFunction != null) {
    // const default_1 = <original arrow function>
    const name = factory.createUniqueName('default')
    const declDefault = createSingleVariableStatement(name, arrowFunction)
    // TODO: use params
    const { wxMain, wxParams } = generateWxMain(name, arrowFunction.parameters)

    return [ declDefault, wxMain ]
  }

  // export default sum
  const name = findChildByType<ts.Identifier>(node, ts.isIdentifier)
  if (name != null) {
    const func = findTopLevelFunctionByIdentifier(node.getSourceFile(), name)
    if (func != null) {
      // TODO: use params
      const { wxMain, wxParams } = generateWxMain(name, func.parameters)
      return wxMain
    }
  }

  return node
}

/**
 * 处理 export default function(a: number, b: number) {} 语句
 *
 * @param node 节点
 */
function dealExportDefaultFunction(node: ts.FunctionDeclaration) {
  // 若函数没有名字，则生成一个
  const name = node.name ?? factory.createUniqueName('default')
  // 去掉 export、default 关键字
  const modifiers = node.modifiers?.filter(
    mod => mod.kind != ts.SyntaxKind.DefaultKeyword && mod.kind != ts.SyntaxKind.ExportKeyword
  )
  // 复制一个新的函数
  const newFunc = cloneFunctionDeclaration(node, { modifiers, name })
  // TODO: use params
  const { wxMain, wxParams } = generateWxMain(name, node.parameters)

  return [ newFunc, wxMain ]
}

function transformer(ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const visitor: ts.Visitor = node => {
    // export default async (a: number, b: number) => {}
    // export default sum
    if (ts.isExportAssignment(node)) {
      return dealExportAssignment(node)
    }

    // export default function(a: number, b: number) {}
    if (ts.isFunctionDeclaration(node)) {
      const mods = node.modifiers
      const isDefault = mods?.some(mod => mod.kind == ts.SyntaxKind.DefaultKeyword)
      const isExport = mods?.some(mod => mod.kind == ts.SyntaxKind.ExportKeyword)
      if (isDefault && isExport) {
        return dealExportDefaultFunction(node)
      }
    }

    // only deal with top level
    return node
  }

  return (sf: ts.SourceFile) => {
    return ts.visitEachChild(sf, visitor, ctx)
  }
}

export default transformer
