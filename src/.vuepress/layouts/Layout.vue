<template>
  <Layout>
    <template #pageTop>
      <EditThisPage />
    </template>
  </Layout>
</template>

<script setup lang="ts">
// custom: true 模式下 hope-custom 条件把 layouts 解析到 dist/client
import Layout from "vuepress-theme-hope/layouts/Layout.js";
import EditThisPage from "../components/EditThisPage.js";
</script>