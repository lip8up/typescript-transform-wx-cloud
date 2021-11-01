import ts, { factory } from 'typescript'
import {
  createFunctionDeclaration,
  cloneFunctionDeclaration,
  createParameterDeclaration,
  createSingleVariableStatement,
  findChildByType,
  findTopLevelFunctionByIdentifier
} from './util'

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
 */
function generateWxMain(
  func: ts.Identifier,
  params: ts.NodeArray<ts.ParameterDeclaration>,
  { wxCloudFunctionName, wxCloudFirstParamName,  }: TransformerOptions
) {
  // import cloud from 'wx-server-sdk'
  // prettier-ignore
  const cloudImport = factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(
      false,
      factory.createIdentifier('cloud'),
      undefined
    ),
    factory.createStringLiteral('wx-server-sdk')
  )

  // cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  // prettier-ignore
  const cloudInit = factory.createExpressionStatement(factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier("cloud"),
      factory.createIdentifier("init")
    ),
    undefined,
    [factory.createObjectLiteralExpression(
      [factory.createPropertyAssignment(
        factory.createIdentifier("env"),
        factory.createPropertyAccessExpression(
          factory.createIdentifier("cloud"),
          factory.createIdentifier("DYNAMIC_CURRENT_ENV")
        )
      )],
      false
    )]
  ))

  const cloudParam = factory.createIdentifier(wxCloudFirstParamName)
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
  const exportMain = createFunctionDeclaration({
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

  const wxMain = [ cloudImport, cloudInit, exportMain ]

  return { wxMain, wxParams }
}

/**
 * 处理 export default async (a: number, b: number) => {} 语句
 *
 * @param node 节点
 */
function dealExportAssignment(node: ts.ExportAssignment, options: TransformerOptions) {
  // export default async (a: number, b: number) => {}
  const arrowFunction = findChildByType<ts.ArrowFunction>(node, ts.isArrowFunction)
  if (arrowFunction != null) {
    // const default_1 = <original arrow function>
    const name = factory.createUniqueName('default')
    const declDefault = createSingleVariableStatement(name, arrowFunction)

    // 生成微信云函数入口
    const { wxMain, wxParams } = generateWxMain(name, arrowFunction.parameters, options)
    options.wxCloudEmitParams?.(node.getSourceFile().fileName, wxParams)

    return [ declDefault, ...wxMain ]
  }

  // export default sum
  const name = findChildByType<ts.Identifier>(node, ts.isIdentifier)
  if (name != null) {
    const func = findTopLevelFunctionByIdentifier(node.getSourceFile(), name)
    if (func != null) {
      // 生成微信云函数入口
      const { wxMain, wxParams } = generateWxMain(name, func.parameters, options)
      options.wxCloudEmitParams?.(node.getSourceFile().fileName, wxParams)
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
function dealExportDefaultFunction(node: ts.FunctionDeclaration, options: TransformerOptions) {
  // 若函数没有名字，则生成一个
  const name = node.name ?? factory.createUniqueName('default')
  // 去掉 export、default 关键字
  const modifiers = node.modifiers?.filter(
    mod => mod.kind != ts.SyntaxKind.DefaultKeyword && mod.kind != ts.SyntaxKind.ExportKeyword
  )
  // 复制一个新的函数
  const newFunc = cloneFunctionDeclaration(node, { modifiers, name })
  // 生成微信云函数入口
  const { wxMain, wxParams } = generateWxMain(name, node.parameters, options)
  options.wxCloudEmitParams?.(node.getSourceFile().fileName, wxParams)
  return [ newFunc, ...wxMain ]
}

/**
 * Transformer 选项。
 */
export interface TransformerOptions {
  /**
   * 微信云函数导出名，默认 main，一般不用改。
   */
  wxCloudFunctionName: string

  /**
   * 微信云函数第一个参数名，默认 event，一般不用改。
   * 一般来说，第二个参数 context 用不到。
   */
  wxCloudFirstParamName: string

  /**
   * 调用者可传入该函数，本插件将分析到的参数名列表，作为参数传入该函数，供调用者使用。
   */
  wxCloudEmitParams?: (fileName: string, params: string[]) => void
}

const defaultTransformerOptions: TransformerOptions = {
  wxCloudFunctionName: 'main',
  wxCloudFirstParamName: 'event',
}

/**
 * 使用选项，创建转换器
 *
 * @param options 选项
 */
export function makeTransformerFactory(options?: Partial<TransformerOptions>) {
  const factory: ts.TransformerFactory<ts.SourceFile> = ctx => {
    const opts = { ...defaultTransformerOptions, ...options }
    const visitor: ts.Visitor = node => {
      // export default async (a: number, b: number) => {}
      // export default sum
      if (ts.isExportAssignment(node)) {
        return dealExportAssignment(node, opts)
      }

      // export default function(a: number, b: number) {}
      if (ts.isFunctionDeclaration(node)) {
        const mods = node.modifiers
        const isDefault = mods?.some(mod => mod.kind == ts.SyntaxKind.DefaultKeyword)
        const isExport = mods?.some(mod => mod.kind == ts.SyntaxKind.ExportKeyword)
        if (isDefault && isExport) {
          return dealExportDefaultFunction(node, opts)
        }
      }

      // only deal with top level
      return node
    }

    return (sf: ts.SourceFile) => {
      return ts.visitEachChild(sf, visitor, ctx)
    }
  }
  return factory
}
