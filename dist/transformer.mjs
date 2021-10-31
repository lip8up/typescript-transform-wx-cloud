import ts, { factory } from 'typescript';

/**
 * 创建函数声明。
 *
 * @param options 函数配置
 */
function createFunctionDeclaration(options) {
    // 支持传单个参数
    const params = options.parameters;
    const parameters = params === undefined || Array.isArray(params) ? params : [params];
    return factory.createFunctionDeclaration(options.decorators, options.modifiers, options.asteriskToken, options.name, options.typeParameters, parameters ?? [], options.type, options.body);
}
/**
 * 使用新的配置，复制函数声明。
 *
 * @param func 要复制的函数
 * @param options 新配置
 */
function cloneFunctionDeclaration(func, options) {
    const config = {
        decorators: func.decorators,
        modifiers: func.modifiers,
        asteriskToken: func.asteriskToken,
        name: func.name,
        typeParameters: func.typeParameters,
        parameters: func.parameters,
        type: func.type,
        body: func.body,
        ...options
    };
    return createFunctionDeclaration(config);
}
/**
 * 创建参数声明，若省略 type，默认为 any。
 * @param options 参数配置
 */
function createParameterDeclaration(options) {
    const type = options.type ?? factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    return factory.createParameterDeclaration(options.decorators, options.modifiers, options.dotDotDotToken, options.name, options.questionToken, type, options.initializer);
}
/**
 * 创建单个变量声明语句。
 *
 * @param name 变量名
 * @param initializer 初始化表达式
 * @param flags 变量类型标志，默认 const
 */
function createSingleVariableStatement(name, initializer, flags) {
    return factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
        factory.createVariableDeclaration(name, undefined, undefined, initializer)
    ], flags ?? ts.NodeFlags.Const));
}
/**
 * 返回符合条件的子孙对象。
 *
 * @param node 要查找的父节点
 * @param test 测试函数
 */
function findChildByType(node, test) {
    return ts.forEachChild(node, child => test(child) ? child : findChildByType(child, test));
}
/**
 * 生成绑定了名称的 isIdentifierName 函数。
 *
 * @param identifier 预绑定的名称
 */
function isIdentifierNameFunction(identifier) {
    const name = identifier.escapedText.toString();
    return (node) => ts.isIdentifier(node) && node.escapedText.toString() == name;
}
/**
 * 使用指定的名称，查找顶级函数。
 *
 * @param sourceFile 源文件对象
 * @param identifier 函数名称
 */
function findTopLevelFunctionByIdentifier(sourceFile, identifier) {
    const isIdentifierName = isIdentifierNameFunction(identifier);
    return ts.forEachChild(sourceFile, child => {
        // const sum = (a: number, b: number) => {}
        // const sum = function name(a: number, b: number) {}
        // 更怪异的加多个无用的括号也支持
        // const sum = ((a: number, b: number) => {})
        // const sum = (function name(a: number, b: number) {})
        if (ts.isVariableStatement(child)) {
            const name = findChildByType(child, isIdentifierName);
            const found = name && findChildByType(name.parent, n => ts.isArrowFunction(n) || ts.isFunctionExpression(n));
            if (found != null) {
                return found;
            }
        }
        // function sum(a: number, b: number) {}
        if (ts.isFunctionDeclaration(child)) {
            const name = findChildByType(child, isIdentifierName);
            if (name != null) {
                return child;
            }
        }
    });
}

const wxCloudFunctionName = 'main';
const wxCloudParamName = 'event';
/**
 * 生成微信导出函数。
 *
 * 函数中的表达式，使用以下网址生成：
 *
 * https://ts-ast-viewer.com/#code/KYDwDg9gTgLgBAQwM4E8B2BjOAzArpmASwjTgFsFC0AKYAN2DRgC5E0UBKOAbwCg4BcKMBi4opACbBsCXABsYAfQCMtBkwB0CADRx6jGBoBGHXgF8gA
 *
 * 生成的函数举例：
 *
 * ```ts
 * export async function main(event: any) {
 *   return default_1(event.a, event.b)
 * }
 * ```
 *
 * @param func 导出的函数
 * @param parameters 函数参数
 */
function generateWxMain(func, params) {
    const cloudParam = factory.createIdentifier(wxCloudParamName);
    const wxParams = [];
    const callParams = params.map(param => {
        const name = param.name;
        wxParams.push(name.escapedText.toString());
        return factory.createPropertyAccessExpression(cloudParam, name);
    });
    // export async function main(event: any) {
    //   return default_1(event.a, event.b)
    // }
    // prettier-ignore
    const wxMain = createFunctionDeclaration({
        modifiers: [
            factory.createModifier(ts.SyntaxKind.ExportKeyword),
            factory.createModifier(ts.SyntaxKind.AsyncKeyword)
        ],
        name: factory.createIdentifier(wxCloudFunctionName),
        parameters: createParameterDeclaration({ name: cloudParam }),
        body: factory.createBlock([
            // return default_1(event.a, event.b)
            factory.createReturnStatement(factory.createCallExpression(func, undefined, callParams))
        ], true)
    });
    return { wxMain, wxParams };
}
/**
 * 处理 export default async (a: number, b: number) => {} 语句
 *
 * @param node 节点
 */
function dealExportAssignment(node) {
    // export default async (a: number, b: number) => {}
    const arrowFunction = findChildByType(node, ts.isArrowFunction);
    if (arrowFunction != null) {
        // const default_1 = <original arrow function>
        const name = factory.createUniqueName('default');
        const declDefault = createSingleVariableStatement(name, arrowFunction);
        // TODO: use params
        const { wxMain, wxParams } = generateWxMain(name, arrowFunction.parameters);
        return [declDefault, wxMain];
    }
    // export default sum
    const name = findChildByType(node, ts.isIdentifier);
    if (name != null) {
        const func = findTopLevelFunctionByIdentifier(node.getSourceFile(), name);
        if (func != null) {
            // TODO: use params
            const { wxMain, wxParams } = generateWxMain(name, func.parameters);
            return wxMain;
        }
    }
    return node;
}
/**
 * 处理 export default function(a: number, b: number) {} 语句
 *
 * @param node 节点
 */
function dealExportDefaultFunction(node) {
    // 若函数没有名字，则生成一个
    const name = node.name ?? factory.createUniqueName('default');
    // 去掉 export、default 关键字
    const modifiers = node.modifiers?.filter(mod => mod.kind != ts.SyntaxKind.DefaultKeyword && mod.kind != ts.SyntaxKind.ExportKeyword);
    // 复制一个新的函数
    const newFunc = cloneFunctionDeclaration(node, { modifiers, name });
    // TODO: use params
    const { wxMain, wxParams } = generateWxMain(name, node.parameters);
    return [newFunc, wxMain];
}
function transformer(ctx) {
    const visitor = node => {
        // export default async (a: number, b: number) => {}
        // export default sum
        if (ts.isExportAssignment(node)) {
            return dealExportAssignment(node);
        }
        // export default function(a: number, b: number) {}
        if (ts.isFunctionDeclaration(node)) {
            const mods = node.modifiers;
            const isDefault = mods?.some(mod => mod.kind == ts.SyntaxKind.DefaultKeyword);
            const isExport = mods?.some(mod => mod.kind == ts.SyntaxKind.ExportKeyword);
            if (isDefault && isExport) {
                return dealExportDefaultFunction(node);
            }
        }
        // only deal with top level
        return node;
    };
    return (sf) => {
        return ts.visitEachChild(sf, visitor, ctx);
    };
}

export { transformer as default };
//# sourceMappingURL=transformer.mjs.map
