import ts from 'typescript'
import { createFunctionDeclaration } from '@/util'

// 之所以单独测试 createFunctionDeclaration，是为了代码完全覆盖
test('createFunctionDeclaration', () => {
  const func = createFunctionDeclaration({ name: 'test' })
  const source = ts.createSourceFile('tests', '', ts.ScriptTarget.ES2016, true)
  const printer = ts.createPrinter()
  const text = printer.printNode(ts.EmitHint.Unspecified, func, source)
  expect(text.trim()).toEqual('function test();')
})
