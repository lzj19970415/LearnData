import{n as e,o as t,r as n}from"./app-CfpVmhNU.js";import{t as r}from"./plugin-vue_export-helper-BDNMzG2s.js";var i=JSON.parse(`{"path":"/linux/Python%E8%BF%90%E7%BB%B4%E8%87%AA%E5%8A%A8%E5%8C%96.html","title":"Python运维自动化入门","lang":"zh-CN","frontmatter":{"title":"Python运维自动化入门","category":"Linux","tags":["Python","运维","自动化"]}}`),a={name:`Python运维自动化.md`};function o(r,i,a,o,s,c){return t(),e(`div`,null,[...i[0]||=[n(`<h1 id="python-运维自动化入门" tabindex="-1"><a class="header-anchor" href="#python-运维自动化入门"><span>Python 运维自动化入门</span></a></h1><p>面向运维方向的 Python 入门笔记，涵盖环境、基本语法、正则、文件操作、数据库与自动化脚本。</p><h2 id="一、环境准备" tabindex="-1"><a class="header-anchor" href="#一、环境准备"><span>一、环境准备</span></a></h2><pre><code class="language-bash"># 检查版本
python3 --version

# 安装 pip
yum install python3-pip
apt install python3-pip

# 安装常用库
pip3 install requests pymysql paramiko
</code></pre><h2 id="二、基本语法" tabindex="-1"><a class="header-anchor" href="#二、基本语法"><span>二、基本语法</span></a></h2><h3 id="_1-变量与数据类型" tabindex="-1"><a class="header-anchor" href="#_1-变量与数据类型"><span>1. 变量与数据类型</span></a></h3><pre><code class="language-python">name = &quot;运维&quot;        # 字符串
num = 100           # 整数
rate = 3.14         # 浮点数
is_ok = True        # 布尔值
list1 = [1, 2, 3]   # 列表
dict1 = {&quot;host&quot;: &quot;10.0.0.1&quot;, &quot;port&quot;: 3306}  # 字典
</code></pre><h3 id="_2-输入输出" tabindex="-1"><a class="header-anchor" href="#_2-输入输出"><span>2. 输入输出</span></a></h3><pre><code class="language-python">name = input(&quot;请输入主机名: &quot;)
print(&quot;主机名是:&quot;, name)
print(f&quot;端口号是: {dict1[&#39;port&#39;]}&quot;)   # f-string 格式化
</code></pre><h3 id="_3-条件判断" tabindex="-1"><a class="header-anchor" href="#_3-条件判断"><span>3. 条件判断</span></a></h3><pre><code class="language-python">load = 0.85
if load &gt; 0.8:
    print(&quot;负载过高，告警！&quot;)
elif load &gt; 0.5:
    print(&quot;负载偏高&quot;)
else:
    print(&quot;负载正常&quot;)
</code></pre><h3 id="_4-循环" tabindex="-1"><a class="header-anchor" href="#_4-循环"><span>4. 循环</span></a></h3><pre><code class="language-python"># for 遍历列表
hosts = [&quot;web1&quot;, &quot;web2&quot;, &quot;web3&quot;]
for h in hosts:
    print(f&quot;检查主机 {h}&quot;)

# while
i = 0
while i &lt; 5:
    print(i)
    i += 1
</code></pre><h2 id="三、函数" tabindex="-1"><a class="header-anchor" href="#三、函数"><span>三、函数</span></a></h2><pre><code class="language-python">def check_cpu(threshold=0.8):
    &quot;&quot;&quot;检查 CPU 负载&quot;&quot;&quot;
    cpu = get_cpu_usage()   # 假设有获取函数
    if cpu &gt; threshold:
        print(f&quot;CPU 超限: {cpu}%&quot;)
        return False
    return True

# 调用
check_cpu(0.9)
</code></pre><h2 id="四、正则表达式-运维常用" tabindex="-1"><a class="header-anchor" href="#四、正则表达式-运维常用"><span>四、正则表达式（运维常用）</span></a></h2><p>正则用于匹配、查找、替换文本，处理日志和配置文件非常高效。</p><pre><code class="language-python">import re

# 匹配 IP 地址
log = &quot;访问来源 192.168.1.100 端口 80&quot;
ip = re.findall(r&quot;\\d+\\.\\d+\\.\\d+\\.\\d+&quot;, log)
print(ip)   # [&#39;192.168.1.100&#39;]

# 匹配邮箱
email = &quot;联系: ops@example.com&quot;
m = re.search(r&#39;[\\w.]+@[\\w.]+&#39;, email)
print(m.group())   # ops@example.com

# 替换
new = re.sub(r&quot;\\d+\\.\\d+\\.\\d+\\.\\d+&quot;, &quot;***.***.***.***&quot;, log)
print(new)
</code></pre><p><strong>常用正则符号：</strong></p><table><thead><tr><th>符号</th><th>含义</th></tr></thead><tbody><tr><td><code>.</code></td><td>匹配任意字符</td></tr><tr><td><code>*</code></td><td>匹配前一个字符 0 次或多次</td></tr><tr><td><code>+</code></td><td>匹配前一个字符 1 次或多次</td></tr><tr><td><code>\\d</code></td><td>匹配数字</td></tr><tr><td><code>\\w</code></td><td>匹配字母数字下划线</td></tr><tr><td><code>^</code> / <code>$</code></td><td>行首 / 行尾</td></tr><tr><td><code>[]</code></td><td>字符集合，如 <code>[0-9]</code></td></tr></tbody></table><h2 id="五、文件操作-服务器信息清洗" tabindex="-1"><a class="header-anchor" href="#五、文件操作-服务器信息清洗"><span>五、文件操作（服务器信息清洗）</span></a></h2><pre><code class="language-python"># 读取文件
with open(&quot;/var/log/nginx/access.log&quot;, &quot;r&quot;) as f:
    lines = f.readlines()

# 统计访问次数最多的 IP
ip_count = {}
for line in lines:
    parts = line.split()
    if parts:
        ip = parts[0]
        ip_count[ip] = ip_count.get(ip, 0) + 1

# 排序输出 Top5
top = sorted(ip_count.items(), key=lambda x: x[1], reverse=True)[:5]
for ip, count in top:
    print(f&quot;{ip}: {count} 次&quot;)
</code></pre><h2 id="六、操作数据库" tabindex="-1"><a class="header-anchor" href="#六、操作数据库"><span>六、操作数据库</span></a></h2><pre><code class="language-python">import pymysql

# 连接 MySQL
conn = pymysql.connect(
    host=&quot;localhost&quot;,
    user=&quot;root&quot;,
    password=&quot;123456&quot;,
    database=&quot;mydb&quot;,
    charset=&quot;utf8mb4&quot;
)
cur = conn.cursor()

# 查询
cur.execute(&quot;SELECT id, name FROM users&quot;)
for row in cur.fetchall():
    print(row)

# 插入
cur.execute(&quot;INSERT INTO users (name) VALUES (%s)&quot;, (&quot;xiaowang&quot;,))
conn.commit()

cur.close()
conn.close()
</code></pre><h2 id="七、运维自动化实战" tabindex="-1"><a class="header-anchor" href="#七、运维自动化实战"><span>七、运维自动化实战</span></a></h2><h3 id="_1-批量-ping-检查主机" tabindex="-1"><a class="header-anchor" href="#_1-批量-ping-检查主机"><span>1. 批量 ping 检查主机</span></a></h3><pre><code class="language-python">import subprocess

hosts = [&quot;192.168.1.1&quot;, &quot;192.168.1.2&quot;, &quot;192.168.1.3&quot;]
for ip in hosts:
    result = subprocess.run(
        [&quot;ping&quot;, &quot;-c&quot;, &quot;1&quot;, &quot;-W&quot;, &quot;1&quot;, ip],
        capture_output=True
    )
    status = &quot;在线&quot; if result.returncode == 0 else &quot;离线&quot;
    print(f&quot;{ip}: {status}&quot;)
</code></pre><h3 id="_2-远程执行命令-ssh" tabindex="-1"><a class="header-anchor" href="#_2-远程执行命令-ssh"><span>2. 远程执行命令（SSH）</span></a></h3><pre><code class="language-python">import paramiko

def ssh_cmd(host, user, cmd, password=&quot;&quot;):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=5)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode()

# 示例
print(ssh_cmd(&quot;192.168.1.10&quot;, &quot;root&quot;, &quot;uptime&quot;))
</code></pre><blockquote><p>生产环境 SSH 密码不应硬编码在脚本中，建议使用密钥认证或配置管理工具（如 Ansible）。</p></blockquote><h3 id="_3-巡检脚本-记录到文件" tabindex="-1"><a class="header-anchor" href="#_3-巡检脚本-记录到文件"><span>3. 巡检脚本（记录到文件）</span></a></h3><pre><code class="language-python">import datetime
import subprocess

now = datetime.datetime.now().strftime(&quot;%Y-%m-%d %H:%M:%S&quot;)
report = f&quot;==== 巡检报告 {now} ====\\n&quot;

# 磁盘
df = subprocess.run([&quot;df&quot;, &quot;-h&quot;], capture_output=True, text=True)
report += df.stdout + &quot;\\n&quot;

# 写入
with open(&quot;/tmp/report.txt&quot;, &quot;w&quot;) as f:
    f.write(report)
print(&quot;报告已生成 /tmp/report.txt&quot;)
</code></pre><h2 id="小结" tabindex="-1"><a class="header-anchor" href="#小结"><span>小结</span></a></h2><p>Python 让运维从&quot;手动敲命令&quot;升级为&quot;写脚本自动化&quot;。重点掌握：<strong>基本语法、正则（提取信息）、文件操作、数据库、paramiko/requests</strong>。结合你已有的 Shell 基础，两者配合能覆盖绝大多数运维自动化场景。</p><blockquote><p>AI生成</p></blockquote>`,35)]])}var s=r(a,[[`render`,o]]);export{i as _pageData,s as default};