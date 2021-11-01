import ts from 'typescript';
/**
 * Transformer 选项。
 */
export interface TransformerOptions {
    /**
     * 微信云函数导出名，默认 main，一般不用改。
     */
    wxCloudFunctionName: string;
    /**
     * 微信云函数第一个参数名，默认 event，一般不用改。
     * 一般来说，第二个参数 context 用不到。
     */
    wxCloudFirstParamName: string;
    /**
     * 调用者可传入该函数，本插件将分析到的参数名列表，作为参数传入该函数，供调用者使用。
     */
    wxCloudEmitParams?: (fileName: string, params: string[]) => void;
}
/**
 * 使用选项，创建转换器
 *
 * @param options 选项
 */
export declare function makeTransformerFactory(options?: Partial<TransformerOptions>): ts.TransformerFactory<ts.SourceFile>;
declare const _default: ts.TransformerFactory<ts.SourceFile>;
/**
 * 没有任何选项的默认转换器
 */
export default _default;
