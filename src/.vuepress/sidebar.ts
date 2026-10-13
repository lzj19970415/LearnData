import { sidebar } from "vuepress-theme-hope";

// 图标：https://theme-hope.vuejs.press/zh/guide/interface/icon.html#%E8%AE%BE%E7%BD%AE%E5%9B%BE%E6%A0%87
// https://fontawesome.com/search?m=free&o=r
export default sidebar({
  "/": [
    {
      text: "🚀 工作流程与问题处理",
      icon: "",
      prefix: "huawei/",
      collapsible: true,
      children: "structure",
    },
    {
      text: "📚 Linux基础",
      icon: "",
      prefix: "linux/basic/",
      collapsible: true,
      // 显式列表控制学习顺序：基础操作→系统软件→网络基础→服务部署→综合实战→日常运维
      children: [
        "01-文件管理.md",
        "02-命令的组合应用.md",
        "03-压缩与解压.md",
        "04-磁盘管理.md",
        "05-软件管理.md",
        "06-源码安装_网络协议.md",
        "07-IP详解及配置.md",
        "08-路由与日志管理.md",
        "09-文件服务器.md",
        "10-Web服务器.md",
        "11-域名申请及解析.md",
        "12-LNMP生产环境部署.md",
        "13-计划任务_服务器远程管理.md",
        "14-系统维护篇.md",
        "15-网络维护与管理.md",
      ],
    },
    {
      text: "🐧 Linux进阶",
      icon: "",
      prefix: "linux/",
      collapsible: true,
      // 显式列出文件，避免自动扫描时把 linux/basic/ 子目录重复显示为 Basic 分组
      children: [
        "16-Docker.md",
        "17-Kubernetes.md",
        "18-MySQL.md",
        "19-Nginx.md",
        "Python运维自动化.md",
        "Shell脚本编程.md",
      ],
    },
    {
      text: "🌐 网络设备（华为/华三）",
      icon: "",
      prefix: "network/",
      collapsible: true,
      // 三大主题：网络基础/路由器/防火墙，各按初级→中级→高级递进
      children: [
        {
          text: "📡 网络基础",
          icon: "",
          prefix: "network/",
          collapsible: true,
          children: ["01-初级.md", "02-中级.md", "03-高级.md"],
        },
        {
          text: "🛣️ 路由器",
          icon: "",
          prefix: "router/",
          collapsible: true,
          children: ["01-初级.md", "02-中级.md", "03-高级.md"],
        },
        {
          text: "🛡️ 防火墙",
          icon: "",
          prefix: "firewall/",
          collapsible: true,
          children: ["01-初级.md", "02-中级.md", "03-高级.md"],
        },
      ],
    },
    {
      text: "🔐 运维安全",
      icon: "",
      prefix: "security/",
      collapsible: true,
      children: "structure",
    },
    // 读书笔记架构更换到 docsify，不能使用相对链接
    { text: "读书笔记", icon: "fa6-brands:readme", link: "https://newzone.top/reading/" },
    // 指定显示页面
    {
      text: "🧰 应用手册",
      icon: "",
      prefix: "apps/",
      collapsible: true,
      children: [
        "Applist.md",
        "toolbox.md",
        "encrypt03.md",
        {
          text: "其他",
          icon: "fa6-solid:code-compare",
          collapsible: true,
          children: ["design.md"],
        },
      ],
    },
    {
      text: "🌐 页面开发",
      icon: "",
      prefix: "web/",
      collapsible: true,
      children: "structure",
    },
    {
      text: "🏗️ 网站部署",
      icon: "",
      prefix: "deploy/",
      collapsible: true,
      children: [
        "Static.md",
        "CloudServices.md",
        "VPS.md",
        {
          text: "部署工具",
          icon: "fa6-brands:windows",
          collapsible: true,
          children: ["GitHub.md", "Cloudflare.md", "MySQL.md", "DNS.md"],
        },
      ],
    },
    {
      text: "🔡 代码编程",
      icon: "",
      prefix: "code/",
      collapsible: true,
      children: [
        "README.md",
        {
          text: "Basic",
          icon: "fa6-solid:cube",
          collapsible: true,
          children: ["Markdown.md", "Electron.md", "AutoHotkey.md", "Regex.md"],
        },
        {
          text: "FrondEnd",
          icon: "fa6-solid:object-group",
          collapsible: true,
          children: ["Vue.md", "HTML.md", "Javascript.md", "Python.md"],
        },
      ],
    },
  ],
  // 专题区（独立侧边栏）
  "/apps/topic/": "structure",
  // 如果你不想使用默认侧边栏，可以按照路径自行设置。但需要去掉下方配置中的注释，以避免博客和时间轴出现异常。_posts 目录可以不存在。
  /*"/_posts/": [
    {
      text: "博客文章",
      icon: "fa6-solid:feather-pointed",
      prefix: "",
      link: "/blog",
      collapsible: true,
      children: "structure",
    },
  ], */
});
