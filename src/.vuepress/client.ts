import SocialLink from "./components/SocialLink.js";
// 私密页密码解锁组件：md 中用 <SecretGate cipher="密文" /> 引用
import SecretGate from "./components/SecretGate.vue";
// @source 是 VuePress 注册的别名，指向 src 目录（客户端编译时相对路径会失效）
import Layout from "@source/.vuepress/layouts/Layout.vue";
import { defineClientConfig } from "vuepress/client";

// 覆盖根布局：包一层 theme-hope 的 Layout，
// 用 pageTop 插槽在每篇文章顶部注入「编辑此页」按钮
export default defineClientConfig({
  enhance: ({ app }) => {
    app.component("SocialLink", SocialLink);
    app.component("SecretGate", SecretGate);
  },
  layouts: {
    Layout,
  },
});