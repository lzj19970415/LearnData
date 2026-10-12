import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/linux/Shell%E8%84%9A%E6%9C%AC%E7%BC%96%E7%A8%8B.html","title":"Shell脚本编程从入门到实战","lang":"zh-CN","frontmatter":{"title":"Shell脚本编程从入门到实战","category":"Linux","tags":["Shell","Linux","脚本编程"]}}`),a={name:`Shell脚本编程.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<blockquote><p>面向运维的 Shell 编程完整笔记，涵盖基础语法、变量、条件判断、循环、函数、调试及实战场景。</p></blockquote><h2 id="一、shell-是什么" tabindex="-1"><a class="header-anchor" href="#一、shell-是什么"><span>一、Shell 是什么</span></a></h2><p>Shell 是一个<strong>命令解释器</strong>，位于操作系统外层，负责解释执行用户输入的命令，并把结果返回给用户。用户每输入一条命令，Shell 就解释执行一条，这种交互方式称为<strong>交互式</strong>。把一系列命令写进一个文件批量执行，就是 <strong>Shell 脚本</strong>。</p><p><strong>常见 Shell：</strong></p><ul><li><code>bash</code>（Bourne Again Shell）：Linux 默认，功能最强，本教程以 bash 为准</li><li><code>sh</code>：最基础的 Bourne Shell，脚本兼容性最好</li><li><code>csh</code> / <code>zsh</code> / <code>ksh</code> 等</li></ul><p><strong>第一个脚本：</strong></p><pre><code class="language-bash">#!/bin/bash
echo &quot;Hello World&quot;
</code></pre><ul><li><code>#!/bin/bash</code> 是&quot;解释器声明&quot;，告诉系统用 bash 执行</li><li>保存为 <code>hello.sh</code> 后，执行 <code>chmod +x hello.sh</code> 赋予执行权限，然后 <code>./hello.sh</code> 运行</li><li>也可直接 <code>bash hello.sh</code> 运行，无需执行权限</li></ul><h2 id="二、变量" tabindex="-1"><a class="header-anchor" href="#二、变量"><span>二、变量</span></a></h2><h3 id="_1-变量定义与引用" tabindex="-1"><a class="header-anchor" href="#_1-变量定义与引用"><span>1. 变量定义与引用</span></a></h3><pre><code class="language-bash">name=&quot;运维小张&quot;        # 变量名=值，等号两边不能有空格
num=10
echo $name            # 引用变量，前面加 $ 
echo \${num}           # 推荐用 {} 包裹，避免歧义
</code></pre><p><strong>规则：</strong> 变量名只能由字母、数字、下划线组成，不能以数字开头。</p><h3 id="_2-变量类型" tabindex="-1"><a class="header-anchor" href="#_2-变量类型"><span>2. 变量类型</span></a></h3><table><thead><tr><th>类型</th><th>说明</th><th>示例</th></tr></thead><tbody><tr><td>普通变量</td><td>当前脚本内有效</td><td><code>name=&quot;xxx&quot;</code></td></tr><tr><td>环境变量</td><td>全局有效，可被子进程继承</td><td><code>export PATH=/usr/bin</code></td></tr><tr><td>位置变量</td><td>脚本运行时传入的参数</td><td><code>$1</code> <code>$2</code> ... <code>$9</code></td></tr><tr><td>特殊变量</td><td>脚本自身的状态信息</td><td><code>$0</code> <code>$#</code> <code>$?</code> 等</td></tr></tbody></table><p><strong>常用特殊变量：</strong></p><pre><code class="language-bash">$0     # 脚本文件名
$1-$9  # 第1到第9个位置参数
$#     # 位置参数的个数
$*     # 所有参数（当成一个整体）
$@     # 所有参数（分别看待）
$?     # 上一条命令的返回值（0=成功，非0=失败）
$$     # 当前脚本的进程号 PID
</code></pre><p><strong>示例：</strong></p><pre><code class="language-bash">#!/bin/bash
echo &quot;脚本名: $0&quot;
echo &quot;参数个数: $#&quot;
echo &quot;第一个参数: $1&quot;
echo &quot;退出码: $?&quot;
</code></pre><h3 id="_3-算术运算" tabindex="-1"><a class="header-anchor" href="#_3-算术运算"><span>3. 算术运算</span></a></h3><pre><code class="language-bash">a=10
b=20
echo $((a + b))        # 30，推荐用 $(( ))
echo $((a * b))        # 200
let c=a+b              # let 命令也行
</code></pre><h2 id="三、条件测试与判断" tabindex="-1"><a class="header-anchor" href="#三、条件测试与判断"><span>三、条件测试与判断</span></a></h2><h3 id="_1-条件测试语法" tabindex="-1"><a class="header-anchor" href="#_1-条件测试语法"><span>1. 条件测试语法</span></a></h3><pre><code class="language-bash">test 表达式
[ 表达式 ]          # 注意：[] 两边必须有空格
[[ 表达式 ]]        # 增强版，支持正则，推荐
</code></pre><h3 id="_2-文件判断" tabindex="-1"><a class="header-anchor" href="#_2-文件判断"><span>2. 文件判断</span></a></h3><pre><code class="language-bash">[ -f 文件 ]   # 是否为普通文件
[ -d 目录 ]   # 是否为目录
[ -e 路径 ]   # 是否存在
[ -x 文件 ]   # 是否可执行
[ -r 文件 ]   # 是否可读
[ -w 文件 ]   # 是否可写
[ -s 文件 ]   # 是否非空
</code></pre><h3 id="_3-数值比较" tabindex="-1"><a class="header-anchor" href="#_3-数值比较"><span>3. 数值比较</span></a></h3><pre><code class="language-bash">[ $a -eq $b ]   # 等于
[ $a -ne $b ]   # 不等于
[ $a -gt $b ]   # 大于
[ $a -ge $b ]   # 大于等于
[ $a -lt $b ]   # 小于
[ $a -le $b ]   # 小于等于
</code></pre><h3 id="_4-字符串判断" tabindex="-1"><a class="header-anchor" href="#_4-字符串判断"><span>4. 字符串判断</span></a></h3><pre><code class="language-bash">[ &quot;$s1&quot; = &quot;$s2&quot; ]      # 相等
[ &quot;$s1&quot; != &quot;$s2&quot; ]     # 不相等
[ -z &quot;$s&quot; ]            # 字符串为空
[ -n &quot;$s&quot; ]            # 字符串非空
</code></pre><h3 id="_5-逻辑运算" tabindex="-1"><a class="header-anchor" href="#_5-逻辑运算"><span>5. 逻辑运算</span></a></h3><pre><code class="language-bash">[ 条件1 -a 条件2 ]    # 与 and
[ 条件1 -o 条件2 ]    # 或 or
[ ! 条件 ]            # 非 not
# [[ ]] 中可用 &amp;&amp; || !
</code></pre><h2 id="五、流程控制" tabindex="-1"><a class="header-anchor" href="#五、流程控制"><span>五、流程控制</span></a></h2><h3 id="_1-if-判断" tabindex="-1"><a class="header-anchor" href="#_1-if-判断"><span>1. if 判断</span></a></h3><pre><code class="language-bash">#!/bin/bash
num=15
if [ $num -gt 10 ]; then
    echo &quot;数字大于10&quot;
