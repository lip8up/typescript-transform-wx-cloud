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
    wxCloudEmitParams(params) {
      expect(params).toEqual([])
      callTimes++
    }
  })

  compile(`const some = (a: number); export default some;`, {
    wxCloudEmitParams(params) {
      expect(params).toEqual(['a'])
      callTimes++
    }
  })

  compile(`export default function(a: number, b: number) {}`, {
    wxCloudEmitParams(params) {
      expect(params).toEqual(['a', 'b'])
      callTimes++
    }
  })

  expect(callTimes).toEqual(3)
})
