/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * .d.ts 文件（Declaration Files，类型声明文件）仅用于 TypeScript 编译阶段的类型检查，它们不会被编译成 JavaScript 代码，也不会被打包到最终的 dist 目录中。
 * 详细解释：
 * 1.
 * 编译时作用： 当你运行 tsc 或者 IDE 进行类型检查时，TypeScript 编译器会读取 .d.ts 文件来理解那些非 TS 模块（比如 .png 图片、.vue 文件）的类型信息，从而消除报错并提供智能提示。
 * 2.
 * 打包时忽略： Webpack（配合 babel-loader 或 ts-loader）在打包时，只关心实际的逻辑代码（.ts, .js, .vue 等）。.d.ts 文件不包含任何运行时逻辑，所以会被直接忽略。
 * 3.
 * tsconfig.json 配置： 你的 tsconfig.json 中配置了 "noEmit": true，这意味着 TypeScript 编译器本身甚至不会输出任何 .js 文件（因为转换工作交给了 Babel），更不用说 .d.ts 文件了。
 * 所以，可以放心地在 src 下编写 .d.ts 文件，它们纯粹是为了开发体验和类型安全服务的。
 */

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.svg'
declare module '*.webp'
