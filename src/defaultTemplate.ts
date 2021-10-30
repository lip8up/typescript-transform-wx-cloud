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
export const template = (functions: FunctionItem[]) => {
  const text = source`
    ${functions.map(({ name }) => source`
      import type function${ucfirst(name)} from '@cloud/functions/${name}'
    `)}

    type PromiseReturnType<T extends (...args: any) => any> = (...args: Parameters<T>) => ReturnType<T> extends Promise<infer _> ? ReturnType<T> : Promise<ReturnType<T>>

    ${functions.map(({ name, params }) => source`
      export const cloud${ucfirst(name)}: PromiseReturnType<typeof function${ucfirst(name)}> = ${paramsLiteral(params)} => {
        return wx.cloud.callFunction({ name: '${name}', data: ${objectLiteral(params)} }).then(res => res.result as any)
      }
    `).join('\n\n')}

    export default {
      ${functions.map(({ name }) => source`
        ${name}: cloud${ucfirst(name)}
      `).join(',\n')}
    }
  `
  return text
}

export default template
