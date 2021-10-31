import compile from './util'
import cases from './cases'

for (const { name, input } of cases) {
  const output = compile(input)
  console.log(`\n// ==> ${name}:`)
  console.log(`// ---------------- input ----------------`)
  console.log(input.trim())
  console.log(`// ---------------- output ----------------`)
  console.log(output.trim())
}
