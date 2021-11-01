import ts from 'typescript'
import { makeTransformerFactory, TransformerOptions } from '@/transformer'

export default function compile(sourceCode: string, options?: Partial<TransformerOptions>) {
  const source = ts.createSourceFile(
    'test.ts',
    sourceCode,
    ts.ScriptTarget.ES2016,
    true
  )

  const transformer = makeTransformerFactory(options)
  const result = ts.transform(source, [ transformer ])
  const transformed = result.transformed[0]
  const printer = ts.createPrinter()
  const resultCode = printer.printFile(transformed)

  return resultCode
}


