import { source } from 'common-tags'

export default [
  // 第一种形式：export default 箭头函数
  {
    name: 'export-default-arrow-function',
    input: source`
      import util from './util'
      export default (a: number, b: number) => {
        return a + b
      }
    `,
    output: source`
      import util from './util';
      const default_1 = (a: number, b: number) => {
          return a + b;
      };
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return default_1(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-async-arrow-function',
    input: source`
      import util from './util'
      export default async (a: number, b: number) => {
        return a + b
      }
    `,
    output: source`
      import util from './util';
      const default_1 = async (a: number, b: number) => {
          return a + b;
      };
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return default_1(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-arrow-function-with-needless-parens',
    input: source`
      import util from './util'
      export default (((a: number, b: number) => {
        return a + b
      }))
    `,
    output: source`
      import util from './util';
      const default_1 = (a: number, b: number) => {
          return a + b;
      };
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return default_1(event.a, event.b);
      }
    `,
  },

  // 第二种形式：export default 变量，变量指向顶层函数
  {
    name: 'export-default-variable-with-arrow-function',
    input: source`
      import util from './util'
      const sum = (a: number, b: number) => {
        return a + b
      }
      export default sum
    `,
    output: source`
      import util from './util';
      const sum = (a: number, b: number) => {
          return a + b;
      };
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return sum(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-variable-with-async-arrow-function',
    input: source`
      import util from './util'
      const sum = async (a: number, b: number) => {
        return a + b
      }
      export default sum
    `,
    output: source`
      import util from './util';
      const sum = async (a: number, b: number) => {
          return a + b;
      };
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return sum(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-variable-with-function-expression',
    input: source`
      import util from './util'
      const sum = function(a: number, b: number) {
        return a + b
      }
      export default sum
    `,
    output: source`
      import util from './util';
      const sum = function (a: number, b: number) {
          return a + b;
      };
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return sum(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-variable-with-async-function-expression',
    input: source`
      import util from './util'
      const sum = async function(a: number, b: number) {
        return a + b
      }
      export default sum
    `,
    output: source`
      import util from './util';
      const sum = async function (a: number, b: number) {
          return a + b;
      };
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return sum(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-variable-with-async-function-expression-named',
    input: source`
      import util from './util'
      const sum = async function named(a: number, b: number) {
        return a + b
      }
      export default sum
    `,
    output: source`
      import util from './util';
      const sum = async function named(a: number, b: number) {
          return a + b;
      };
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return sum(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-variable-with-async-function-named',
    input: source`
      import util from './util'
      async function named(a: number, b: number) {
        return a + b
      }
      export default named
    `,
    output: source`
      import util from './util';
      async function named(a: number, b: number) {
          return a + b;
      }
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return named(event.a, event.b);
      }
    `,
  },

  // 第三种形式：export default 函数声明
  {
    name: 'export-default-function',
    input: source`
      import util from './util'
      export default function(a: number, b: number) {
        return a + b
      }
    `,
    output: source`
      import util from './util';
      function default_1(a: number, b: number) {
          return a + b;
      }
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return default_1(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-async-function',
    input: source`
      import util from './util'
      export default async function(a: number, b: number) {
        return a + b
      }
    `,
    output: source`
      import util from './util';
      async function default_1(a: number, b: number) {
          return a + b;
      }
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return default_1(event.a, event.b);
      }
    `,
  },
  {
    name: 'export-default-async-function-named',
    input: source`
      import util from './util'
      export default async function sum(a: number, b: number) {
        return a + b
      }
    `,
    output: source`
      import util from './util';
      async function sum(a: number, b: number) {
          return a + b;
      }
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any) {
          return sum(event.a, event.b);
      }
    `,
  },

  // 明确声明 main 函数
  {
    name: 'export-main-function',
    input: source`
      import util from './util'
      export async function main(event: any, context: any) {
      }
    `,
    output: source`
      import util from './util';
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export async function main(event: any, context: any) {
      }
    `,
  },
  {
    name: 'export-main-function-with-sdk',
    input: source`
      import util from './util'
      import cloud from 'wx-server-sdk'
      export async function main(event: any, context: any) {
      }
    `,
    output: source`
      import util from './util';
      import cloud from 'wx-server-sdk';
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
      export async function main(event: any, context: any) {
      }
    `,
  },
  {
    name: 'export-main-function-with-init',
    input: source`
      import util from './util'
      import cloud from 'wx-server-sdk'
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV, some: 'value' })
      export async function main(event: any, context: any) {
      }
    `,
    output: source`
      import util from './util';
      import cloud from 'wx-server-sdk';
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV, some: 'value' });
      export async function main(event: any, context: any) {
      }
    `,
  },
  {
    name: 'export-main-const',
    input: source`
      import util from './util'
      export const main = async (event: any, context: any) => {
      }
    `,
    output: source`
      import util from './util';
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export const main = async (event: any, context: any) => {
      };
    `,
  },
  {
    name: 'export-main-const-with-sdk',
    input: source`
      import util from './util'
      import cloud from 'wx-server-sdk'
      export const main = async (event: any, context: any) => {
      }
    `,
    output: source`
      import util from './util';
      import cloud from 'wx-server-sdk';
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
      export const main = async (event: any, context: any) => {
      };
    `,
  },
  {
    name: 'export-main-const-with-init',
    input: source`
      import util from './util'
      import cloud from 'wx-server-sdk'
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV, some: 'value' })
      export const main = async (event: any, context: any) => {
      }
    `,
    output: source`
      import util from './util';
      import cloud from 'wx-server-sdk';
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV, some: 'value' });
      export const main = async (event: any, context: any) => {
      };
    `,
  },
  {
    name: 'export-main-const-alias',
    input: source`
      import util from './util'
      const sum = async (a: number, b: number) => a + b
      export const main = sum
    `,
    output: source`
      import util from './util';
      const sum = async (a: number, b: number) => a + b;
      import cloud_1 from "wx-server-sdk";
      cloud_1.init({ env: cloud_1.DYNAMIC_CURRENT_ENV });
      export const main = sum;
    `,
  },
  {
    name: 'export-main-const-alias-with-sdk',
    input: source`
      import util from './util'
      import cloud from 'wx-server-sdk'
      const sum = async (a: number, b: number) => a + b
      export const main = sum
    `,
    output: source`
      import util from './util';
      import cloud from 'wx-server-sdk';
      const sum = async (a: number, b: number) => a + b;
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
      export const main = sum;
    `,
  },
  {
    name: 'export-main-const-alias-with-init',
    input: source`
      import util from './util'
      import cloud from 'wx-server-sdk'
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV, some: 'value' })
      const sum = async (a: number, b: number) => a + b
      export const main = sum
    `,
    output: source`
      import util from './util';
      import cloud from 'wx-server-sdk';
      cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV, some: 'value' });
      const sum = async (a: number, b: number) => a + b;
      export const main = sum;
    `,
  },

  // 其他形式：不支持
  {
    name: 'export-default-variable-from-other-lib',
    input: source`
      import util from './util'
      export default util
    `,
    output: source`
      import util from './util';
      export default util;
    `,
  },
  {
    name: 'export-default-from-other-lib',
    input: source`
      export { default } from './util'
    `,
    output: source`
      export { default } from './util';
    `,
  },
  {
    name: 'export-name-as-default-from-other-lib',
    input: source`
      export { source as default } from './util'
    `,
    output: source`
      export { source as default } from './util';
    `,
  },
  {
    name: 'export-default-expression',
    input: source`
      export default makeTransformer()
    `,
    output: source`
      export default makeTransformer();
    `,
  },
]
