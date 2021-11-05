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
import { EventEmitter } from 'typed-events.ts'

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
}

/**
 * 调用者可传入该函数，本插件将分析到的参数名列表，作为参数传入该函数，供调用者使用。
 */
// wxCloudEmitParams?: (fileName: string, params: string[], isMain: boolean) => void

const defaultOptions: TransformerOptions = {
  wxCloudFunctionName: 'main',
  wxCloudFirstParamName: 'event',
  wxCloudSecondParamName: 'context',
  wxServerSdkName: 'wx-server-sdk',
}

export interface EntryEvent {
  /** 文件路径 */
  filePath: string

  /** 参数名 */
  params: string[]

  /** 是否为 main 函数 */
  isMain: boolean
}

type TransformerFactoryEvents = {
  /**
   * 发现入口函数事件。
   *
   * @param event 事件参数
   */
  entry(event: EntryEvent): void
}

/**
 * Transformer 工厂。
 *
 * @method on('entryFunction', (ev: EntryFunctionEvent) => void)
 */
export default class TransformerFactory extends EventEmitter<TransformerFactoryEvents> {
  private readonly options: TransformerOptions

  constructor(options?: Partial<TransformerOptions>) {
    super()
    this.options = { ...defaultOptions, ...options }
  }

  get transformer(): ts.TransformerFactory<ts.SourceFile> {
    return ctx => {
      const visitor: ts.Visitor = node => {
        // export default async (a: number, b: number) => {}
        // export default sum
        if (ts.isExportAssignment(node)) {
          return this.dealExportAssignment(node)
        }

        // export default function(a: number, b: number) {}
        // export default function sum(a: number, b: number) {}
        if (ts.isFunctionDeclaration(node)) {
          const isDefault = hasDefault(node)
          const isExport = hasExport(node)
          if (isDefault && isExport) {
            return this.dealExportDefaultFunction(node)
          }
        }

        // 最后，支持已有 main 函数的情况
        const { main } = getExportMain(node, this.options.wxCloudFunctionName) || {}
        if (main != null) {
          return this.dealExportMain(node, main)
        }

        // only deal with top level
        return node
      }

      return (sf: ts.SourceFile) => {
        return ts.visitEachChild(sf, visitor, ctx)
      }
    }
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
   */
  private createWxMain(
    name: ts.Identifier,
    params: ts.NodeArray<ts.ParameterDeclaration>
  ) {
    const { wxCloudFunctionName, wxCloudFirstParamName } = this.options
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

  /**
   * 确保 wx-server-sdk 被初始化。
   *
   * 即如下代码被调用：
   *
   * ```ts
   * import cloud from 'wx-server-sdk'
   * cloud.init({ ... })
   * ```
   *
   * @param name
   */
  private ensureWxInit(name: ts.Identifier) {
    const { wxServerSdkName  } = this.options
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
   * 生成微信 SDK 初始化代码。
   *
   * @param name 函数名节点
   * @param params 参数列表节点
   */
  private generateWxCode(name: ts.Identifier, params: ts.NodeArray<ts.ParameterDeclaration>) {
    const wxCode = this.ensureWxInit(name)
    const { wxMain, wxParams } = this.createWxMain(name, params)
    wxCode.push(wxMain)
    return { wxCode, wxParams }
  }

  /**
   * 处理 export default async (a: number, b: number) => {} 语句
   *
   * @param node 节点
   */
  private dealExportAssignment(node: ts.ExportAssignment) {
    // export default async (a: number, b: number) => {}
    const arrowFunction = findChildByType<ts.ArrowFunction>(node, ts.isArrowFunction)
    if (arrowFunction != null) {
      // const default_1 = <original arrow function>
      const name = factory.createUniqueName('default')
      const declDefault = createSingleVariableStatement(name, arrowFunction)

      // 生成微信云函数入口
      const { wxCode, wxParams } = this.generateWxCode(name, arrowFunction.parameters)
      this.emit('entry', {
        filePath: node.getSourceFile().fileName,
        params: wxParams,
        isMain: false
      })

      return [ declDefault, ...wxCode ]
    }

    // export default sum
    const name = findChildByType<ts.Identifier>(node, ts.isIdentifier)
    if (name != null) {
      const func = findTopFunction(node.getSourceFile(), name)
      if (func != null) {
        // 生成微信云函数入口
        const { wxCode, wxParams } = this.generateWxCode(name, func.parameters)
        this.emit('entry', {
          filePath: node.getSourceFile().fileName,
          params: wxParams,
          isMain: false
        })
        return wxCode
      }
    }

    return node
  }

  /**
   * 处理 export default function(a: number, b: number) {} 语句
   *
   * @param node 节点
   */
  private dealExportDefaultFunction(node: ts.FunctionDeclaration) {
    // 若函数没有名字，则生成一个
    const name = node.name ?? factory.createUniqueName('default')
    // 生成微信云函数入口
    const { wxCode, wxParams } = this.generateWxCode(name, node.parameters)
    this.emit('entry', {
      filePath: node.getSourceFile().fileName,
      params: wxParams,
      isMain: false
    })

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
   */
  private dealExportMain(node: ts.Node, main: ts.Identifier) {
    const wxCode = this.ensureWxInit(main)
    const wxParams = [ 'data' ]
    this.emit('entry', {
      filePath: main.getSourceFile().fileName,
      params: wxParams,
      isMain: true
    })
    return [ ...wxCode, node ]
  }
}
