import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/web/Comments.html","title":"评论插件","lang":"zh-CN","frontmatter":{"article":false,"title":"评论插件","description":"网站评论插件深度指南：对比Waline、Giscus与Gitalk。详解Waline从Vercel部署到Linux配置及数据库迁移全流程，搭建安全高效评论系统。","icon":"fa6-solid:comment-dots","order":3}}`),a={name:`Comments.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<p>LearnData 使用的是 Waline 评论插件，部署简单，有后端管理。评论插件推荐次序为 Waline &gt; giscus &gt; Gitalk &gt; Gitter。</p><h2 id="评论插件" tabindex="-1"><a class="header-anchor" href="#评论插件"><span>评论插件</span></a></h2><ul><li><a href="https://waline.js.org/guide/get-started/" target="_blank" rel="noopener noreferrer">Waline</a>：基于 Valine 衍生的简洁、安全的评论系统，部署到 Vercel，可匿名互动，导出评论内容，支持文章表情互动。</li><li><a href="https://github.com/giscus/giscus" target="_blank" rel="noopener noreferrer">Giscus</a>：基于 github discussion，近似于论坛。LearnData 模板已自带 Giscus，自配置可参考 <a href="https://blog.csdn.net/duninet/article/details/125280107" target="_blank" rel="noopener noreferrer">如何使用 GitHub 讨论作为你博客的聊天系统</a>。</li><li><a href="https://github.com/gitalk/gitalk" target="_blank" rel="noopener noreferrer">Gitalk</a>：基于 github issue，需配置独立库用于存储评论。</li><li><a href="https://gitter.im/" target="_blank" rel="noopener noreferrer">Gitter</a>：要登录的公共聊天室。样例如：<a href="https://boardgame.io/documentation/#/" target="_blank" rel="noopener noreferrer">boardgame</a>，<a href="https://itchef.github.io/regauge/#/" target="_blank" rel="noopener noreferrer">regauge</a>。</li><li><s><a href="https://github.com/xCss/Valine" target="_blank" rel="noopener noreferrer">Valine</a>：快速、简洁且高效的无后端评论系统，可匿名互动。（最后一版停止在 2022。）</s></li></ul><h2 id="waline" tabindex="-1"><a class="header-anchor" href="#waline"><span>Waline</span></a></h2><p>Waline 支持 Akismet 反垃圾评论和免注册留言，但匿名留言会带来安全隐患。建议开启评论通知来避免出现极端情况。Waline 的评论通知支持多种方式，包括 QQ、微信、邮件等。对于评论的回复，仅支持邮件通知。</p><p>Vercel 项目中选择「Overview」&gt;「Settings」&gt;「Environment Variables」，然后按照 <a href="https://waline.js.org/guide/features/notification.html" target="_blank" rel="noopener noreferrer">Waline 评论通知</a>配置所需环境变量。如果需要 Webhook 等更多通知方式，则查看 <a href="https://waline.js.org/reference/server/config.html" target="_blank" rel="noopener noreferrer">Waline 服务端配置</a>。配置成功后，选择「Overview」&gt;「Deployments」，进行 Redeploy，重新部署后环境变量和评论通知方会生效。目前 <code>*.vercel.app</code> 域名已经被 DNS 污染，会出现「无法加载评论」，国内使用建议绑定自定义域名，域名对备案暂无硬性要求。</p><h3 id="手动部署" tabindex="-1"><a class="header-anchor" href="#手动部署"><span>手动部署</span></a></h3><p>请注意，Vercel 和 LeanCloud 有额度限制。如果你的网站日访客超过一千人次，建议使用自行部署的方案。以下是我的部署步骤：</p><ol><li><p>新建数据库，并导入 <a href="https://github.com/walinejs/waline/blob/main/assets/waline.sql" target="_blank" rel="noopener noreferrer">waline.sql</a> 以完成表和表结构的创建，之后在项目中配置如下环境变量。^[<a href="https://waline.js.org/guide/database.html#mysql" target="_blank" rel="noopener noreferrer">Waline 多数据库服务支持</a>]</p></li><li><p>配置必要的环境变量，可添加于 <code>/etc/environment</code>。配置完成后，需要重启项目让环境变量生效。并注意最后一行需保留空行。</p><pre><code class="language-bash">MYSQL_DB=&quot;&quot;
MYSQL_USER=&quot;&quot;
MYSQL_PASSWORD=&quot;&quot;
</code></pre></li><li><p>部署 Waline 服务端，使用 forever 让其持久化运行。</p><pre><code class="language-bash"># 切换到站点路径
cd /www/wwwroot/node/waline

# 安装 waline 前端包
yarn add @waline/vercel

# 运行模块内的 vanilla.js 文件
node node_modules/@waline/vercel/vanilla.js

