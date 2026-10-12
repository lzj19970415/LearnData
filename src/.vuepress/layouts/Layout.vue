<template>
  <Layout>
    <template #pageTop>
      <EditThisPage />
    </template>
  </Layout>
</template>

<script setup lang="ts">
// custom: true 模式下 hope-custom 条件把包解析到 dist/client
// 正确路径：layouts/base/Layout
import Layout from "vuepress-theme-hope/layouts/base/Layout";
import EditThisPage from "../components/EditThisPage.js";
</script>