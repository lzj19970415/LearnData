import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/code/Javascript.html","title":"JavaScript","lang":"zh-CN","frontmatter":{"article":false,"title":"JavaScript","description":"全面的JavaScript实用笔记。从ES6核心语法、Map/Set数据结构到DOM操作与字符串处理，涵盖前端开发必备知识。无论新手入门还是查漏补缺，这份实战指南都能帮你巩固JS基础。","icon":"fa6-brands:js","order":2}}`),a={name:`Javascript.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<p>JavaScript 是一种具有函数优先的轻量级，解释型或即时编译型的编程语言，最新标准是 <a href="https://es6.ruanyifeng.com/" target="_blank" rel="noopener noreferrer">ECMAScript 6.0</a>。虽然它是作为开发 Web 页面的脚本语言而出名，但是它也被用到了很多非浏览器环境中，并长年居于最受欢迎编程语言排行榜榜首。</p><p>推荐学习流程：「JavaScript」&gt;「ES6」&gt;「<a href="https://jkchao.github.io/typescript-book-chinese/" target="_blank" rel="noopener noreferrer">TypeScript</a>」。</p><h2 id="es6" tabindex="-1"><a class="header-anchor" href="#es6"><span>ES6</span></a></h2><p><code>sayHi(){console.log(&quot;Hi&quot;);}</code> 等同于 <code>sayHi:function(){console.log(&quot;Hi&quot;);}</code>。</p><p><code>let</code> 声明的变量只在 let 命令所在的代码块内有效，尤其适合用于 <code>for</code> 循环的计数器。</p><p><code>const</code> 声明一个只读的常量，一旦声明，常量的值就不能改变。</p><p><code>=&gt;</code> 是指箭头函数，是一种函数的简写方式，语法为 <code>(参数)=&gt;{函数体};</code>。</p><pre><code class="language-JavaScript">x =&gt; 2 * x
//等于下方函数
function (x) {
 return 2 * x;
}
</code></pre><h2 id="数据结构" tabindex="-1"><a class="header-anchor" href="#数据结构"><span>数据结构</span></a></h2><p><code>Set</code> 类似于数组，但是成员的值都是唯一的，没有重复的值。向 Set 加入值的时候，不会发生类型转换。</p><pre><code class="language-JavaScript">// 例一
const set = new Set([1, 2, 3, 4, 4]);
[...set]
// [1, 2, 3, 4]

// 例二
const items = new Set([1, 2, 3, 4, 5, 5, 5, 5]);
items.size // 5
</code></pre><p><code>Map</code> 类似于对象，也是键值对的集合，但是“键”的范围不限于字符串，各种类型的值（包括对象）都可以当作键。</p><p>Map 的键实际上是跟内存地址绑定的，只要内存地址不一样，就视为两个键。因此有时看起来是针对同一个键，但实际上这是两个不同的数组实例，内存地址是不一样的，因此 get 方法无法读取该键，返回 undefined。</p><h2 id="常用函数" tabindex="-1"><a class="header-anchor" href="#常用函数"><span>常用函数</span></a></h2><pre><code class="language-JavaScript">document.getElementById()
document.getElementsByClassName(&quot;v-modal&quot;)[0]
document.getElementsByTagName(&quot;body&quot;)[0].remove();   //通过 Tagname 获取元素，删除指定元素
for (var i=0;i&lt;cars.length;i++) {document.write(cars[i] + &quot;&lt;br&gt;&quot;);}   //循环语句，i++会在代码被执行后增加一个值
break; //跳出当前循环但继续函数

//js 暂停
while (true){
    //100 毫秒延时
    setTimeout(f1,100)
    //直接跳出循环和函数
    return;
}

//截取中间的字符串，A 有多少字符就需要加多少位置
str = str.substring(str.indexOf(&quot;A&quot;) + 1,str.indexOf(&quot;B&quot;))

