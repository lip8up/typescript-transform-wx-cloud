import ts, { factory } from 'typescript';
declare type CreateFunctionParams = Parameters<typeof factory.createFunctionDeclaration>;
/**
 * 函数配置。
 */
export interface FunctionOptions {
    decorators?: CreateFunctionParams[0];
    modifiers?: CreateFunctionParams[1];
    asteriskToken?: CreateFunctionParams[2];
    name?: CreateFunctionParams[3];
    typeParameters?: CreateFunctionParams[4];
    parameters?: CreateFunctionParams[5] | CreateFunctionParams[5][0];
    type?: CreateFunctionParams[6];
    body?: CreateFunctionParams[7];
}
/**
 * 创建函数声明。
 *
 * @param options 函数配置
 */
export declare function createFunctionDeclaration(options: FunctionOptions): ts.FunctionDeclaration;
/**
 * 使用新的配置，复制函数声明。
 *
 * @param func 要复制的函数
 * @param options 新配置
 */
export declare function cloneFunctionDeclaration(func: ts.FunctionDeclaration, options: FunctionOptions): ts.FunctionDeclaration;
declare type CreateParameterParams = Parameters<typeof factory.createParameterDeclaration>;
/**
 * 参数配置。
 */
export interface ParamsOptions {
    decorators?: CreateParameterParams[0];
    modifiers?: CreateParameterParams[1];
    dotDotDotToken?: CreateParameterParams[2];
    name: CreateParameterParams[3];
    questionToken?: CreateParameterParams[4];
    type?: CreateParameterParams[5];
    initializer?: CreateParameterParams[6];
}
/**
 * 创建参数声明，若省略 type，默认为 any。
 * @param options 参数配置
 */
export declare function createParameterDeclaration(options: ParamsOptions): ts.ParameterDeclaration;
/**
 * 创建单个变量声明语句。
 *
 * @param name 变量名
 * @param initializer 初始化表达式
 * @param flags 变量类型标志，默认 const
 */
export declare function createSingleVariableStatement(name: string | ts.BindingName, initializer?: ts.Expression, flags?: ts.NodeFlags): ts.VariableStatement;
/**
 * 返回符合条件的子孙对象。
 *
 * @param node 要查找的父节点
 * @param test 测试函数
 */
export declare function findChildByType<T extends ts.Node>(node: ts.Node, test: (node: ts.Node) => boolean): T | undefined;
/**
 * 生成绑定了名称的 isIdentifierName 函数。
 *
 * @param identifier 预绑定的名称
 */
export declare function isIdentifierNameFunction(identifier: ts.Identifier): (node: ts.Node) => boolean;
/**
 * 顶级函数类型。
 */
export declare type FunctionLike = ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration;
/**
 * 使用指定的名称，查找顶级函数。
 *
 * @param sourceFile 源文件对象
 * @param identifier 函数名称
 */
export declare function findTopLevelFunctionByIdentifier(sourceFile: ts.SourceFile, identifier: ts.Identifier): FunctionLike | undefined;
export {};
