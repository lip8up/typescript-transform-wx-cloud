import compiler from './compiler'
import cases from './cases'

for (const { name, input, output } of cases) {
  test(name, () => {
    expect(compiler(input).trim()).toEqual(output.trim())
  })
}

test('event-entry', () => {
  let callTimes = 0

  compiler().on('entry', ({ filePath, params, isMain }) => {
    callTimes++
    expect(filePath).toEqual('test.ts')
    expect(params).toEqual([])
    expect(isMain).toEqual(false)
  })
  .compile(`export default () => {}`)

  compiler().on('entry', ({ filePath, params, isMain }) => {
    callTimes++
    expect(filePath).toEqual('test.ts')
    expect(params).toEqual(['a'])
    expect(isMain).toEqual(false)
  })
  .compile(`const some = (a: number); export default some;`)

  compiler().on('entry', ({ filePath, params, isMain }) => {
    callTimes++
    expect(filePath).toEqual('test.ts')
    expect(params).toEqual(['a', 'b'])
    expect(isMain).toEqual(false)
  })
  .compile(`export default function(a: number, b: number) {}`)

  compiler().on('entry', ({ filePath, params, isMain }) => {
    callTimes++
    expect(filePath).toEqual('test.ts')
    expect(params).toEqual(['data'])
    expect(isMain).toEqual(true)
  })
  .compile(`export function main(a: number, b: number) {}`)

  compiler().on('entry', ({ filePath, params, isMain }) => {
    callTimes++
    expect(filePath).toEqual('test.ts')
    expect(params).toEqual(['data'])
    expect(isMain).toEqual(true)
  })
  .compile(`export const main = (a: number, b: number) => {}`)

  compiler().on('entry', ({ filePath, params, isMain }) => {
    callTimes++
    expect(filePath).toEqual('test.ts')
    expect(params).toEqual(['data'])
    expect(isMain).toEqual(true)
  })
  .compile(`const sub = () => {}; export const main = sub`)

  compiler().on('entry', () => {
    callTimes++
    fail('should not goes here')
  })
  .compile(`export const main = sub`)

  expect(callTimes).toEqual(6)
})
