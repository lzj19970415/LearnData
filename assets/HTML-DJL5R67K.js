import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/code/HTML.html","title":"HTML","lang":"zh-CN","frontmatter":{"article":false,"title":"HTML","description":"前端开发者的HTML实用宝典。涵盖相对路径、字符实体等基础知识，精选实用JS插件与CSS布局技巧。从Bootstrap响应式布局到代码压缩工具，助你全面提升网页与移动端开发效率。","icon":"fa6-brands:html5","order":1}}`),a={name:`HTML.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<p>HTTPS 网页中，js、css、gif 等文件都必须要使用 https，否则会加载报错，图片可以不使用 https。</p><h2 id="基础知识" tabindex="-1"><a class="header-anchor" href="#基础知识"><span>基础知识</span></a></h2><h3 id="相对路径" tabindex="-1"><a class="header-anchor" href="#相对路径"><span>相对路径</span></a></h3><pre><code class="language-javascript">/ 根目录（electron 不适用）
./ 当前目录（可省略不写）
../ 父级目录（返回到上一级目录）
../../ 祖父级目录（返回两级目录）
</code></pre><h3 id="反义、转义字符" tabindex="-1"><a class="header-anchor" href="#反义、转义字符"><span>反义、转义字符</span></a></h3><p>一些字符在 HTML 中拥有特殊的含义，如果我们希望浏览器正确地显示这些字符，我们必须在 HTML 源码中插入字符实体。</p><table><thead><tr><th>显示结果</th><th>描述</th><th>实体名称</th><th>实体编号</th></tr></thead><tbody><tr><td></td><td>空格</td><td>&amp;nbsp;</td><td>&amp;#160;</td></tr><tr><td>&lt;</td><td>小于号</td><td>&amp;lt;</td><td>&amp;#60;</td></tr><tr><td>&gt;</td><td>大于号</td><td>&amp;gt;</td><td>&amp;#62;</td></tr><tr><td>&amp;</td><td>和号</td><td>&amp;amp;</td><td>&amp;#38;</td></tr><tr><td>&quot;</td><td>引号</td><td>&amp;quot;</td><td>&amp;#34;</td></tr><tr><td>&#39;</td><td>撇号</td><td>&amp;apos;</td><td>&amp;#39;</td></tr></tbody></table><h2 id="javascript-插件" tabindex="-1"><a class="header-anchor" href="#javascript-插件"><span>JavaScript 插件</span></a></h2><ul><li><a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">font-awesome</a>：图标字体。</li><li><a href="https://layuion.com/" target="_blank" rel="noopener noreferrer">Layui</a>：开源模块化前端 UI 组件库。</li><li><a href="https://github.com/CodeSeven/toastr" target="_blank" rel="noopener noreferrer">toastr.js</a>：通知提示。</li><li><a href="https://popper.js.org/" target="_blank" rel="noopener noreferrer">popper.js</a>：一个轻量级的库用于管理工具提示和弹窗效果。</li><li><a href="https://dayjs.gitee.io/docs/zh-CN/get-set/get-set" target="_blank" rel="noopener noreferrer">Day.js</a>：时间输入转换，支持时间戳，格式化时间、过去时间展示、解决因时区变更。</li><li><a href="https://github.com/javve/list.js" target="_blank" rel="noopener noreferrer">list.js</a>：实时搜索页面，并直接显示结果页面。为列表、表格或其他任何 HTML 标签增加了搜索，排序，过滤器和灵活性等元素。网页中会自动将大段空格压缩为一个空格，不用特意替换。</li><li><a href="https://github.com/saucxs/watermark-dom" target="_blank" rel="noopener noreferrer">watermark.js</a>：网页文字水印。</li><li><a href="https://codemirror.net/" target="_blank" rel="noopener noreferrer">codemirror</a>：代码编辑器，为 textarea 加行号。^[<a href="https://www.cnblogs.com/zhnaglei/p/6697638.html" target="_blank" rel="noopener noreferrer">开源 JavaScript 插件和库</a>]</li></ul><h3 id="功能加强" tabindex="-1"><a class="header-anchor" href="#功能加强"><span>功能加强</span></a></h3><ul><li><a href="https://clipboardjs.com/" target="_blank" rel="noopener noreferrer">clipboard.js</a>：复制到剪贴板方式，无需 Flash。</li><li><a href="https://github.com/eligrey/FileSaver.js" target="_blank" rel="noopener noreferrer">FileSaver.js</a>：导出为本地文件，需手动指定路径。</li><li><a href="https://github.com/pqina/filepond" target="_blank" rel="noopener noreferrer">filepond</a>：一个 JavaScript 文件上传库，可以上传拖入的任何内容，具有体积小、上传快、方便的文件管理等特点。</li><li><a href="https://github.com/oct16/TimeCat" target="_blank" rel="noopener noreferrer">timecat.js</a>：一款 JS 的网页录屏工具。参考了游戏录像的原理而实现的渲染引擎，生成的录像文件只有传统视频的百分之一！还可以在录制语音的同时自动生成字幕，导出的视频文件可以跨端播放。</li></ul><h3 id="小游戏代码" tabindex="-1"><a class="header-anchor" href="#小游戏代码"><span>小游戏代码</span></a></h3><ul><li><a href="https://github.com/muan/emoji-minesweeper" target="_blank" rel="noopener noreferrer">emoji-minesweeper</a>：Emoji 符号的扫雷游戏。代码很简短，游戏创意很酷。寥寥 300+ 行代码实现该游戏，简短易于初学者学习。</li><li><a href="https://github.com/KilledByAPixel/HueJumper2k" target="_blank" rel="noopener noreferrer">HueJumper2k</a>：JS 实现的 2KB 大小的 3D 赛车游戏。</li><li><a href="https://github.com/shinima/battle-city" target="_blank" rel="noopener noreferrer">battle-city</a>：基于 React 的经典坦克大战。</li><li><a href="https://github.com/chvin/react-tetris" target="_blank" rel="noopener noreferrer">react-tetris</a>：逼真的俄罗斯方块。</li></ul><h2 id="css-样式" tabindex="-1"><a class="header-anchor" href="#css-样式"><span>CSS 样式</span></a></h2><p>CSS 样式：<a href="https://lhammer.cn/You-need-to-know-css/#/zh-cn/" target="_blank" rel="noopener noreferrer">You-need-to-know-css</a></p><h3 id="图片" tabindex="-1"><a class="header-anchor" href="#图片"><span>图片</span></a></h3><p>图片增加属性，自动扩展宽高。</p><pre><code class="language-html">&lt;img src=&quot;&lt;https://img.newzone.top/xxx.png&gt;&quot; style=&quot;width:50%; height:50%;&quot; /&gt;
&lt;img src=&quot;&lt;https://img.newzone.top/xxx.png&gt;&quot; width=&quot;100&quot; height=&quot;100&quot; /&gt;

