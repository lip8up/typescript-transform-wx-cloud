import ts from 'typescript'
import TransformerFactory, { TransformerOptions } from '@/TransformerFactory'

interface WithCompile {
  compile(sourceCode: string): string
}

export default function compiler(sourceCode: string, options?: Partial<TransformerOptions>): string
export default function compiler(options?: Partial<TransformerOptions>): TransformerFactory & WithCompile
export default function compiler(sourceCodeOrOptions?: string | Partial<TransformerOptions>, optionsOpt?: Partial<TransformerOptions>) {
  const options = typeof sourceCodeOrOptions === 'string' ? optionsOpt : sourceCodeOrOptions
  const factory = new TransformerFactory(options)

  const compile = (sourceCode: string) => {
    const source = ts.createSourceFile(
      'test.ts',
      sourceCode,
      ts.ScriptTarget.ES2016,
      true
    )

    const result = ts.transform(source, [ factory.transformer ])
    const transformed = result.transformed[0]
    const printer = ts.createPrinter()
    const resultCode = printer.printFile(transformed)

    return resultCode
  }

  return typeof sourceCodeOrOptions === 'string'
    ? compile(sourceCodeOrOptions)
    : ((factory as TransformerFactory & WithCompile).compile = compile, factory)
}


