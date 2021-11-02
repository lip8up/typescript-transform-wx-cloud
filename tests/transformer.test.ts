import compile from './util'
import cases from './cases'

for (const { name, input, output } of cases) {
  test(name, () => {
    expect(compile(input).trim()).toEqual(output.trim())
  })
}

test('emit-wx-param-names', () => {
  let callTimes = 0

  compile(`export default () => {}`, {
    wxCloudEmitParams(fileName, params, isMain) {
      expect(fileName).toEqual('test.ts')
      expect(params).toEqual([])
      expect(isMain).toEqual(false)
      callTimes++
    }
  })

  compile(`const some = (a: number); export default some;`, {
    wxCloudEmitParams(fileName, params, isMain) {
      expect(fileName).toEqual('test.ts')
      expect(params).toEqual(['a'])
      expect(isMain).toEqual(false)
      callTimes++
    }
  })

  compile(`export default function(a: number, b: number) {}`, {
    wxCloudEmitParams(fileName, params, isMain) {
      expect(fileName).toEqual('test.ts')
      expect(params).toEqual(['a', 'b'])
      expect(isMain).toEqual(false)
      callTimes++
    }
  })

  compile(`export function main(a: number, b: number) {}`, {
    wxCloudEmitParams(fileName, params, isMain) {
      expect(fileName).toEqual('test.ts')
      expect(params).toEqual(['data'])
      expect(isMain).toEqual(true)
      callTimes++
    }
  })

  compile(`export const main = (a: number, b: number) => {}`, {
    wxCloudEmitParams(fileName, params, isMain) {
      expect(fileName).toEqual('test.ts')
      expect(params).toEqual(['data'])
      expect(isMain).toEqual(true)
      callTimes++
    }
  })

  compile(`const sub = () => {}; export const main = sub`, {
    wxCloudEmitParams(fileName, params, isMain) {
      expect(fileName).toEqual('test.ts')
      expect(params).toEqual(['data'])
      expect(isMain).toEqual(true)
      callTimes++
    }
  })

  compile(`export const main = sub`, {
    wxCloudEmitParams() {
      callTimes++
      fail('should not goes here')
    }
  })

  expect(callTimes).toEqual(6)
})
