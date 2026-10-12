import type { VNode } from "vue";
import { defineComponent, h, computed } from "vue";
import { useRoute } from "vue-router";

const EDITOR_BASE = "http://localhost:8099/";

export default defineComponent({
  name: "EditThisPage",

  setup() {
    const route = useRoute();

    const editHref = computed(() => {
      // 当前路由路径，如 /huawei/问题流程.html 或 /huawei/xxx/
      const p = decodeURIComponent(route.path);
      let md = p.replace(/^\//, "");
      if (md.endsWith("/")) {
        md += "README.md";
      } else if (md.endsWith(".html")) {
        md = md.replace(/\.html$/, ".md");
      } else {
        md += ".md";
      }
      return `${EDITOR_BASE}?path=${encodeURIComponent(md)}`;
    });

    return (): VNode =>
      h(
        "div",
        {
          class: "edit-this-page",
          style: {
            margin: "0 0 0.8rem 0",
            display: "flex",
            justifyContent: "flex-end",
          },
        },
        [
          h(
            "a",
            {
              href: editHref.value,
              target: "_blank",
              rel: "noopener noreferrer",
              title: "在本地编辑器中打开此笔记",
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 12px",
                background: "#eef1fb",
                color: "#5c6bc0",
                borderRadius: "6px",
                fontSize: "13px",
                textDecoration: "none",
                border: "1px solid #d5dcf5",
              },
            },
            "✏️ 编辑此页",
          ),
        ],
      );
  },
});