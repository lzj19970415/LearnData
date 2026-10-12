// 让 TypeScript 识别 .vue 单文件组件
declare module "*.vue" {
  import type { Component } from "vue";

  const component: Component;
  export default component;
}