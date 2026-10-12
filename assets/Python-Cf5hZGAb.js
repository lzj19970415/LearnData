import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/code/Python.html","title":"Python","lang":"zh-CN","frontmatter":{"article":false,"title":"Python","description":"Python3实用学习备忘录。涵盖基础语法、常用模块、数据结构、字符串操作，及Lambda函数等进阶用法。无论初学入门还是快速查阅，助你高效掌握核心知识。","icon":"fa6-brands:python","order":3}}`),a={name:`Python.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<p>Python 很久没用了，暂时只做记录作用。</p><h2 id="入门文档" tabindex="-1"><a class="header-anchor" href="#入门文档"><span>入门文档</span></a></h2><ul><li><a href="https://www.runoob.com/python3/python3-basic-syntax.html" target="_blank" rel="noopener noreferrer">Python3 语法</a></li><li><a href="https://scrapy-chs.readthedocs.io/zh-cn/latest/intro/tutorial.html#intro-tutorial" target="_blank" rel="noopener noreferrer">Scrapy 入门</a> 浮点数：1.23x109 就是 1.23e9，或者 12.3e8，0.000012 可以写成 1.2e-5</li><li><a href="https://requests.readthedocs.io/zh_CN/latest/" target="_blank" rel="noopener noreferrer">requests</a> 模块 - 获取数据</li><li><a href="https://www.crummy.com/software/BeautifulSoup/bs4/doc.zh/" target="_blank" rel="noopener noreferrer">BeautifulSoup4</a> 模块 - 解析 HTML</li><li><a href="https://openpyxl.readthedocs.io/en/stable/" target="_blank" rel="noopener noreferrer">openpyxl</a> 模块 - 读写 Excel 文件</li><li>Pillow 模块 - 图片</li><li>re 模块 - 正则表达式</li></ul><h2 id="简单示例" tabindex="-1"><a class="header-anchor" href="#简单示例"><span>简单示例</span></a></h2><pre><code class="language-python">import requests  #载入指定库
headers = {&#39;User-Agent&#39;: &#39;Mozilla/5.0 (Windows NT 10.0; WOW64; rv:63.0) Gecko/20100101 Firefox/63.0&#39;, &#39;Content-Type&#39;: &#39;text/html; charset=utf-8&#39;}
r = requests.get(&quot;&lt;http://www.runoob.com/python3/python3-string.html&gt;&quot;, headers=headers)
#r.encoding = &#39;utf-8&#39; #如果没设置表头，可以设置编码防止中文出现乱码
r.encoding = r.apparent_encoding #使用网页固定编码
print(r.text)
print(r.headers)

from bs4 import BeautifulSoup
soup = BeautifulSoup(r.text, &quot;html.parser&quot;)
print(soup.title.string)

from PIL import Image

# 打开一个 jpg 图像文件，注意是当前路径
im = Image.open(&#39;test.jpg&#39;)
# 获得图像尺寸
w, h = im.size
print(&#39;Original image size: %sx%s&#39; % (w, h))
# 缩放到 50%
im.thumbnail((w//2, h//2))
print(&#39;Resize image to: %sx%s&#39; % (w//2, h//2))
# 把缩放后的图像用 jpeg 格式保存
im.save(&#39;thumbnail.jpg&#39;, &#39;jpeg&#39;)
</code></pre><p><code>if __name__ == &quot;__main__&quot;</code> 是只在主程序中运行，如果是作为模块引用，则不运行。 <code>sys.path.append(&quot;c:\\\\\\\\Python37\\\\\\\\test&quot;)</code> 添加模块的搜索路径文件夹。<code>\\\\</code> 在 Python 中会转义，所以要输入两个。</p><h2 id="基础语法" tabindex="-1"><a class="header-anchor" href="#基础语法"><span>基础语法</span></a></h2><pre><code class="language-python"># end=&quot; &quot;为后缀，可空，默认为换行符
print(&quot;密码不能含有“*”，你还有&quot;,count,&quot;次机会&quot;, end=&quot; &quot;)

# &#39;&#39;&#39; 三引号可以用多行，或在每行后添加 \\\\ ，或每行用引号括起来

type(a) #判别变量种类，容易出问题，不要用于判定
isinstance(a,float) #判断变量是否是该类型，主要使用

# s 为字符串
s.isalnum()  #所有字符都是数字或者字母，为真返回 True, 否则返回 False
s.isalpha()  #所有字符都是字母，为真返回 True, 否则返回 False
s.isdigit()  #所有字符都是数字，为真返回 True, 否则返回 False
s.islower()  #所有字符都是小写，为真返回 True, 否则返回 False
s.isupper()  #所有字符都是大写，为真返回 True, 否则返回 False
s.istitle()  #所有单词都是首字母大写，为真返回 True, 否则返回 False
s.isspace()  #所有字符都是空白字符，为真返回 True, 否则返回 False
</code></pre><h2 id="序列类型" tabindex="-1"><a class="header-anchor" href="#序列类型"><span>序列类型</span></a></h2><pre><code class="language-python">#列表
list =[1,2,3,&quot;a&quot;,&quot;b&quot;]
list.append([4,1])
list =[1,2,3,&quot;a&quot;,&quot;b&quot;,[4,1]] #append() 函数是方法向列表的尾部添加一个新的元素

#元组
tuple = (1,2,3,&quot;a&quot;,&quot;b&quot;)
tuple = (1,) #元组只有一个元素时，必须在后面加逗号

#字符串
set() 是个集合函数，括号里的参数可以是字典类型，列表类型，元组类型，字符串类型，不能是数字类型。
s1 = &quot;abc123&quot;
s2 = &quot;abc,123&quot;
s2.split(&quot;,&quot;) #字符串分割后变为列表，使用逗号进行分割 [&quot;abc&quot;, &quot;123&quot;]
print(&quot;|&quot;.join(list)) #join 只能对字符串进行操作，用&quot;|&quot;中的符号连接字符串，比如 ab

r1 = range(1, 4)

#集合是无序列的，每次出现顺序都不同，不支持按索引提取
set()
set1 = set(list) =([1,2,3,&quot;a&quot;,&quot;b&quot;])
college1 = {&quot;哲学&quot;, &quot;经济学&quot;, &quot;法学&quot;}
print(college1) #每次集合排列顺序是随机的
college2 = set([&quot;哲学&quot;, &quot;经济学&quot;, &quot;法学&quot;]) #将其他数据转换为集合

#字典
dict()
{}
</code></pre><h2 id="字符串用法" tabindex="-1"><a class="header-anchor" href="#字符串用法"><span>字符串用法</span></a></h2><pre><code class="language-python">len(string) #返回字符串长度
join(seq)  # 以指定字符串作为分隔符，将 seq 中所有的元素 (的字符串表示) 合并为一个新的字符串
startswith(str, beg=0,end=len(string)) #检查字符串是否是以 obj 开头，是则返回 True，否则返回 False。如果 beg 和 end 指定值，则在指定范围内检查。
endswith(suffix, beg=0, end=len(string)) # 检查字符串是否以 obj 结束，如果 beg 或者 end 指定则检查指定的范围内是否以 obj 结束，如果是，返回 True，否则返回 False.

count(str, beg= 0,end=len(string))  # 返回 str 在 string 里面出现的次数，如果 beg 或者 end 指定则返回指定范围内 str 出现的次数
find(str, beg=0, end=len(string))  #检测 str 是否包含在字符串中，如果指定范围 beg 和 end，则检查是否包含在指定范围内，如果包含返回开始的索引值，否则返回 -1
rfind(str, beg=0,end=len(string)) #类似于 find() 函数，不过是从右边开始查找。
index(str, beg=0, end=len(string)) # 跟 find() 方法一样，只不过如果 str 不在字符串中会报一个异常。
rindex( str, beg=0, end=len(string)) #类似于 index()，不过是从右边开始。

strip([chars])   #在字符串上执行 lstrip() 和 rstrip(),移除头尾指定字符
replace(old, new [, max]) #把 将字符串中的 str1 替换成 str2，如果 max 指定，则替换不超过 max 次。
split(str=&quot;&quot;, num=string.count(str))  #num=string.count(str)) 以 str 为分隔符截取字符串，如果 num 有指定值，则仅截取 num 个子字符串
splitlines([keepends])  #按照行 (&#39;\\\\r&#39;, &#39;\\\\r\\\\n&#39;, \\\\n&#39;) 分隔，返回一个包含各行作为元素的列表，如果参数 keepends 为 False，不包含换行符，如果为 True，则保留换行符。

lower()  #转换字符串中所有大写字符为小写。
upper()  #转换字符串中的小写字母为大写
swapcase() #将字符串中大写转换为小写，小写转换为大写
</code></pre><h2 id="运算符" tabindex="-1"><a class="header-anchor" href="#运算符"><span>运算符</span></a></h2><table><thead><tr><th>运算符</th><th>描述</th><th>实例</th></tr></thead><tbody><tr><td>%</td><td>取模 - 返回除法的余数</td><td>21 % 10 输出结果 1</td></tr><tr><td>**</td><td>幂 - 返回 x 的 y 次幂</td><td>10**21 为 10 的 21 次方</td></tr><tr><td>//</td><td>取整除 - 返回商的整数部分</td><td>9//2 输出结果 4 , 9.0//2.0 输出结果 4.0</td></tr></tbody></table><p>优先级：not &gt; and &gt; or not 1 or 0 and 1 or 3 and 4 or 5 (not 1) or (0 and 1) or (3 and 4) or 5</p><p><img src="https://img.newzone.top/2022-06-29-18-18-44.png?imageMogr2/format/webp" alt="Python 运算符优先级"></p><h2 id="条件三元表达式" tabindex="-1"><a class="header-anchor" href="#条件三元表达式"><span>条件三元表达式</span></a></h2><pre><code class="language-python">x, y = 4, 5
if x &lt; y:
    small = x
else:
    small = y
# 可以缩略为下面一句
small = x if x &lt; y else y

x,y,z=6,5,5
if x&lt;y:
    small = x
    if z &lt; small:
        small =z
elif y &lt; z:
    small =y
else:
    small = z
# 可以缩略为下面一句
small = x if (x&lt;y and not(z&lt;x)) else (y if y&lt;z else z)
</code></pre><h2 id="条件循环" tabindex="-1"><a class="header-anchor" href="#条件循环"><span>条件循环</span></a></h2><pre><code class="language-python">while True:    # 无限循环条件
break # 跳出 for 和 while 的循环体。如果你从 for 或 while 循环中终止，任何对应的循环 else 块将不执行
continue # 告诉 Python 跳过当前循环块中的剩余语句，然后继续进行下一轮循环
for a in b   #遍历任何序列的项目，如一个列表或者一个字符串

# assert（断言）确保程序中的某个条件一定为真才能让程序正常工作，否则就让程序自动崩溃并抛出 AssertionError 异常
assert 3 &gt; 4
</code></pre><pre><code class="language-python">#条件循环参考，用户只有三次输入错误，内容中包含“*”不计算在内
count=3
password=&quot;xxxxdfd&quot;

while count:  # 0 为 False，其他为 True
    passwd = input(&quot;请输入密码：&quot;)
    if passwd == password:
        print(&quot;密码正确，进入程序&quot;)
        break
    elif &quot;*&quot; in passwd:
  # end=&quot; &quot;为后缀，可空，默认为换行符
        print(&quot;密码不能含有“*”，你还有&quot;,count,&quot;次机会&quot;, end=&quot; &quot;)
        continue
    else:
        print(&quot;密码错误，你还有&quot;,count-1,&quot;次机会&quot;, end=&quot; &quot;)
    count-=1
</code></pre><h2 id="range-函数" tabindex="-1"><a class="header-anchor" href="#range-函数"><span>range() 函数</span></a></h2><p>range(stop)</p><p>range(start, stop[, step])</p><p>range 函数具有一些特性：</p><ul><li>如果 step 参数缺省，默认 1；如果 start 参数缺省，默认 0。</li><li>如果 step 是正整数，则最后一个元素（start + i _ step）小于 stop。</li><li>如果 step 是负整数，则最后一个元素（start + i _ step）大于 stop。</li><li>step 参数必须是非零整数，否则抛出 ValueError 异常。</li></ul><h2 id="向列表添加元素" tabindex="-1"><a class="header-anchor" href="#向列表添加元素"><span>向列表添加元素</span></a></h2><p><a href="http://www.runoob.com/python/python-lists.html" target="_blank" rel="noopener noreferrer">向列表添加元素</a></p><pre><code class="language-python">list =[1,&quot;xxxx&quot;,3.14,[1,3,3]]
list.append(3)   # 添加元素
list.extend([1,2,&quot;或&quot;])    # 添加列表
list.insert(index, obj)   # index -- 对象 obj 需要插入的索引位置 (从 0 开始 ); obj -- 要插入列表中的对象。

list.remove(&quot;xxxx&quot;)  # 删除第一个含有相同内容的元素
del list[2]            #删除指定索引位置的元素
list.pop(obj=list[-1])      #obj -- 可选参数，从列表要移除指定索引位置的对象，默认为最后以为，返回被移出的元素对象

list.reverse()  #将列表彻底反转
list.sort()        #从小往大排序
list.sort(reverse=True) #从大往小排序

将指定列表的小甲鱼改为小鱿鱼
list1 = [1, [1, 2, [&#39;小甲鱼&#39;]], 3, 5, 8, 13, 18]
list1[1][2][0] = &#39;小鱿鱼&#39;
</code></pre><h2 id="列表切片" tabindex="-1"><a class="header-anchor" href="#列表切片"><span>列表切片</span></a></h2><p>L = [&#39;Google&#39;, &#39;Runoob&#39;, &#39;Taobao&#39;]</p><p>L(start: stop[: step]) step 可以使用负数，从尾部往左走。</p><table><thead><tr><th>结果 Python 表达式</th><th>结果</th><th>描述</th></tr></thead><tbody><tr><td>L[2]</td><td>&#39;Taobao&#39;</td><td>读取列表中第三个元素</td></tr><tr><td>L[-2]</td><td>&#39;Runoob&#39;</td><td>读取列表中倒数第二个元素</td></tr><tr><td>L[1:]</td><td>[&#39;Runoob&#39;, &#39;Taobao&#39;]</td><td>从第二个元素开始截取列表</td></tr><tr><td>L[:]</td><td>[&#39;Google&#39;, &#39;Runoob&#39;, &#39;Taobao&#39;]</td><td>获取完整列表</td></tr></tbody></table><p>元组 tuple 与列表 list 用法类似，但元组不能直接修改元素，只能用切片的方法来修改</p><pre><code class="language-python">temp=(1,&quot;xxxxx&quot;,&quot;迷途&quot;,2)      #元组
temp=temp[:2]+(“y”,)+temp[2:]
del temp #删除元组
</code></pre><h3 id="列表解析" tabindex="-1"><a class="header-anchor" href="#列表解析"><span>列表解析</span></a></h3><pre><code class="language-python">list1 = [x**2 for x in range(10)]  #list1 为 [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
#相当于
list1 = []
for x in range(10):
    list1.append(x**2)

&gt;&gt;&gt; list1 = [(x, y) for x in range(10) for y in range(10) if x%2==0 if y%2!=0]
#相当于
list1 = []
for x in range(10):
    for y in range(10):
        if x%2==0:
            if y%2!=0:
                list1.extend([(x,y)])
print(list1)
</code></pre><h2 id="变量" tabindex="-1"><a class="header-anchor" href="#变量"><span>变量</span></a></h2><p>Python 变量是贴标签，而非存储数据</p><pre><code class="language-python">list1=[1,3,2,9,7,8]
list2=list1[:]
list3=list1
# list2 和 list3 的值此时相同，但一旦对 list1 内部进行调整，比如排序、增减变量
list1.sort()  # list3 会随着 list1 发生变化，list2 不变
</code></pre><p>lambda、filter、map</p><pre><code class="language-python">g=lambda x,y : x+y
g(3,4)
7
list(filter(lambda x:x%2,range(10))) #过滤 0-9 中能整除 2 的数字
list(map(lambda x : x%2, range(10))) #罗列 0-9 每个数字乘 2 的结果
</code></pre>`,42)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};