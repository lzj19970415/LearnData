import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/code/Electron.html","title":"Electron","lang":"zh-CN","frontmatter":{"article":false,"title":"Electron","description":"想用Web技术开发桌面应用？Electron是你的首选。详解环境部署与builder打包流程，提供解决打包报错、跨系统构建等问题的实战指南，助你上手跨平台开发。","icon":"fa6-solid:atom","order":7}}`),a={name:`Electron.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<p><a href="https://www.electronjs.org/" target="_blank" rel="noopener noreferrer">Electron</a> 是使用 JavaScript，HTML 和 CSS 构建跨平台的桌面应用程序框架。Electron 兼容 Mac、Windows 和 Linux，可以构建出三个平台的应用程序。</p><p>按 <a href="https://newzone.top/deploy/vps/#%E7%8E%AF%E5%A2%83%E9%83%A8%E7%BD%B2" target="_blank" rel="noopener noreferrer">环境部署教程</a>，部署 yarn，然后部署 electron 环境。</p><pre><code class="language-bash"># 部署 electron，electron-builder
# Electron 不能全局安装，否则 electron-builder 找不到
yarn add electron@latest -D &amp;&amp; yarn add electron-builder -D

set-ExecutionPolicy RemoteSigned #若 yarn 命令报错，则管理员运行此命令

# 全局安装时，去除^，手动指定 package.json 中的 electron 版本，然后运行下方打包命令
# 将打包命令加入 package.json，直接使用打包命令
yarn postinstall
yarn dist
</code></pre><h2 id="使用问题" tabindex="-1"><a class="header-anchor" href="#使用问题"><span>使用问题</span></a></h2><ul><li>electron cdn 需要连接网络，必须用本地环境安装。</li><li>Electron 定位的 location 为 窗口链接，而非网页链接。</li><li><a href="https://imf.ms/web/2022/07/05/my-first-web-hybird-project-experience/#%E8%B7%A8%E5%9F%9F-cors-%E9%85%8D%E7%BD%AE" target="_blank" rel="noopener noreferrer">跨域 CORS 配置</a>：有的应用需要访问的是本地 Web Server，与服务端接口在不同域</li></ul><h3 id="nsis-配置" tabindex="-1"><a class="header-anchor" href="#nsis-配置"><span>nsis 配置</span></a></h3><pre><code class="language-json">&quot;nsis&quot;: {
  &quot;oneClick&quot;: false, // 是否一键安装
  &quot;allowElevation&quot;: true, // 允许请求提升。如果为 false，则用户必须使用提升的权限重新启动安装程序。
  &quot;allowToChangeInstallationDirectory&quot;: true, // 允许修改安装目录
  &quot;installerIcon&quot;: &quot;./build/icons/aaa.ico&quot;,// 安装图标
  &quot;uninstallerIcon&quot;: &quot;./build/icons/bbb.ico&quot;,//卸载图标
  &quot;installerHeaderIcon&quot;: &quot;./build/icons/aaa.ico&quot;, // 安装时头部图标
  &quot;createDesktopShortcut&quot;: true, // 创建桌面图标
  &quot;createStartMenuShortcut&quot;: true,// 创建开始菜单图标
  &quot;shortcutName&quot;: &quot;xxxx&quot;, // 图标名称
  &quot;include&quot;: &quot;build/script/installer.nsh&quot;, // 包含的自定义 nsis 脚本 这个对于构建需求严格得安装过程相当有用。
  &quot;script&quot; : &quot;build/script/installer.nsh&quot; // NSIS 脚本的路径，用于自定义安装程序。默认为 build / installer.nsi
},
</code></pre><h3 id="打包报错" tabindex="-1"><a class="header-anchor" href="#打包报错"><span>打包报错</span></a></h3><p>执行打包命令后，提示 <code>cannot unpack electron zip file, will be re-downloaded</code>。</p><p>手动下载对应版本 electron，然后将压缩包放置于 <code>C:\\Users\\用户名\\AppData\\Local\\electron\\Cache</code>。</p><h3 id="跨系统打包" tabindex="-1"><a class="header-anchor" href="#跨系统打包"><span>跨系统打包</span></a></h3><p>electron 不允许跨系统打包，所以 Mac 打包需要在 macOS 环境，Linux 打包需在 Linux 环境。</p><p>Win11 可允许内建子系统，管理员身份运行 Powershell，输入 bash 即可进入 Linux 子系统。也可以直接打开在 Microsoft store 中下载的 Ubuntu 进入子系统，初次进入 Linux 子系统需要设置 Linux 的用户名及密码。</p><p>更多命令参考：</p><pre><code class="language-bash">#更新软件源，安装 node 和 npm 环境
sudo apt-get update
sudo apt-get install nodejs
sudo apt-get install npm

sudo npm install npm@latest -g #升级 npm
sudo npm install -g n #安装用于安装 nodejs 的模块 n
sudo n stable #通过 n 模块安装指定的 nodejs
</code></pre>`,15)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};