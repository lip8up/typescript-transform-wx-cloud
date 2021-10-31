import ts from 'typescript';
declare function transformer(ctx: ts.TransformationContext): ts.Transformer<ts.SourceFile>;
export default transformer;
