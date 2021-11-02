import ts, { factory } from 'typescript'
import {
  createFunctionDeclaration,
  cloneFunctionDeclaration,
  createParameterDeclaration,
  createSingleVariableStatement,
  findChildByType,
  findTopFunction,
  ensureImport,
  ensureCloudInit,
  hasDefault,
  hasExport,
  getExportMain
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
function createWxMain(
  name: ts.Identifier,
  params: ts.NodeArray<ts.ParameterDeclaration>,
  { wxCloudFunctionName, wxCloudFirstParamName  }: TransformerOptions
) {
  const cloudParam = factory.createIdentifier(wxCloudFirstParamName)
  const wxParams: string[] = []
  // [ event.a, event.b ]
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
          factory.createCallExpression(name, undefined, callParams)
        )
      ],
      true
    )
  })
  return { wxMain, wxParams }
}

function ensureWxInit(
  name: ts.Identifier,
  options: TransformerOptions
) {
  const { wxServerSdkName  } = options
  const wxCode: ts.Node[] = []

  const sourceFile = name.getSourceFile()

  // import cloud from 'wx-server-sdk'
  const {
    importName: cloud,
    importDeclaration
  } = ensureImport(sourceFile, 'cloud', wxServerSdkName)

  importDeclaration && wxCode.push(importDeclaration)

  const cloudInit = ensureCloudInit(sourceFile, cloud)
  cloudInit && wxCode.push(cloudInit)

  return wxCode
}


/**
 * 生成微信 SDK 初始化代码
 */
function generateWxCode(
  name: ts.Identifier,
  params: ts.NodeArray<ts.ParameterDeclaration>,
  options: TransformerOptions
) {

  const wxCode = ensureWxInit(name, options)
  const { wxMain, wxParams } = createWxMain(name, params, options)
  wxCode.push(wxMain)

  return { wxCode, wxParams }
}

/**
 * 处理 export default async (a: number, b: number) => {} 语句
 *
 * @param node 节点
 * @param options 选项
 */
function dealExportAssignment(node: ts.ExportAssignment, options: TransformerOptions) {
  // export default async (a: number, b: number) => {}
  const arrowFunction = findChildByType<ts.ArrowFunction>(node, ts.isArrowFunction)
  if (arrowFunction != null) {
    // const default_1 = <original arrow function>
    const name = factory.createUniqueName('default')
    const declDefault = createSingleVariableStatement(name, arrowFunction)

    // 生成微信云函数入口
    const { wxCode, wxParams } = generateWxCode(name, arrowFunction.parameters, options)
    options.wxCloudEmitParams?.(node.getSourceFile().fileName, wxParams, false)

    return [ declDefault, ...wxCode ]
  }

  // export default sum
  const name = findChildByType<ts.Identifier>(node, ts.isIdentifier)
  if (name != null) {
    const func = findTopFunction(node.getSourceFile(), name)
    if (func != null) {
      // 生成微信云函数入口
      const { wxCode, wxParams } = generateWxCode(name, func.parameters, options)
      options.wxCloudEmitParams?.(node.getSourceFile().fileName, wxParams, false)
      return wxCode
    }
  }

  return node
}

/**
 * 处理 export default function(a: number, b: number) {} 语句
 *
 * @param node 节点
 * @param options 选项
 */
function dealExportDefaultFunction(node: ts.FunctionDeclaration, options: TransformerOptions) {
  // 若函数没有名字，则生成一个
  const name = node.name ?? factory.createUniqueName('default')
  // 生成微信云函数入口
  const { wxCode, wxParams } = generateWxCode(name, node.parameters, options)
  options.wxCloudEmitParams?.(node.getSourceFile().fileName, wxParams, false)

  // 去掉 export、default 关键字
  const modifiers = node.modifiers?.filter(
    mod => mod.kind != ts.SyntaxKind.DefaultKeyword && mod.kind != ts.SyntaxKind.ExportKeyword
  )
  // 复制一个新的函数
  const newFunc = cloneFunctionDeclaration(node, { modifiers, name })
  return [ newFunc, ...wxCode ]
}

/**
 * 处理明确的 main 函数。
 *
 * 支持以下形式：
 * export const main = async () => {}
 * export const main = function() {}
 * export async function main() {}
 * function sum() {}
 * export const main = sum
 *
 * @param main main 名称节点
 * @param options 选项
 */
function dealExportMain(node: ts.Node, main: ts.Identifier, options: TransformerOptions) {
  const wxCode = ensureWxInit(main, options)
  const wxParams = [ 'data' ]
  options.wxCloudEmitParams?.(main.getSourceFile().fileName, wxParams, true)
  return [ ...wxCode, node ]
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
   * 微信云函数第二个参数名，默认 context，一般不用改。
   * 一般来说，该参数用不到。
   */
  wxCloudSecondParamName: string

  /**
   * 微信 server sdk 名称，默认 wx-server-sdk，一般不用改。
   */
  wxServerSdkName: string

  /**
   * 调用者可传入该函数，本插件将分析到的参数名列表，作为参数传入该函数，供调用者使用。
   */
  wxCloudEmitParams?: (fileName: string, params: string[], isMain: boolean) => void
}

const defaultTransformerOptions: TransformerOptions = {
  wxCloudFunctionName: 'main',
  wxCloudFirstParamName: 'event',
  wxCloudSecondParamName: 'context',
  wxServerSdkName: 'wx-server-sdk',
}

/**
 * 使用选项，创建转换器
 *
 * @param options 选项
 */
export function makeTransformerFactory(options?: Partial<TransformerOptions>) {
  const opts = { ...defaultTransformerOptions, ...options }
  const factory: ts.TransformerFactory<ts.SourceFile> = ctx => {
    const visitor: ts.Visitor = node => {
      // export default async (a: number, b: number) => {}
      // export default sum
      if (ts.isExportAssignment(node)) {
        return dealExportAssignment(node, opts)
      }

      // export default function(a: number, b: number) {}
      // export default function sum(a: number, b: number) {}
      if (ts.isFunctionDeclaration(node)) {
        const isDefault = hasDefault(node)
        const isExport = hasExport(node)
        if (isDefault && isExport) {
          return dealExportDefaultFunction(node, opts)
        }
      }

      // 最后，支持已有 main 函数的情况
      const { main } = getExportMain(node, opts.wxCloudFunctionName) || {}
      if (main != null) {
        return dealExportMain(node, main, opts)
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
