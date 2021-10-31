import { source } from 'common-tags'
import defaultTemplate, { ucfirst, paramsLiteral, objectLiteral } from '@/template'

test('ucfirst', () => {
  expect(ucfirst('someName')).toEqual('SomeName')
})

test('paramsLiteral', () => {
  expect(paramsLiteral([])).toEqual('()')
  expect(paramsLiteral(['a'])).toEqual('a')
  expect(paramsLiteral(['a'], true)).toEqual('(a)')
  expect(paramsLiteral(['a', 'b'])).toEqual('(a, b)')
})

test('objectLiteral', () => {
  expect(objectLiteral([])).toEqual('{}')
  expect(objectLiteral(['a'])).toEqual('{ a }')
  expect(objectLiteral(['a', 'b'])).toEqual('{ a, b }')
})

test('defaultTemplate', () => {
  expect(
    defaultTemplate([
      { name: 'getOpenId', params: [] },
      { name: 'format', params: ['object'] },
      { name: 'sum', params: ['a', 'b'] },
    ])
  )
  .toEqual(source`
    import type functionGetOpenId from '@cloud/functions/getOpenId'
    import type functionFormat from '@cloud/functions/format'
    import type functionSum from '@cloud/functions/sum'

    type PromiseType<T> = T extends Promise<infer _> ? T : Promise<T>

    type PromiseReturnType<T extends (...args: any) => any> = (...args: Parameters<T>) => PromiseType<ReturnType<T>>

    export const cloudGetOpenId: PromiseReturnType<typeof functionGetOpenId> = () => {
      return wx.cloud.callFunction({ name: 'getOpenId', data: {} }).then(res => res.result as any)
    }

    export const cloudFormat: PromiseReturnType<typeof functionFormat> = object => {
      return wx.cloud.callFunction({ name: 'format', data: { object } }).then(res => res.result as any)
    }

    export const cloudSum: PromiseReturnType<typeof functionSum> = (a, b) => {
      return wx.cloud.callFunction({ name: 'sum', data: { a, b } }).then(res => res.result as any)
    }

    export default {
      getOpenId: cloudGetOpenId,
      format: cloudFormat,
      sum: cloudSum
    }
  `.trim())
})
