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
    // 2026 网络信息安全及攻防演练培训（基础/中高级）
    {
      text: "🎯 安全攻防培训（2026）",
      icon: "",
      prefix: "security-training/",
      collapsible: true,
      children: [
        "README.md",
        {
          text: "📖 基础篇",
          icon: "",
          collapsible: true,
          children: [
            "01-应急响应基础.md",
            "02-日志分析基础.md",
            "03-Web安全基础.md",
            "04-数据安全基础.md",
            "05-AI安全基础.md",
          ],
        },
        {
          text: "⚔️ 中高级篇",
          icon: "",
          collapsible: true,
          children: [
            "06-溯源反制实战.md",
            "07-漏洞利用与加固实战.md",
            "08-全链条综合实验.md",
            "09-数据安全评估实操.md",
            "10-护栏设计与评测.md",
            "11-智能体应用安全.md",
            "12-上岗与进阶.md",
          ],
        },
      ],
    },
    // 读书笔记：高性价比人生指南（本地 reading/ 目录）
    {
      text: "📕 读书笔记",
      icon: "fa6-brands:readme",
      prefix: "reading/",
      collapsible: true,
      children: [
        "README.md",
        {
          text: "🚑 健康、急救与身体",
          icon: "fa6-solid:heart-pulse",
          collapsible: true,
          children: [
            "01-不要早死.md",
            "02-不要慢慢死.md",
            "13-紧急情况.md",
            "24-看病.md",
            "34-家里的常备药别吃出事.md",
            "16-得了慢性病之后怎么活.md",
            "28-别为了外形把身体搞坏.md",
          ],
        },
        {
          text: "💰 金钱、时间与精力",
          icon: "fa6-solid:coins",
          collapsible: true,
          children: [
            "03-不要浪费精力.md",
            "04-不要浪费时间.md",
            "05-不要浪费钱.md",
            "07-没钱的时候怎么活.md",
            "23-学什么技能划算.md",
            "22-怎么放松.md",
          ],
        },
        {
          text: "⚖️ 法律红线与自我保护",
          icon: "fa6-solid:scale-balanced",
          collapsible: true,
          children: [
            "08-别把自己搭进去.md",
            "09-普通人容易踩的法律红线.md",
            "11-程序员和技术人容易踩的红线.md",
            "19-在职离职和工伤.md",
            "14-账号与信息安全.md",
          ],
        },
        {
          text: "👨‍👩‍👧 家庭、婚育与子女",
          icon: "fa6-solid:people-roof",
          collapsible: true,
          children: [
            "10-恋爱和结婚划不划算.md",
            "27-怀孕和生产.md",
            "20-刚出生的孩子怎么带.md",
            "18-养孩子划不划算.md",
            "30-上学以后的孩子.md",
            "17-家里有老人.md",
          ],
        },
        {
          text: "🧭 人生选择与成长",
          icon: "fa6-solid:compass",
          collapsible: true,
          children: [
            "31-十八岁之后有哪几条路.md",
            "32-出国留学.md",
            "21-出国旅行与境外安全.md",
            "26-做一个网站或平台.md",
            "12-创业与做生意.md",
          ],
        },
        {
          text: "🕊️ 重大变故与善后",
          icon: "fa6-solid:dove",
          collapsible: true,
          children: [
            "06-反面清单.md",
            "25-人走了以后要办什么.md",
            "29-遭遇重大打击之后.md",
            "33-残疾之后怎么活.md",
          ],
        },
      ],
    },
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