&lt;!-- bootstrap 下自动控制图片大小 --&gt;
&lt;img src=&quot;&lt;https://img.newzone.top/xxx.png&gt;&quot; class=&quot;img-fluid&quot; /&gt;
</code></pre><p>图片链接为空时，去除图片所占区域，并防止出现空边框。</p><pre><code class="language-html">&lt;style type=&quot;text/css&quot;&gt;
  img[src=&quot;&quot;],
  img:not([src]) {
    opacity: 0;
    width: 0;
    height: 0;
  }
&lt;/style&gt;
</code></pre><p>当图床图片无法显示时，尝试屏蔽自己网站的 referrer，在源码中添加：<code>&lt;meta name=&quot;referrer&quot; content=&quot;no-referrer&quot; /&gt;</code>。</p><h3 id="纯色背景" tabindex="-1"><a class="header-anchor" href="#纯色背景"><span>纯色背景</span></a></h3><p>body 铺满页面，添加纯色背景。</p><pre><code class="language-html">&lt;style&gt;
  body {
    background-color: #222b3a;
  }
  html,
  body {
    height: 100%;
  }
&lt;/style&gt;
</code></pre><p>或使用 bootstrap 的样式<code>class=&quot;bg-light&quot;</code>。</p><h3 id="鼠标经过变色" tabindex="-1"><a class="header-anchor" href="#鼠标经过变色"><span>鼠标经过变色</span></a></h3><p>鼠标经过重链接，则该区域变色。</p><pre><code class="language-css">.tg td a:hover {
  background: #f29901;
  display: block;
}
</code></pre><h3 id="隐藏元素" tabindex="-1"><a class="header-anchor" href="#隐藏元素"><span>隐藏元素</span></a></h3><p>隐藏网页元素</p><pre><code class="language-bash"># 将元素的显示设为无，元素在网页中不占任何的位置。
style=&quot;display:none;&quot;
# 将元素隐藏，但是元素在网页中的位置还是被占着。
style=&quot;visibility:hidden;&quot;

