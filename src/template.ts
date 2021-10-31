import { source } from 'common-tags'

/**
 * 将首字母转成大写。
 *
 * @param input 输入字符串
 */
export const ucfirst = (input: string) => input[0].toUpperCase() + input.slice(1)

/**
 * 将参数列表，转成函数参数列表文本，例如 [a, b] => (a, b)。
 *
 * @param params 参数列表
 * @param arrowParens 对于单个参数，是否始终使用括号，默认 false，即对单个参数不使用括号。
 */
export const paramsLiteral = (params: string[], arrowParens = false) =>
  params.length == 1 && !arrowParens ? `${params[0]}` : `(${params.join(', ')})`

/**
 * 将参数列表，转成对象文本，例如 [a, b] => { a, b }。
 *
 * @param params 参数列表
 */
export const objectLiteral = (params: string[]) => params.length == 0 ? '{}' : `{ ${params.join(', ')} }`

/** 函数配置 */
export interface FunctionItem {
  /** 函数名 */
  name: string

  /** 函数参数列表 */
  params: string[]
}

/**
 * 模板函数。
 *
 * @param functions 函数列表配置
 */
export const defaultTemplate = (functions: FunctionItem[]) => {
  const fns = functions.map(({ name, params }) => ({
    name,
    Name: ucfirst(name),
    paramsText: paramsLiteral(params),
    objectText: objectLiteral(params),
  }))
  // prettier-ignore
  const text = source`
    ${fns.map(({ name, Name }) => source`
      import type function${Name} from '@cloud/functions/${name}'
    `)}

    type PromiseType<T> = T extends Promise<infer _> ? T : Promise<T>

    type PromiseReturnType<T extends (...args: any) => any> = (...args: Parameters<T>) => PromiseType<ReturnType<T>>

    ${fns.map(({ name, Name, paramsText, objectText }) => source`
      export const cloud${Name}: PromiseReturnType<typeof function${Name}> = ${paramsText} => {
        return wx.cloud.callFunction({ name: '${name}', data: ${objectText} }).then(res => res.result as any)
      }
    `).join('\n\n')}

    export default {
      ${fns.map(({ name, Name }) => source`
        ${name}: cloud${Name}
      `).join(',\n')}
    }
  `
  return text
}

export default defaultTemplate