//取特定字符前后的字符串
var ture_tkl01 = taokouling.value.trim().split(&#39;打&#39;)[0];
//取第 4 位后的字符串 (4 代表开始位置，相当于从 5 开始截取到尾部)
var ture_tkl = ture_tkl01.substring(4);

//报错处理
function f1(){
    try{
        if (document.getElementById(&quot;pro-operation&quot;).getElementsByClassName(&quot;product-button02 disabled&quot;)[0].innerHTML.indexOf(&quot;立即申购&quot;)!=-1) {
            window.location.reload();
        }else{
            window.location.reload();
        }
    }catch(e){
        //下单
        document.getElementById(&quot;product-operation&quot;).getElementsByClassName(&quot;product-button02&quot;)[0].click();
    }
}

//js 函数为同步处理，只有 if else、setTimeout、for each 等函数才能按序运行

//setInterval 不要包含多个函数，否则 clearInterval 容易出错

//替换，不添加/g，则替换只发生一次
text.value = text.value.replace(&quot; &quot;, &quot;----&quot;);
//全局替换，如果使用/\\s/g，则换行符也会被替换
text.value = text.value.replace(/ /g, &quot;----&quot;);

//载入完成后，自动获取焦点。textSour 为元素 id，需配合 jquery
window.onload = function(){
 textSour.focus();
};
//按钮点击后使用函数
$(&quot;#clearEmoji&quot;).click(function () {
}

//去除每行首尾空格，支持特殊字符，首尾的空格、制表符、特殊字符的组合都被清除
strResult += split_result[i].replace(/(^[\\t\\s]*)|([\\t\\s]*$)/g, &quot;&quot;) + &#39;\\n&#39;;
</code></pre><h2 id="javascript-对象" tabindex="-1"><a class="header-anchor" href="#javascript-对象"><span>JavaScript 对象</span></a></h2><p>对象由花括号分隔。在括号内部，对象的属性以名称和值对的形式 (name : value) 来定义。 对象一定要用<strong>英文冒号</strong>来注明，否则整段代码失效。属性由逗号分隔：</p><pre><code class="language-JavaScript">var person={firstname:&quot;John&quot;, lastname:&quot;Doe&quot;, id:5566};
//对象属性有两种寻址方式
name=person.lastname;
name=person[&quot;lastname&quot;];

//对象的方法定义了一个函数，并作为对象的属性存储。对象方法通过添加 () 调用 (作为一个函数)。
&lt;p id=&quot;对象&quot;&gt;&lt;/p&gt;
&lt;script&gt;
 var person ={
  firstname:&quot;名&quot;,
  lastname:&quot;姓&quot;,
  fullname:function()
  {
   return this.lastname+this.firstname
  },       //不同属性间需要加逗号隔开
  eyecolor:&quot;blue&quot;};
 document.getElementById(&quot;对象&quot;).innerHTML=
 person.fullname()+&quot;眼睛颜色是&quot;+person.eyecolor  ;
&lt;/script&gt;
</code></pre><h3 id="全局变量" tabindex="-1"><a class="header-anchor" href="#全局变量"><span>全局变量</span></a></h3><p>js 的全部变量要用 <code>window.</code> 来定义。如果变量在函数内没有声明（没有使用 var），该变量为全局变量。</p><p>局部变量：在函数中通过 var 声明的变量。全局变量：在函数外通过 var 声明的变量。</p><p>没有声明就使用的变量，默认为全局变量，不论这个变量在哪被使用。</p><pre><code class="language-JavaScript">&lt;p id=&quot;demo&quot;&gt;&lt;/p&gt;
&lt;script&gt;
myFunction();
document.getElementById(&quot;demo&quot;).innerHTML = &quot;我可以显示 &quot; + carName;
function myFunction()
{
    carName = &quot;Volvo&quot;;   //如果在这添加 var，声明变量，则变为局部变量，无法调用
}
&lt;/script&gt;
</code></pre><h3 id="变量类型" tabindex="-1"><a class="header-anchor" href="#变量类型"><span>变量类型</span></a></h3><p>当你声明新变量时，可以使用关键词 &quot;new&quot; 来声明其类型：</p><pre><code class="language-JavaScript">var carname = new String();
字符串;
var x = new Number();
数字;
var y = new Boolean();
布尔;
var cars = new Array();
数组;
var person = new Object();
对象;
var y = new String(&quot;John&quot;);
对象;

// 数据赋值
var length = 16; // Number 通过数字字面量赋值
var points = x * 10; // Number 通过表达式字面量赋值
var lastName = &quot;Johnson&quot;; // String 通过字符串字面量赋值
var cars = [&quot;Saab&quot;, &quot;Volvo&quot;, &quot;BMW&quot;]; // Array  通过数组字面量赋值
var person = { firstName: &quot;John&quot;, lastName: &quot;Doe&quot; }; // Object 通过对象字面量赋值
</code></pre><h2 id="运算符" tabindex="-1"><a class="header-anchor" href="#运算符"><span>运算符</span></a></h2><pre><code class="language-JavaScript">//后置++是将自身的值赋给新变量，然后才自身加 1.
//前置++是将自身加 1 的值赋值给新变量，同时自身也加 1；
int a;
a=i++;//将 i 的值赋值给 a，即 a=i；然后再执行 i=i+1；也就是【a=i++;】与【a=i; i=i+1;】等价。
a=++i;//将 i+1 的值赋给 a，即 a=i+1;然后再执行 i=i+1；也就是【a=++i;】与【a=i+1;i=i+1;】等价。
</code></pre><pre><code class="language-JavaScript">// 描述 (x=5) 比较
// == 等于
x==8 false
x==5 true
// === 绝对等于（值和类型均相等）
x===&quot;5&quot; false
x===5 true
// != 不等于
x!=8 true
// !== 不绝对等于（值和类型有一个不相等，或两个都不相等）
x!==&quot;5&quot; true
x!==5 false

&amp;&amp; 且
|| 或
</code></pre><h2 id="javascript-应用" tabindex="-1"><a class="header-anchor" href="#javascript-应用"><span>JavaScript 应用</span></a></h2><h3 id="取随机值" tabindex="-1"><a class="header-anchor" href="#取随机值"><span>取随机值</span></a></h3><pre><code class="language-JavaScript">//[任意随机值](https://www.runoob.com/w3cnote/js-random.html)
Math.floor(Math.random() * (max - min + 1) + min);

//
var arr01 = textSour.value.split(&quot;\\n&quot;);
//分割字符数组，主要用于淘口令网
var arr01 = [&quot;打&quot;, &quot;哒&quot;, &quot;达&quot;];
//循环语句，i++会在代码被执行后增加一个值
for (var x = 0; x &lt; arr01.length; x++) {
  //存在循环后分割，并跳出循环
  if (taokouling.value.indexOf(arr01[x]) != -1) {
    ture_tkl01 = taokouling.value.trim().split(arr01[x])[0];
    break;
  }
}

// https://segmentfault.com/q/1010000006819233 //不重复获取
for (var i = 0; i &lt; rn; ++i) {
  var index = ~~(Math.random() * count) + i;
  result[i] = split_result[index];
  split_result[index] = split_result[i];
  count--;
  strResult = strResult + result[i] + &quot;\\n&quot;;
}
</code></pre><h3 id="文本框清空" tabindex="-1"><a class="header-anchor" href="#文本框清空"><span>文本框清空</span></a></h3><p>input 文本框获取焦点后，自动清空内容。</p><pre><code class="language-JavaScript">onfocus = &quot;this.value=&#39;&#39;&quot;;
</code></pre><h3 id="内部文件读取" tabindex="-1"><a class="header-anchor" href="#内部文件读取"><span>内部文件读取</span></a></h3><p>以下代码用于服务器读取文档，本地无法直接使用。</p><pre><code class="language-JavaScript">$.ajax({
  url: &quot;./xx.txt&quot;,
  success: function (result) {
    var strs = result.split(&quot;\\n&quot;);
    addTableTR(strs, true);
  },
});
</code></pre><h3 id="选择框状态" tabindex="-1"><a class="header-anchor" href="#选择框状态"><span>选择框状态</span></a></h3><p>调用 attr 给选择框 radio、checkbox 添加 checked 属性和移除，并不能真实改变不能单选和选中框的真实状态，可用下方代码改变。^[<a href="https://www.cnblogs.com/jimloveq/p/10602060.html" target="_blank" rel="noopener noreferrer">radio、checkbox 选中状态研究</a>]</p><pre><code class="language-JavaScript">//取消导航项的 checked，同类名称都会取消 checked 状态
$(&quot;input[name=daoruRadio]&quot;).prop(&quot;checked&quot;, false);
//点击对映 id 的单选框
$(&quot;input[id=Radio1]&quot;).prop(&quot;checked&quot;, true);
</code></pre><h3 id="复制隐藏内容" tabindex="-1"><a class="header-anchor" href="#复制隐藏内容"><span>复制隐藏内容</span></a></h3><p>clipboardjs 可复制隐藏区域内容。</p><pre><code class="language-JavaScript">//新设将粘贴板设在特定按钮上，#copyresult 为按钮 id，#CopyValue 为区域 id
var clipboard2 = new ClipboardJS(&quot;#copyresult&quot;, {
  text: function () {
    return $(&quot;#CopyValue&quot;).val();
  },
});

clipboard2.on(&quot;success&quot;, function (e) {
  toastr[&quot;success&quot;](&quot;复制成功！&quot;);
});

clipboard2.on(&quot;error&quot;, function (e) {
  toastr[&quot;error&quot;](&quot;复制失败，请手动重新复制！&quot;);
});
</code></pre><h3 id="引入-html-页面" tabindex="-1"><a class="header-anchor" href="#引入-html-页面"><span>引入 html 页面</span></a></h3><blockquote><p>⚠️ HTML Imports（<code>&lt;link rel=&quot;import&quot;&gt;</code>）已于 2019 年（Chrome 73）移除，且 Firefox / Safari 从未支持。现代做法请改用 ES Modules、<code>fetch</code> + <code>&lt;template&gt;</code> 或 <code>&lt;iframe&gt;</code>。</p></blockquote><p>旧写法（已废弃）利用 link 标签的 rel=import 引入 html 页面：</p><pre><code class="language-html">&lt;link rel=&quot;import&quot; href=&quot;header.html&quot; /&gt;
</code></pre><h3 id="视频全屏弹窗" tabindex="-1"><a class="header-anchor" href="#视频全屏弹窗"><span>视频全屏弹窗</span></a></h3><p>品牌首页经常需要自动加载视频，可将下方代码放入首页源码的 body 区。</p><pre><code class="language-html">&lt;link
  rel=&quot;stylesheet&quot;
  type=&quot;text/css&quot;
  href=&quot;https://cdn.staticfile.org/layer/3.5.1/theme/default/layer.min.css&quot;
/&gt;
&lt;script src=&quot;https://cdn.staticfile.net/jquery/3.7.1/jquery.min.js&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;https://cdn.staticfile.org/layer/3.5.1/layer.min.js&quot;&gt;&lt;/script&gt;
&lt;script type=&quot;text/javascript&quot;&gt;
  window.onload = function () {
    //页面一打开就执行，放入 ready 是为了 Layer 所需配件（css、扩展模块）加载完毕
    layer.ready(function () {
      //iframe 层 - 多媒体
      layer.open({
        //type 值为 1 时，则可直接套用视频
        type: 2,
        title: false,
        area: [&quot;630px&quot;, &quot;360px&quot;],
        shade: 0.8,
        closeBtn: 0,
        shadeClose: true,
        //视频链接
        content:
          &quot;https://iluminage-cdn.oss-cn-shanghai.aliyuncs.com/brand-video.MP4&quot;,
      });
    });
  };
&lt;/script&gt;
</code></pre><p>插入视频代码</p><pre><code class="language-html">&lt;div style=&quot;line-height:0;font-size:0&quot;&gt;
  &lt;video
    width=&quot;100%&quot;
    height=&quot;100%&quot;
    controls=&quot;controls&quot;
    autoplay=&quot;autoplay&quot;
    autobuffer=&quot;autobuffer&quot;
    src=&quot;https://iluminage-cdn.oss-cn-shanghai.aliyuncs.com/brand-video.MP4&quot;
  &gt;&lt;/video&gt;
&lt;/div&gt;
</code></pre>`,53)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};