# 显示隐藏元素
$(&#39;#hidden_sort&#39;).show();
# 继续隐藏#hidden_sort
$(&#39;#hidden_sort&#39;).hide();

&lt;div id=&quot;hidden_alert&quot; style=&quot;display:none;&quot; class=&quot;col-12 alert alert-primary&quot; role=&quot;alert&quot;&gt;标题数过大&lt;/div&gt;
# 当无法使用，继续隐藏#hidden_sort
document.getElementById(&#39;hidden_alert&#39;).style.display=&quot;none&quot;;
document.getElementById(&#39;hidden_alert&#39;).style.display=&quot;block&quot;;

# 显示 div span 的文本内容
hidden_alert.textContent=&quot;标题数超过，请减少标题数或取消勾选「避重」&quot;;
</code></pre><h3 id="高亮" tabindex="-1"><a class="header-anchor" href="#高亮"><span>高亮</span></a></h3><p>对选择文章进行着色高亮。</p><pre><code class="language-html">&lt;a style=&quot;color: #FF0000;&quot;&gt;xxx&lt;/a&gt;
</code></pre><h2 id="页面布局" tabindex="-1"><a class="header-anchor" href="#页面布局"><span>页面布局</span></a></h2><h3 id="自适应布局" tabindex="-1"><a class="header-anchor" href="#自适应布局"><span>自适应布局</span></a></h3><p>自适应布局以 Bootstrap 为主，具体说明参考 <a href="https://getbootstrap.com/docs/5.1/utilities/spacing/" target="_blank" rel="noopener noreferrer">Bootstrap 文档</a>。</p><pre><code class="language-css"># 分别为距离上下左右，
class=&quot;mt-5 mb-5 ms-4 me-4&quot;

# 修改间距
style=&quot;margin-top:-15px;margin-bottom:-15px&quot;

# 图片自动拉伸宽度
style=&quot;background-size:contain|cover;width:100%;height:auto;&quot;

# 视频将宽度设置大些，然后让其自动缩放
width=&quot;2400px&quot;
</code></pre><h3 id="客户端自适应" tabindex="-1"><a class="header-anchor" href="#客户端自适应"><span>客户端自适应</span></a></h3><p>判断设备是移动还是 PC，然后显示不同样式内容。</p><pre><code class="language-html">&lt;script&gt;
  window.onload = function () {
    browserRedirect();
  };
  function browserRedirect() {
    var sUserAgent = navigator.userAgent.toLowerCase();
    var bIsIpad = sUserAgent.match(/ipad/i) == &quot;ipad&quot;;
    var bIsIphoneOs = sUserAgent.match(/iphone os/i) == &quot;iphone os&quot;;
    var bIsMidp = sUserAgent.match(/midp/i) == &quot;midp&quot;;
    var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == &quot;rv:1.2.3.4&quot;;
    var bIsUc = sUserAgent.match(/ucweb/i) == &quot;ucweb&quot;;
    var bIsAndroid = sUserAgent.match(/android/i) == &quot;android&quot;;
    var bIsCE = sUserAgent.match(/windows ce/i) == &quot;windows ce&quot;;
    var bIsWM = sUserAgent.match(/windows mobile/i) == &quot;windows mobile&quot;;
    if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
      //移动端页面
      $(&quot;#mobile&quot;).show();
      $(&quot;#pc&quot;).hide();
    } else {
      //pc 端页面
      $(&quot;#mobile&quot;).hide();
      $(&quot;#pc&quot;).show();
    }
  }
&lt;/script&gt;
&lt;div id=&quot;pc&quot; style=&quot;display: none;&quot;&gt;
  &lt;img src=&quot;../upload/202108/1629972325344278.png&quot; title=&quot;&quot; data-width=&quot;1920&quot; data-height=&quot;1080&quot; /&gt;
&lt;/div&gt;
&lt;div id=&quot;mobile&quot; style=&quot;text-align:center;display: none;&quot;&gt;
  &lt;img src=&quot;https://iluminage-cdn.oss-cn-shanghai.aliyuncs.com/upload/202108/1628149761.png&quot; /&gt;
&lt;/div&gt;
</code></pre><h3 id="本地压缩-html" tabindex="-1"><a class="header-anchor" href="#本地压缩-html"><span>本地压缩 HTML</span></a></h3><p><a href="https://github.com/kangax/html-minifier" target="_blank" rel="noopener noreferrer">html-minifier</a> 能在本地批量压缩 HTML、CSS 和 JavaScript 源码。</p><pre><code class="language-bash"># 全局安装 html-minifier
npm install html-minifier -g
# 终端中执行压缩命令，默认压缩 input 下所有文件，压缩选项参照 http://kangax.github.io/html-minifier/
html-minifier --collapse-boolean-attributes --collapse-whitespace --decode-entities --no-html5 --minify-css true --minify-js true --process-conditional-comments --process-scripts text/html --remove-attribute-quotes --remove-comments --remove-empty-attributes --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-style-link-type-attributes --remove-tag-whitespace --sort-attributes --sort-class-name --trim-custom-fragments --use-short-doctype --input-dir D:\\Backup\\raw --output-dir D:\\Backup\\1
</code></pre>`,44)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};