/**
 * 将首字母转成大写。
 *
 * @param input 输入字符串
 */
export declare const ucfirst: (input: string) => string;
/**
 * 将参数列表，转成函数参数列表文本，例如 [a, b] => (a, b)。
 *
 * @param params 参数列表
 * @param arrowParens 对于单个参数，是否始终使用括号，默认 false，即对单个参数不使用括号。
 */
export declare const paramsLiteral: (params: string[], arrowParens?: boolean) => string;
/**
 * 将参数列表，转成对象文本，例如 [a, b] => { a, b }。
 *
 * @param params 参数列表
 */
export declare const objectLiteral: (params: string[]) => string;
/** 函数配置 */
export interface FunctionItem {
    /** 函数名 */
    name: string;
    /** 函数参数列表 */
    params: string[];
}
/**
 * 模板函数类型。
 */
export declare type Template = (functions: FunctionItem[]) => string;
/**
 * 模板函数。
 *
 * @param functions 函数列表配置
 */
export declare const defaultTemplate: Template;
export default defaultTemplate;