# 使用 forever 持久化运行程序
sudo npm install forever -g
forever start app.js  #启动应用
forever stop app.js  #关闭应用
forever restartall  #重启所有应用

# 持久化运行 Waline
forever start /www/wwwroot/node/waline/node_modules/@waline/vercel/vanilla.js

# 更改 package.json 版本号，升级并重启
forever stop /www/wwwroot/node/waline/node_modules/@waline/vercel/vanilla.js
cd /www/wwwroot/node/waline &amp;&amp; yarn install &amp;&amp; forever start /www/wwwroot/node/waline/node_modules/@waline/vercel/vanilla.js
</code></pre></li><li><p>打开网页管理后台，通过导入事先备份的 JSON 文件来还原数据。</p></li></ol><h3 id="环境变量" tabindex="-1"><a class="header-anchor" href="#环境变量"><span>环境变量</span></a></h3><p>如果发现系统变量（如 <code>/etc/environment</code>）或 Node.js 环境变量未能生效，可改用项目运行路径下的 <code>.env</code> 文件加载变量。Node.js 20.6.0 起内置 <code>--env-file</code> 参数，无需额外依赖，推荐使用。示例 <code>package.json</code> 配置如下：</p><pre><code class="language-json">{
  &quot;name&quot;: &quot;waline&quot;,
  &quot;private&quot;: true,
  &quot;version&quot;: &quot;0.0.1&quot;,
  &quot;scripts&quot;: {
    &quot;start&quot;: &quot;node --env-file=.env node_modules/@waline/vercel/vanilla.js&quot;
  },
  &quot;dependencies&quot;: {
    &quot;@waline/vercel&quot;: &quot;^1.40.3&quot;
  }
}
</code></pre><p>该配置通过 Node 原生 <code>--env-file</code> 在启动时自动加载 <code>.env</code> 文件中的环境变量，确保项目能够正确读取配置。</p><blockquote><p>若 Node.js 版本低于 20.6.0（用 <code>node -v</code> 查看），则不支持 <code>--env-file</code>，需改用 <code>dotenv-cli</code>：在 <code>dependencies</code> 中加入 <code>&quot;dotenv-cli&quot;: &quot;^11.0.0&quot;</code>，并将启动脚本写为 <code>&quot;start&quot;: &quot;dotenv node node_modules/@waline/vercel/vanilla.js&quot;</code>。此时若提示 <code>dotenv: command not found</code>，多为未执行 <code>yarn install</code> 安装该依赖所致。</p></blockquote><p>若使用企业微信应用通知，请将企业可信 IP 更新为新服务器的 IP 地址。</p><p>此外，如果你使用的是 MySQL 8，需注意认证方式的兼容性。Node.js 默认驱动不支持 MySQL 8 的新式认证，需要改回旧版，解决方法参考 <a href="https://stackoverflow.com/questions/50373427/node-js-cant-authenticate-to-mysql-8-0" target="_blank" rel="noopener noreferrer">Node.js can&#39;t authenticate to MySQL 8.0</a>。执行以下命令即可：</p><pre><code class="language-bash">ALTER USER &#39;waline&#39;@&#39;localhost&#39; IDENTIFIED WITH &#39;mysql_native_password&#39; BY &#39;yourpassword&#39;;
ALTER USER &#39;waline&#39;@&#39;127.0.0.1&#39; IDENTIFIED WITH &#39;mysql_native_password&#39; BY &#39;yourpassword&#39;;
</code></pre><h3 id="反向代理" tabindex="-1"><a class="header-anchor" href="#反向代理"><span>反向代理</span></a></h3><p>注意：如果你选择手动部署反向代理服务器，请务必使用 Waline 官方提供的 <a href="https://waline.js.org/guide/deploy/vps.html#nginx-%E9%85%8D%E7%BD%AE" target="_blank" rel="noopener noreferrer">Nginx 配置文件</a>，否则可能会导致<strong>无法登录后台</strong>，或是<strong>版本升级后仍然提示升级</strong>等问题。如果仍然有问题，请检查是否使用 SSH 直连服务器，而非宝塔自带网页终端。宝塔网页终端执行的命令有几率出错，一定要使用正常的 SSH 链接。</p><pre><code class="language-bash">server
{
  listen 80;
  listen 443 ssl http2;
  server_name waline.newzone.top;
  root /www/wwwroot/waline;
  if ($server_port !~ 443){
    rewrite ^(/.*)$ https://$host$1 permanent;
  }

  # SSL setting
  ssl_certificate    /etc/letsencrypt/live/newzone.top/fullchain.pem;
  ssl_certificate_key    /etc/letsencrypt/live/newzone.top/privkey.pem;
  ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
  ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;
  add_header Strict-Transport-Security &quot;max-age=31536000&quot;;

  # proxy to 8360
  location / {
    proxy_pass http://127.0.0.1:8360;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header REMOTE-HOST $remote_addr;
    add_header X-Cache $upstream_cache_status;
    # cache
    add_header Cache-Control no-cache;
    expires 12h;
  }
}
</code></pre><h3 id="导入时间处理" tabindex="-1"><a class="header-anchor" href="#导入时间处理"><span>导入时间处理</span></a></h3><p>如果 Waline 数据导入还原后，评论发布时间被重置为当前时间，则说明时间格式不兼容。以下以 LeanCloud 转 MySQL 为例：</p><ol><li><p><code>2023-03-24T17:27:28.121Z</code> 这个时间戳中的格式 &quot;T&quot; 和 &quot;Z&quot; 不被 MySQL 支持，要将 &quot;T&quot; 替换为空格并将 &quot;Z&quot; 删除。我写了个<a href="https://web-platform-dzhkey.stackblitz.io" target="_blank" rel="noopener noreferrer">网页工具</a>处理时间格式替换。</p></li><li><p>提取数据中的 Comment、Counter 和 Users，格式为 <code>[{},{}……,{}]</code>，依次复制到 <a href="https://www.convertjson.com/json-to-sql.htm#" target="_blank" rel="noopener noreferrer">json2sql</a> 进行操作。</p></li><li><p>在 json2sql 页面中，点击按钮「Format JSON」，然后按截图勾选「Still not happy」「Enclose field names」「Backtick (<code>name</code>)」，取消勾选第一个值的 key。同时，取消勾选 objectId 的「Include」，该项将不会导入数据库。</p><p><img src="https://img.newzone.top/2023-03-24-16-52-57.png?imageMogr2/format/webp" alt=""></p></li><li><p>将「Schema.Table or View Name」依次设为「\`wl_Comment\`」「\`wl_Counter\`」「\`wl_Users\`」，取消勾选「Create Table/View」。</p></li><li><p>在 Step 3: Generate output 下点击按钮「JSON TO SQL Insert」，然后点击复制按钮。</p></li><li><p>进入 phpMyAdmin 数据库后台，选中要操作的表（如 wl_Comment），点击右侧的 SQL 按钮运行 SQL 查询，将复制的内容粘贴到此，并点击执行。若无报错，则说明数据导入正常。</p></li></ol><p>处理后时间可以正常导入，但由于 id 结构不同，旧的评论回复将失去联系。</p><h2 id="gitalk" tabindex="-1"><a class="header-anchor" href="#gitalk"><span>Gitalk</span></a></h2><p>Gitalk 是轻量化的评论组件，用户必须登录 github 才能评论，适合项目类使用。</p><p><code>https://github.com/settings/developers</code> 页面管理已建的应用，获取 Client ID 和 Client secrets，修改应用链接。^[<a href="https://blog.csdn.net/qq_39052513/article/details/108291272" target="_blank" rel="noopener noreferrer">超 Nice 的评论组件 —— Gitalk</a>]</p><p>将以下代码复制粘贴至 docsify 页面，即可启动 Gitalk：</p><pre><code class="language-HTML">&lt;link rel=&quot;stylesheet&quot; href=&quot;https://cdn.staticfile.net/gitalk/1.8.0/gitalk.min.css&quot;&gt;

&lt;script src=&quot;https://cdn.staticfile.net/docsify/4.13.1/plugins/gitalk.min.js&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;https://cdn.staticfile.net/gitalk/1.8.0/gitalk.min.js&quot;&gt;&lt;/script&gt;
&lt;script&gt;
    /* 使用下面的 Javascript 代码生成 gitalk 插件 */
    const gitalk = new Gitalk({
        clientID: &#39;2f3da234d27ed9a7c290&#39;,
        clientSecret: &#39;d64c45594858477fff0c234c3ed3947a53b0a9ac&#39;,
        repo: &#39;docsifytalk&#39;,        //仓库名称 (GitHub repo)
        owner: &#39;rockbenben&#39;,        //仓库拥有者 (GitHub repo owner)
        admin: [&#39;rockbenben&#39;],      //仓库所有者和协作者。（对此存储库具有写访问权的用户）
        // id: location.pathname,   // Ensure uniqueness and length less than 50
        distractionFreeMode: false  // Facebook-like distraction free mode
    })
&lt;/script&gt;
</code></pre><p>Gitalk 缺点：</p><ul><li>每次有新页面时，都需要登录 github 初始化评论区。</li><li>域名不能改变，Homepage URL 和 Authorization callback URL 需与你的 Gitalk 页面一致，否则页面会报错，提示初始化，无法登录 github。</li></ul>`,31)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};