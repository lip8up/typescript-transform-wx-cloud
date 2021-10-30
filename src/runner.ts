import ts from 'typescript'
import transformer from './transformer'

function compile(sourceCode: string) {

  const source = ts.createSourceFile(
    'lib',
    sourceCode,
    ts.ScriptTarget.ES2016,
    true
  )

  const result = ts.transform(source, [transformer])

  const transformedSourceFile = result.transformed[0]
  const printer = ts.createPrinter()
  const resultCode = printer.printFile(transformedSourceFile)

  return resultCode
}

const source = `
export default async (a: number, b: number) => {
}
`

console.log(
  compile(source)
)


