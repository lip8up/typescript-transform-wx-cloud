import compile from './util'
import cases from './cases'

for (const { name, input, output } of cases) {
  test(name, () => {
    expect(compile(input).trim()).toEqual(output.trim())
  })
}