elif [ $num -eq 10 ]; then
    echo &quot;数字等于10&quot;
else
    echo &quot;数字小于10&quot;
fi
</code></pre><h3 id="_2-case-多分支" tabindex="-1"><a class="header-anchor" href="#_2-case-多分支"><span>2. case 多分支</span></a></h3><pre><code class="language-bash">#!/bin/bash
case &quot;$1&quot; in
  start)
    echo &quot;启动服务&quot;
    ;;
  stop)
    echo &quot;停止服务&quot;
    ;;
  restart)
    echo &quot;重启服务&quot;
    ;;
  *)
    echo &quot;用法: $0 {start|stop|restart}&quot;
    ;;
esac
</code></pre><h2 id="七、循环" tabindex="-1"><a class="header-anchor" href="#七、循环"><span>七、循环</span></a></h2><h3 id="_1-for-循环" tabindex="-1"><a class="header-anchor" href="#_1-for-循环"><span>1. for 循环</span></a></h3><pre><code class="language-bash"># 遍历数字
for i in 1 2 3 4 5; do
    echo &quot;数字: $i&quot;
done

# 遍历文件
for f in /etc/*.conf; do
    echo &quot;配置文件: $f&quot;
done

# C 风格
for ((i=1; i&lt;=10; i++)); do
    echo $i
done
</code></pre><h3 id="_2-while-循环" tabindex="-1"><a class="header-anchor" href="#_2-while-循环"><span>2. while 循环</span></a></h3><pre><code class="language-bash">i=1
while [ $i -le 5 ]; do
    echo &quot;第 $i 次&quot;
    i=$((i + 1))
done
</code></pre><h3 id="_3-break-与-continue" tabindex="-1"><a class="header-anchor" href="#_3-break-与-continue"><span>3. break 与 continue</span></a></h3><pre><code class="language-bash">break      # 跳出整个循环
continue   # 跳过本次，继续下一次
</code></pre><h2 id="八、函数" tabindex="-1"><a class="header-anchor" href="#八、函数"><span>八、函数</span></a></h2><pre><code class="language-bash">#!/bin/bash
# 定义函数
function log_info() {
    echo &quot;[INFO] $1&quot;
}

log_warn() {
    echo &quot;[WARN] $1&quot;
}

# 调用
log_info &quot;系统启动正常&quot;
log_warn &quot;磁盘空间不足&quot;
</code></pre><p><strong>函数要点：</strong></p><ul><li>函数要先定义后调用</li><li>用 <code>$1</code> <code>$2</code> 接收参数</li><li>用 <code>return</code> 返回状态码，用 <code>echo</code> 返回输出值</li><li><code>local</code> 声明局部变量，避免污染全局</li></ul><h2 id="九、运维实战脚本示例" tabindex="-1"><a class="header-anchor" href="#九、运维实战脚本示例"><span>九、运维实战脚本示例</span></a></h2><h3 id="_1-一键检查系统状态" tabindex="-1"><a class="header-anchor" href="#_1-一键检查系统状态"><span>1. 一键检查系统状态</span></a></h3><pre><code class="language-bash">#!/bin/bash
echo &quot;=== 系统信息 ===&quot;
uname -a
echo &quot;=== 磁盘使用 ===&quot;
df -h | grep -v tmpfs
echo &quot;=== 内存使用 ===&quot;
free -h
echo &quot;=== 负载 ===&quot;
uptime
</code></pre><h3 id="_2-检查端口是否在监听" tabindex="-1"><a class="header-anchor" href="#_2-检查端口是否在监听"><span>2. 检查端口是否在监听</span></a></h3><pre><code class="language-bash">#!/bin/bash
PORT=3306
if ss -tlnp | grep -q &quot;:$PORT &quot;; then
    echo &quot;端口 $PORT 正在监听&quot;
else
    echo &quot;警告：端口 $PORT 未监听！&quot;
fi
</code></pre><h3 id="_3-批量-ping-主机" tabindex="-1"><a class="header-anchor" href="#_3-批量-ping-主机"><span>3. 批量 ping 主机</span></a></h3><pre><code class="language-bash">#!/bin/bash
for ip in 192.168.1.1 192.168.1.2 192.168.1.3; do
    if ping -c 1 -W 1 $ip &gt;/dev/null 2&gt;&amp;1; then
        echo &quot;$ip 在线&quot;
    else
        echo &quot;$ip 离线&quot;
    fi
done
</code></pre><h3 id="_4-自动备份脚本" tabindex="-1"><a class="header-anchor" href="#_4-自动备份脚本"><span>4. 自动备份脚本</span></a></h3><pre><code class="language-bash">#!/bin/bash
# 备份 MySQL 数据库
DB_USER=&quot;root&quot;
DB_PASS=&quot;password&quot;
DB_NAME=&quot;mydb&quot;
BACKUP_DIR=&quot;/backup/mysql&quot;
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME &gt; $BACKUP_DIR/\${DB_NAME}_\${DATE}.sql
if [ $? -eq 0 ]; then
    echo &quot;备份成功: $BACKUP_DIR/\${DB_NAME}_\${DATE}.sql&quot;
else
    echo &quot;备份失败！&quot;
    exit 1
fi
</code></pre><h3 id="_5-定时巡检日志关键字" tabindex="-1"><a class="header-anchor" href="#_5-定时巡检日志关键字"><span>5. 定时巡检日志关键字</span></a></h3><pre><code class="language-bash">#!/bin/bash
# 检查错误日志
LOG=&quot;/var/log/nginx/error.log&quot;
if [ -f &quot;$LOG&quot; ]; then
    count=$(grep -c &quot;ERROR\\|FATAL&quot; $LOG)
    echo &quot;错误日志数量: $count&quot;
    if [ $count -gt 50 ]; then
        echo &quot;告警：错误日志过多！&quot;
    fi
fi
</code></pre><h2 id="十、脚本调试技巧" tabindex="-1"><a class="header-anchor" href="#十、脚本调试技巧"><span>十、脚本调试技巧</span></a></h2><pre><code class="language-bash">bash -x script.sh      # 逐条显示执行过程（最常用）
bash -n script.sh      # 只检查语法，不执行
</code></pre><ul><li><code>-x</code> 能看到每一行命令的实际执行，排错神器</li><li>脚本开头加 <code>set -e</code>，遇到错误立即退出</li><li>变量加引号 <code>&quot;$var&quot;</code> 防止空格导致的问题</li></ul><h2 id="小结" tabindex="-1"><a class="header-anchor" href="#小结"><span>小结</span></a></h2><p>Shell 是运维的核心技能。掌握变量、条件判断、循环、函数这四大块，加上管道和重定向，就能把日常重复的命令变成可复用的脚本。多看、多写、多用 <code>-x</code> 调试，进步最快。</p><blockquote><p>AI生成</p></blockquote>`,64)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};