import ts, { factory } from 'typescript'
import { createFunctionDeclaration, createImport, isEqual } from '@/util'

const getNodeText = (node: ts.Node) => {
  const source = ts.createSourceFile('tests', '', ts.ScriptTarget.ES2016, true)
  const printer = ts.createPrinter()
  const text = printer.printNode(ts.EmitHint.Unspecified, node, source)
  return text.trim()
}

// 之所以单独测试 createFunctionDeclaration，是为了代码完全覆盖
test('createFunctionDeclaration', () => {
  const func = createFunctionDeclaration({ name: 'test' })
  const text = getNodeText(func)
  expect(text).toEqual('function test();')
})

test('isEqual', () => {
  expect(isEqual(factory.createRegularExpressionLiteral('haha') as any, 'bbb')).toEqual(false)
})

test('createImport', () => {
  const { importName, importDeclaration } = createImport(factory.createIdentifier('cloud'), 'wx-server-sdk')
  const textName = getNodeText(importName)
  const textDecl = getNodeText(importDeclaration)
  expect(textName).toEqual('cloud')
  expect(textDecl).toEqual('import cloud from "wx-server-sdk";')
})
