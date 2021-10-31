import ts from 'typescript'
import transformer from '@/transformer'

export default function compile(sourceCode: string) {
  const source = ts.createSourceFile(
    'tests',
    sourceCode,
    ts.ScriptTarget.ES2016,
    true
  )

  const result = ts.transform(source, [ transformer ])
  const transformed = result.transformed[0]
  const printer = ts.createPrinter()
  const resultCode = printer.printFile(transformed)

  return resultCode
}


