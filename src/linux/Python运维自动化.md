---
title: Python运维自动化入门
category: Linux进阶
tags:
  - Python
  - 运维
  - 自动化
---

# Python 运维自动化：零基础跟着做出 6 个能干活的脚本

> **这篇实验做完，你会得到什么？一句人话：能自己写脚本替你干活。** 具体说，是 6 个真能干活的脚本——机器摸底、自动巡检、日志大扫除、网址拨测、定时任务、值班告警。从此不用每天手动敲命令盯服务器：写一次脚本，让它自己跑、自己报结果。每个实验都说清四件事：**干什么用、在哪做、怎么做、怎么验证做对了**。跟着做，做完就是你的。

---

## 实验环境准备

> 目标：让 CentOS 7 虚拟机上的 Python 3 和两个工具库就位，最后终端能打印"环境 OK"才算过关。建议直接用 root 登录最省事；用普通用户的话，把后文所有 `/root/pyops` 换成 `~/pyops` 即可。

### 1. 检查 Python 3

CentOS 7 一般自带 python3（3.6 版本，本篇所有代码都按它写），先检查：

```bash
python3 --version
```

预期输出（3.6.x 都正常）：

```
Python 3.6.8
```

提示 `command not found: python3` 就先装一条命令：

```bash
yum install -y python3 python3-pip
```

❗【易错】CentOS 7 里老命令 `python` 是 Python 2.7，和 Python 3 语法不通用。**本篇所有命令一律敲 `python3`**，别只敲 `python`。

### 2. 装两个工具库

- `psutil`：读 CPU、内存、磁盘使用率（实验二用）
- `requests`：访问网址、测状态码（实验四用）

```bash
pip3 install psutil requests
```

网慢就换清华镜像源：

```bash
pip3 install psutil requests -i https://pypi.tuna.tsinghua.edu.cn/simple
```

预期输出应包含关键字 `Successfully installed`。

### 3. 背三招 vim（实验五绕不开）

本篇脚本都用 `cat` 命令整段写入（对新手最友好），但实验五的 `crontab -e` 必须进 vim 界面，现在先把**vim 三招**背下来：

```text
打开文件 :  vim 文件名
开始编辑 :  按一下 i 键（左下角出现 INSERT）
保存退出 :  按 Esc，输入 :wq 回车（放弃修改强制退出用 :q!）
```

### 4. 建工作目录 + 就绪自检

```bash
mkdir -p /root/pyops
python3 -c "import psutil, requests; print('环境 OK')"
```

预期输出：`环境 OK`。看到这两个字，环境就绪，开做实验。

---

## 实验一：第一个脚本——让 Python 报出这台机器的底细

### 🎯 目标

干成什么事：跑一下脚本，屏幕打印出这台机器的操作系统、内核、主机名、CPU 核数、当前用户。**新接手一台服务器，第一件事就是摸底**——这份输出还能直接贴进交接文档。这也是你人生第一个跑起来的 Python 脚本，先尝到"代码动起来了"的甜头。

为什么运维要它：手动敲 `uname -a`、`hostname`、`whoami` 一堆命令，敲完还得自己整理格式；脚本一次输出、格式统一，机器换多少台都不用变。

### 📍 在哪动手

在虚拟机 `/root/pyops/` 目录下新建脚本 `sysinfo.py`，用 `cat` 写入。cat 写文件三步（后面每个实验都是这套路）：敲 `cat > 文件路径` 回车 → 粘贴内容 → 最后单独一行顶格写 `PYEOF` 回车存盘。

### 🔧 动手做

把整块（从 `cat` 那行到 `PYEOF`）一次性复制、粘贴到终端、回车：

```bash
cat > /root/pyops/sysinfo.py <<'PYEOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第一个脚本：打印这台机器的基本信息"""

import platform   # 自带库：识别系统信息
import os         # 自带库：跟操作系统打交道的工具箱
import getpass    # 自带库：查"我现在是哪个用户"

# 变量 = 贴了标签的盒子：把结果存起来，后面随时用
user = getpass.getuser()    # 把当前用户名存进名叫 user 的盒子
host = platform.node()      # 把主机名存进名叫 host 的盒子

print("=== 系统摸底报告 ===")            # print：把括号里的内容打印到屏幕
print("操作系统 :", platform.system())   # 返回 Linux
print("内核版本 :", platform.release())  # 内核版本号
print(f"主机名   : {host}")              # f 开头的字符串：{} 里的变量会被换成真值
print("架构     :", platform.machine())  # x86_64
print(f"Python   : {platform.python_version()}")
print(f"CPU 核数 : {os.cpu_count()}")     # 逻辑核数
print(f"当前用户 : {user}")
PYEOF
python3 /root/pyops/sysinfo.py
```

### ✅ 怎么算成功

预期输出（数字、主机名因机器而异，关键是 8 行信息都在）：

```
=== 系统摸底报告 ===
操作系统 : Linux
内核版本 : 3.10.0-1160.el7.x86_64
主机名   : localhost.localdomain
架构     : x86_64
Python   : 3.6.8
CPU 核数 : 2
当前用户 : root
```

再练第二种运行方式——让它像 `ls` 一样**当命令直接执行**：先加执行权限再跑：

```bash
chmod +x /root/pyops/sysinfo.py
/root/pyops/sysinfo.py
```

输出和刚才完全一样，就成功了。⚠️【必考】能这么跑，靠的是脚本**第一行**的 `#!/usr/bin/env python3`，这行叫 **shebang**（井号叹号开头），意思是"请用 python3 来运行我"；`chmod +x` 是给文件加执行权限。口诀：**首行井叹定身份，chmod 加踢才放行**（"加踢" = `+x`）。

### 🩹 如果不对

1. **`python3: command not found`** —— 没装 Python 3，回环境准备第 1 步装上。
2. **`SyntaxError: Non-UTF-8 code starting ...`** —— 编码不对：多半是脚本在 Windows 记事本里写好再传上来，记事本默认 GBK。解决：以后直接在 Linux 里用本篇的 `cat` 方式写；或 Windows 上改用 VS Code，右下角把编码切到 UTF-8。
3. **`IndentationError: unexpected indent`** —— 缩进错误。Python 靠行首空格识别层级，**同一层必须对齐、统一 4 个空格**；报错信息里的行号和 `^` 指着哪行，删掉那行多出来的空格即可。口诀：**缩进四格定生死，多一少一都不行**。
4. **`./sysinfo.py: Permission denied`** —— 忘了 `chmod +x`，或第一行 shebang 被误删，补上再跑。

---

## 实验二：服务器巡检——CPU/内存/磁盘一次看完，谁超标谁挨点名

### 🎯 目标

干成什么事：跑一下脚本，自动报出 CPU、内存、每块磁盘的使用率；任何一项超过 80%，就在那行后面打告警标记。你会亲眼看到一行"磁盘 92% 已超阈值"式的现场输出（实验里故意调低阈值复现它）。

为什么运维要它：磁盘哪天半夜被日志塞满、服务全挂，你就知道这事多疼。每天手动敲 `top`、`free`、`df -h` 三连太蠢——让脚本替你盯，超了才提醒。

### 📍 在哪动手

还在 `/root/pyops/`，新建 `xunjian.py`（巡检的拼音），仍用 `cat` 方式写入。

### 🔧 动手做

整块复制粘贴执行：

```bash
cat > /root/pyops/xunjian.py <<'PYEOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""服务器巡检：CPU/内存/磁盘使用率，超过阈值就点名"""

import psutil   # 读系统指标的专业库，pip3 装的就是它

# ---------- 配置区：想改告警线，只改这三个数字 ----------
CPU_LIMIT = 80     # CPU 告警线（百分比）
MEM_LIMIT = 80     # 内存告警线（百分比）
DISK_LIMIT = 80    # 磁盘告警线（百分比）

# interval=1 表示现场采样 1 秒再给结果（不写就测不准，一直是 0.0）
cpu = psutil.cpu_percent(interval=1)
mem = psutil.virtual_memory().percent   # 内存使用率，一个属性就拿到

print(f"CPU  使用率: {cpu}%")
print(f"内存 使用率: {mem}%")
print("-" * 30)   # 打印 30 个横线当分隔线

# 磁盘可能不止一块，用 for 循环挨块检查
# disk_partitions() 返回一个"分区列表"，循环 = 让脚本自己挨个来
for part in psutil.disk_partitions():
    try:
        usage = psutil.disk_usage(part.mountpoint)   # 这个挂载点的用量
    except OSError:
        continue    # 个别特殊分区读不到就跳过，别让整个脚本崩掉

    percent = usage.percent
    mark = ""                    # 先准备一个空标记
    if percent > DISK_LIMIT:     # if 条件判断：成立才走缩进的下一行
        mark = "  <<< 已超阈值，注意！"
    # {:12} 让这块至少占 12 格宽，输出才上下对齐
    print(f"磁盘 {part.mountpoint:12} 已用 {percent}%{mark}")
PYEOF
python3 /root/pyops/xunjian.py
```

三个语法点顺带记住：**变量**装结果、随用随取；**for 变量 in 列表**把列表里的东西挨个取出来干活；**try/except** = "试试这段，出事别崩，按 except 说的办"，运维脚本保命写法。

### ✅ 怎么算成功

预期输出（数字每台机器不同，看格式和标记）：

```
CPU  使用率: 0.8%
内存 使用率: 22.4%
------------------------------
磁盘 /            已用 15.2%
磁盘 /boot        已用 19.5%
```

然后**复现告警**：用 vim 把 `DISK_LIMIT = 80` 改成 `DISK_LIMIT = 5`（vim 三招实战），再跑一次：

```
磁盘 /            已用 15.2%  <<< 已超阈值，注意！
```

看到告警标记就成功。顺手敲 `df -h` 对一下：`/` 那行的 Use% 和脚本报的百分比基本一致，说明脚本测的是真的。看完把阈值改回 80。

### 🩹 如果不对

1. **`ModuleNotFoundError: No module named 'psutil'`** —— 库没装或装进了别的 Python。回环境准备 `pip3 install psutil`；确认用的是 `pip3` 不是老的 `pip`。
2. **CPU 永远是 0.0** —— 忘写 `interval=1`，没采样时间测不出来。
3. **`IndentationError`** —— 实验一的缩进铁律：同层对齐、4 空格。
4. **磁盘一块都没打出来** —— 普通用户读不到挂载信息，用 root 重试。

---

## 实验三：日志大扫除——揪出谁吃掉了磁盘，过期日志先预览再删

### 🎯 目标

干成什么事：一键找出 `/var/log` 里**最大的 10 个文件**（谁把磁盘吃掉了，一眼看清），再筛出**超过 30 天没动过的过期日志**。删除分两步走：第一遍只打印"我打算删这些"，你核对名单后把开关改成"真删"才动手。

为什么运维要它：磁盘 90% 告警响的时候，登上去第一件事就是找大户；手动挨个目录 `du` 排序敲半天，脚本一秒出名单。而"先预览后动手"是删除类脚本的保命铁律——口诀：**先打印，再动手；名单没看清，删除两行泪**。

### 📍 在哪动手

`/root/pyops/` 下新建 `logtool.py`，**用 root 跑**（普通用户读不了 `/var/log` 里大部分文件）。

### 🔧 动手做

整块复制粘贴执行：

```bash
cat > /root/pyops/logtool.py <<'PYEOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""日志大扫除：最大的10个文件 + 过期日志（先预览，后动手）"""

import os       # walk 遍历目录树、getsize 查大小、remove 删文件
import time     # 时间换算

LOG_DIR = "/var/log"     # 要检查的目录
MAX_AGE_DAYS = 30        # 超过多少天没改过算"过期"
DRY_RUN = True          # True=只预览不删；核对后才改 False 真删

now = time.time()        # 当前时间戳：从1970年到现在过了多少秒

# ---------- 第一步：钻进每个子目录，把所有文件登记造册 ----------
files = []               # 空列表，等会儿往里装"文件档案"
# os.walk 像扫地一样一层层钻进目录，一次交回三样东西：
# root=当前目录路径  dirs=里面的子目录名  names=里面的文件名
for root, dirs, names in os.walk(LOG_DIR):
    for name in names:
        path = os.path.join(root, name)     # 拼完整路径，如 /var/log/messages
        try:
            size = os.path.getsize(path)    # 文件大小（字节）
            mtime = os.path.getmtime(path)  # 最后修改时间（时间戳）
        except OSError:
            continue    # 读不到的（权限/已消失）跳过
        # 元组 (a,b,c) = 把三样东西打包成一份档案，装进列表
        files.append((path, size, mtime))

# ---------- 第二步：最大的 10 个文件 ----------
# sorted 排序：key=lambda f: f[1] = 按档案第2项(大小)排；reverse=True 从大到小
# 切片 [:10] = 排完只取前 10 个
top10 = sorted(files, key=lambda f: f[1], reverse=True)[:10]
print(f"=== {LOG_DIR} 里最大的 10 个文件 ===")
for path, size, _ in top10:    # _ 是占位，表示"这格我用不上"
    # size/1024/1024 字节换算成 MB；:10.1f = 占10格宽、保留1位小数
    print(f"{size/1024/1024:10.1f} MB  {path}")

# ---------- 第三步：筛过期文件，生成"待删名单" ----------
old_files = []
for path, size, mtime in files:
    age_days = (now - mtime) / 86400    # 86400 = 一天的秒数
    if age_days > MAX_AGE_DAYS:
        old_files.append(path)

print(f"\n=== {MAX_AGE_DAYS} 天没动过的过期文件（共 {len(old_files)} 个）===")
for p in old_files:
    print("待删:", p)

# ---------- 第四步：DRY_RUN 开关决定动不动手 ----------
if DRY_RUN:
    print("\n[预览模式] 以上只是名单，一个都没删。")
    print("核对无误后：把脚本里的 DRY_RUN 改成 False，再跑一次才真删。")
else:
    for p in old_files:
        try:
            os.remove(p)    # 真删除，效果等同 rm 掉这个文件
            print("已删除:", p)
        except OSError as e:
            print(f"删不动 {p}: {e}")
PYEOF
python3 /root/pyops/logtool.py
```

顺带认个亲戚：只想按后缀找文件（比如所有 `.log`）时，还有个更省事的 `glob` 库——`glob.glob("/var/log/*.log")` 一行就拿到这一层所有 `.log` 的路径。**要钻进所有子目录用 os.walk，只挑一层、按后缀用 glob**，两把刀换着使。

### ✅ 怎么算成功

预期输出（文件名因机器而异，重点看格式 + 末尾预览提示）：

```
=== /var/log 里最大的 10 个文件 ===
      12.4 MB  /var/log/messages
       2.1 MB  /var/log/dnf.rpm.log
       1.8 MB  /var/log/audit/audit.log
       ...

=== 30 天没动过的过期文件（共 5 个）===
待删: /var/log/anaconda/packaging.log
...

[预览模式] 以上只是名单，一个都没删。
核对无误后：把脚本里的 DRY_RUN 改成 False，再跑一次才真删。
```

刚装好的虚拟机，`/var/log/anaconda/` 里那批安装日志基本都超 30 天——名单里有它们，说明时间筛选是对的。**此时先停手别删**：预览模式跑通即本实验达标，真删操作等哪天磁盘告警了再回来用。

### 🩹 如果不对

1. **`PermissionError: [Errno 13]`** —— 普通用户读不了部分文件。`su -` 切 root 再跑（脚本里的 try 已兜底跳过读不到的，不影响大局）。
2. **名单是空的（共 0 个）** —— `LOG_DIR` 路径打错了，或机器是 30 天内新装的、还没有过期文件。
3. **删了文件 `df -h` 空间没释放？** —— 那个日志正被 rsyslog 之类进程写着，删掉的只是"名字"，数据还被进程攥着。❗【易错】运维正解：**正在写的日志别删**，用 `> 文件路径` 清空（如 `> /var/log/messages`），或交给 logrotate 轮转。
4. **真删模式报删不动** —— 有进程占用或权限问题，看 `OSError` 后面的具体原因。

---

## 实验四：网址拨测——这批服务还活着吗？多快？

### 🎯 目标

干成什么事：给脚本一份网址清单，它挨个访问，报出每个的 **HTTP 状态码**（200=正常）和**耗时（毫秒）**；超时的、连不上的、返回 404 的，都如实点名。

为什么运维要它：业务方一句"网站打不开"，你第一反应是自己拨测定位——全挂还是个别挂？服务死了还是网络不通？这个动作运维行话叫**拨测**，是排障第一步。人工开浏览器刷一次只能测一个，脚本一次测一批。

### 📍 在哪动手

`/root/pyops/` 下新建 `probe.py`。

### 🔧 动手做

整块复制粘贴执行：

```bash
cat > /root/pyops/probe.py <<'PYEOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""网址拨测：挨个访问，报状态码和耗时"""

import time       # 掐表用
import requests   # HTTP 客户端库，pip3 装的就是它

# 网址清单：以后要监控更多地址，往这个列表里加就行
# 前两个正常；第三个故意 404；第四个故意是坏域名——用来演示异常
URLS = [
    "https://www.baidu.com",
    "https://www.qq.com",
    "https://www.baidu.com/not-exist-page",
    "http://nosuchdomain-abc123.com",
]

for url in URLS:                  # for 循环：让脚本自己挨个测
    try:
        t0 = time.time()          # 掐表第一步：记下起点
        # timeout=5 表示 5 秒没响应就放弃；不写它，脚本会傻等一辈子
        r = requests.get(url, timeout=5)
        ms = (time.time() - t0) * 1000   # 现在减起点=耗时，换算成毫秒
        # {:40} 让网址至少占 40 格，输出才对得齐
        print(f"{url:40} 状态码 {r.status_code}  耗时 {ms:.0f} ms")
    except requests.exceptions.Timeout:
        print(f"{url:40} 超时（5 秒无响应）")
    except requests.exceptions.ConnectionError:
        print(f"{url:40} 连不上（域名解析失败或网络不通）")
PYEOF
python3 /root/pyops/probe.py
```

语法点：**列表** `URLS = [a, b, c]` 把要测的地址集中管理，加监控点只改这一处；`t0` 记起点、干完活 `time.time() - t0` 算耗时，这是掐表套路；**多个 except** = 不同故障不同报法，拨测脚本的核心。

### ✅ 怎么算成功

预期输出（耗时因网络而异，关键字：前两个 200、第三个 404、第四个连不上）：

```
https://www.baidu.com                    状态码 200  耗时 45 ms
https://www.qq.com                       状态码 200  耗时 61 ms
https://www.baidu.com/not-exist-page     状态码 404  耗时 42 ms
http://nosuchdomain-abc123.com           连不上（域名解析失败或网络不通）
```

（第三个若显示的不是 404，是百度把这个地址改成跳转了——换一个确定不存在的路径即可，重点是看"有 200 也有非 200"的对比。）

⚠️【必考】看懂状态码：`200` 正常；`404` 页面不存在（服务活着，但地址错了）；`5xx` 服务端出事（服务半死或崩了）；连不上 = 网络层就不通。**同一个"打不开"，这几种原因的处理方向完全不同**——这就是拨测的价值。

### 🩹 如果不对

1. **前两个也"连不上"** —— 虚拟机没外网。先测 `ping -c 2 223.5.5.5`，不通就检查虚拟机网卡（NAT 模式）和宿主机网络，通了再做本实验。
2. **`ModuleNotFoundError: No module named 'requests'`** —— 环境准备没装，`pip3 install requests` 补上。
3. **`NameError: name 'requests' is not defined`** —— 开头 `import requests` 漏贴了。
4. **pip 装 requests 失败** —— pip 太老，先 `python3 -m pip install --upgrade pip` 再装。

---

## 实验五：不用你动手——crontab 让脚本每天自己跑

### 🎯 目标

干成什么事：给实验二的巡检脚本排个班——先按**每分钟一次**自动执行（为了当场验收），结果**追加**写进日志文件；跑通后改成正式班表**每天早上 8 点**。第二天你只看日志，就知道服务器昨晚状态。这是"自动化"的点睛之笔：脚本再好，也得有人记得跑；定时任务 = 雇了个不要工资的值班员。

为什么运维要它：真正的巡检不是"想起来才跑一次"，是机器天天自己跑、你只看结果。学会这节，前面所有脚本才算真正"自动"。

### 📍 在哪动手

分三处：先给 `/root/pyops/xunjian.py` 补时间戳（vim 实战）；定时任务用 `crontab -e` 编辑（配置实际存在 `/var/spool/cron/root`，但**永远用 crontab -e 改，不要直接动那个文件**）；巡检结果写到 `/root/pyops/xunjian.log`。

### 🔧 动手做

**第一步：给巡检脚本补时间戳。** 没时间戳，日志里一堆数字分不清哪天记的。敲 `vim /root/pyops/xunjian.py`，方向键把光标移到 `import psutil` 那行，按 `i` 进编辑，在它下面加 4 行：

```python
import datetime    # 日期时间库，Python 自带

now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # 当前时间转成好读格式
print(f"===== 巡检时间 {now} =====")
```

（加完按 Esc、`:wq` 保存。）先手动跑一次确认没改坏，输出第一行应出现"===== 巡检时间"加你的当前时间。

**第二步：配定时任务。** 敲 `crontab -e`（vi 界面，vim 三招），按 `i` 粘贴这一行：

```bash
* * * * * /usr/bin/python3 /root/pyops/xunjian.py >> /root/pyops/xunjian.log 2>&1
```

Esc、`:wq` 保存。三个硬知识逐个拆：

⚠️【必考】**五颗星含义**——从左到右依次是：**分 时 日 月 周**（周 0 或 7 都指星期日）。

| 位置 | 含义 | 取值范围 | 例子 |
|---|---|---|---|
| 第1颗 | 分 | 0-59 | `0` 表示整点 |
| 第2颗 | 时 | 0-23 | `8` 表示早8点 |
| 第3颗 | 日 | 1-31 | `*` 表示每天 |
| 第4颗 | 月 | 1-12 | `*` 表示每月 |
| 第5颗 | 周 | 0-7 | `*` 表示不限星期几 |

上面写的 `* * * * *` 是**每分钟跑一次**——故意的，让你当场验收，不用等到明天。

❗【易错】**命令必须写绝对路径**：cron 执行任务时的环境和你敲命令时不一样，`python3` 这种"裸命令名"它可能找不到，老老实实写 `/usr/bin/python3`；脚本路径同理写全。

⚠️【必考】**`>>` 追加 vs `>` 覆盖**：一个箭头是覆盖（今天的记录冲掉昨天的），两个箭头是追加（像记账本，一页页往后记）。巡检日志必须用 `>>`。末尾 `2>&1` = 把报错信息也一起写进这个日志——不加它，脚本哪天出错了你连线索都没有。

**第三步：等两个整分钟，验收。**

### ✅ 怎么算成功

等 2 分钟左右，看日志：

```bash
cat /root/pyops/xunjian.log
```

预期输出应有**两段**，时间戳差约 1 分钟：

```
===== 巡检时间 2026-10-29 15:01:01 =====
CPU  使用率: 0.9%
内存 使用率: 22.4%
------------------------------
磁盘 /            已用 15.2%
磁盘 /boot        已用 19.5%
===== 巡检时间 2026-10-29 15:02:01 =====
CPU  使用率: 0.6%
内存 使用率: 22.4%
------------------------------
磁盘 /            已用 15.2%
磁盘 /boot        已用 19.5%
```

日志里两段时间自动增长——追加和定时**双双生效**。`crontab -l` 应能看到刚才那行配置。

**收尾**：验证完把测试班表改成正式班表，`crontab -e` 把那行改成：

```bash
0 8 * * * /usr/bin/python3 /root/pyops/xunjian.py >> /root/pyops/xunjian.log 2>&1
```

含义：每天早上 8 点整跑一次。❗【易错】每分钟的测试任务**一定要换掉**，不然它每分钟都跑，日志文件会越长越大。

### 🩹 如果不对

1. **等了三分钟日志还是空的** —— 按顺序排查：`service crond status` 看服务是不是 `active (running)`，没跑就 `service crond start`（cron 服务不跑，写什么任务都白搭）；`crontab -l` 确认那行存进去了；五颗星之间**必须有空格**。
2. **日志里出现 Python 报错** —— 正说明 `2>&1` 有用，报错被记下来了，按报错内容修脚本即可。
3. **卡在 vi 界面出不来** —— 按 Esc，输入 `:q!` 回车强制不保存退出，重新 `crontab -e` 再来。
4. **手动跑正常、cron 跑就失败** —— 八成路径没写全，把命令里的 `python3` 和脚本路径都换成绝对路径。

---

## 实验六（加分）：合成值班员——正常时安静，出事才吭声

### 🎯 目标

干成什么事：把实验二（巡检）和实验四（拨测）合成一个值班脚本 `check.py`：所有指标正常时只打一行"全部正常"；**任何一项超标**（CPU、内存、磁盘、网址非 200 或连不上）就把问题逐条列出来。跑通后接上实验五的 crontab，你就拥有一台"自动体检、有病才报告"的服务器。

为什么运维要它：监控的最高境界是**"没事别烦我，出事必须叫"**。每天给你发 50 条"一切正常"的机器，和狼来了没区别；好的值班员平时安静如鸡，异常时一嗓子把你叫醒。

### 📍 在哪动手

`/root/pyops/` 下新建 `check.py`。

### 🔧 动手做

整块复制粘贴执行：

```bash
cat > /root/pyops/check.py <<'PYEOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""值班脚本：巡检+拨测合一，正常安静，异常点名"""

import psutil
import time
import requests

# ---------- 阈值配置 ----------
CPU_LIMIT = 80
MEM_LIMIT = 80
DISK_LIMIT = 80
URLS = ["https://www.baidu.com"]    # 想盯更多地址就往里加

problems = []   # 问题清单：先收集，最后统一汇报

# 函数 = 给一段活起个名字，以后喊名字就能让它干
# 定义了不会立刻执行，只有"喊它"（调用）才执行
def check_disk(limit):
    """检查每块磁盘，超标的登记到 problems"""
    for part in psutil.disk_partitions():
        try:
            percent = psutil.disk_usage(part.mountpoint).percent
        except OSError:
            continue
        if percent > limit:
            problems.append(f"磁盘 {part.mountpoint} 已用 {percent}%，超过 {limit}%")

def check_url(url):
    """访问一个网址，非 200 或连不上就登记到 problems"""
    try:
        r = requests.get(url, timeout=5)
        if r.status_code != 200:
            problems.append(f"网址 {url} 状态码 {r.status_code}，不是 200")
    except requests.exceptions.RequestException as e:
        # RequestException 是 requests 各类报错的总称，一个 except 全接住
        problems.append(f"网址 {url} 连不上: {e}")

# ---------- 主流程：先查 CPU/内存，再"喊"上面两个函数干活 ----------
cpu = psutil.cpu_percent(interval=1)
mem = psutil.virtual_memory().percent
if cpu > CPU_LIMIT:
    problems.append(f"CPU {cpu}% 超过 {CPU_LIMIT}%")
if mem > MEM_LIMIT:
    problems.append(f"内存 {mem}% 超过 {MEM_LIMIT}%")

check_disk(DISK_LIMIT)   # 在这里"喊"函数：它会去干 check_disk 里写的活
for u in URLS:
    check_url(u)

# ---------- 汇报 ----------
if problems:    # 空列表当 False、非空当 True：一行判断"有没有出事"
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 发现 {len(problems)} 个问题：")
    for p in problems:
        print("  -", p)
else:
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] 全部正常，放心下班")
PYEOF
python3 /root/pyops/check.py
```

语法点：`def 名字(参数):` 加缩进函数体 = 把一段活打包复用；`"""说明"""` 叫文档字符串；**定义了不执行，代码里出现 `check_disk(80)` 才是真喊它干活**。这个脚本就是实验二和实验四的零件拼装——**复用正是写函数的意义**。

### ✅ 怎么算成功

第一遍跑，预期输出一行：

```
[2026-10-29 15:30:01] 全部正常，放心下班
```

然后**复现告警**：把 `DISK_LIMIT = 80` 改成 `5`、`URLS` 改成 `["http://nosuchdomain-abc123.com"]`，再跑：

```
[2026-10-29 15:31:20] 发现 2 个问题：
  - 磁盘 / 已用 15.2%，超过 5%
  - 网址 http://nosuchdomain-abc123.com 连不上: ...
```

正常一行、异常列清单——值班员上岗。改回原值，再用实验五的方法给它排上班表：

```bash
*/10 * * * * /usr/bin/python3 /root/pyops/check.py >> /root/pyops/check.log 2>&1
```

（`*/10` = 每 10 分钟一次，"斜杠星"是"每隔"的写法。）日志里安静的"全部正常"越多，说明服务器越稳。**以后的路**：告警只打进日志还不够，下一步可以学把告警推给你——邮件（smtplib）、钉钉/企业微信机器人（本质就是 requests 往一个网址 POST 一段文字，你已经会 requests 了，就差一步）。

### 🩹 如果不对

1. **跑完什么都不打印** —— 函数定义了但忘了"喊"（漏了 `check_disk(...)` 那几行调用），补上。
2. **`NameError: name 'problems' is not defined`** —— `problems = []` 必须写在两个 `def` **之前**，挪到函数后面就炸。
3. **网址连不上把"全部正常"挤没了** —— 这正是设计：有问题必点名。确认 `RequestException` 拼写没写错（拼错会 NameError）。

---

## 收尾：你现在会了什么

- **会跑了**：`python3` 运行脚本、shebang + `chmod +x` 直接执行、看得懂报错行号从哪下手。
- **会四件运维真活**：机器摸底（实验一）、指标巡检+阈值告警（实验二）、找大文件+过期日志清理（实验三）、网址拨测（实验四）。
- **会自动化**：crontab 排班（五颗星：分时日月周）、`>>` 追加留痕、`2>&1` 连报错都记账（实验五）。
- **会写正经脚本了**：函数封装复用、try/except 兜底、"正常安静异常吭声"的值班员设计、删除类操作"先预览后动手"的保命观（实验六）。
- **配合你已有的 Shell 基础**：Shell 适合快速拼一条命令，Python 适合逻辑复杂、要长期维护的活——Python 让运维从"手动敲命令"升级成"写脚本自动化"。

---

## 生产速查（收藏区）

> 实验里没展开、但生产天天用的模板和小抄全在这里，用时照抄改参数。

### 1. 用到再装的库

```bash
pip3 install pymysql paramiko          # 数据库 / SSH 远程执行
pip3 install psutil requests pymysql paramiko   # 一次装齐
pip3 install xxx -i https://pypi.tuna.tsinghua.edu.cn/simple   # 网慢换清华源
```

### 2. 语法小抄（背下这页，能读懂 90% 的运维脚本）

```python
# ---- 变量与数据类型：贴了标签的盒子 ----
name = "运维"        # 字符串
num = 100           # 整数
rate = 3.14         # 浮点数
is_ok = True        # 布尔值
list1 = [1, 2, 3]   # 列表（可增删改的一串）
dict1 = {"host": "10.0.0.1", "port": 3306}  # 字典（键值对，按键取值）

# ---- 输入输出 ----
name = input("请输入主机名: ")
print("主机名是:", name)
print(f"端口号是: {dict1['port']}")   # f-string 格式化，运维脚本标配

# ---- 条件判断：多级阈值 ----
load = 0.85
if load > 0.8:
    print("负载过高，告警！")
elif load > 0.5:
    print("负载偏高")
else:
    print("负载正常")

# ---- 循环 ----
hosts = ["web1", "web2", "web3"]
for h in hosts:               # for：把列表挨个取出来
    print(f"检查主机 {h}")

i = 0
while i < 5:                  # while：条件成立就一直转
    print(i)
    i += 1

# ---- 找文件的两把刀 ----
import glob
print(glob.glob("/var/log/*.log"))   # 只挑一层、按后缀：一行拿到所有 .log 路径
# 要钻进所有子目录，用实验三的 os.walk
```

### 3. 正则表达式速查（从日志里抠信息的神器）

```python
import re

log = "访问来源 192.168.1.100 端口 80"
ip = re.findall(r"\d+\.\d+\.\d+\.\d+", log)   # 匹配 IP
print(ip)   # ['192.168.1.100']

m = re.search(r'[\w.]+@[\w.]+', "联系: ops@example.com")   # 匹配邮箱
print(m.group())   # ops@example.com

new = re.sub(r"\d+\.\d+\.\d+\.\d+", "***.***.***.***", log)   # 替换（日志脱敏）
print(new)
```

| 符号 | 含义 |
|---|---|
| `.` | 匹配任意字符 |
| `*` | 前一个字符 0 次或多次 |
| `+` | 前一个字符 1 次或多次 |
| `\d` | 匹配数字 |
| `\w` | 匹配字母数字下划线 |
| `^` / `$` | 行首 / 行尾 |
| `[]` | 字符集合，如 `[0-9]` |

### 4. 文件操作模板：统计访问最多的 IP（日志清洗）

```python
with open("/var/log/nginx/access.log", "r") as f:   # 换成你自己的日志路径
    lines = f.readlines()

ip_count = {}
for line in lines:
    parts = line.split()          # 按空白切成一段段
    if parts:
        ip = parts[0]
        # dict.get(键, 默认值)：第一次见到这个 IP 就从 0 开始计数
        ip_count[ip] = ip_count.get(ip, 0) + 1

top = sorted(ip_count.items(), key=lambda x: x[1], reverse=True)[:5]
for ip, count in top:
    print(f"{ip}: {count} 次")
```

### 5. 数据库模板（pymysql 操作 MySQL）

```python
import pymysql

conn = pymysql.connect(host="localhost", user="root",
                       password="123456", database="mydb", charset="utf8mb4")
cur = conn.cursor()

cur.execute("SELECT id, name FROM users")   # 查询
for row in cur.fetchall():
    print(row)

# 插入：参数用 %s 占位防注入；写库后必须 commit
cur.execute("INSERT INTO users (name) VALUES (%s)", ("xiaowang",))
conn.commit()

cur.close()
conn.close()
```

### 6. SSH 远程执行命令模板（paramiko）

```python
import paramiko

def ssh_cmd(host, user, cmd, password=""):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())   # 首次连接自动信任
    ssh.connect(host, username=user, password=password, timeout=5)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode()

print(ssh_cmd("192.168.1.10", "root", "uptime"))   # 示例
```

> 生产环境 SSH 密码不应硬编码在脚本中，建议使用密钥认证或配置管理工具（如 Ansible）。

### 7. 批量 ping 检查主机模板（subprocess）

❗【易错】CentOS 7 的 Python 3.6 **不认识** `capture_output=True` 和 `text=True`（那是 Python 3.7 才加的参数），必须写老写法 `stdout=subprocess.PIPE`，否则报 `TypeError`：

```python
import subprocess

hosts = ["192.168.1.1", "192.168.1.2", "192.168.1.3"]
for ip in hosts:
    result = subprocess.run(["ping", "-c", "1", "-W", "1", ip],
                            stdout=subprocess.PIPE,   # 3.6 兼容写法
                            stderr=subprocess.PIPE)
    # returncode 为 0 表示命令执行成功（ping 通了）
    status = "在线" if result.returncode == 0 else "离线"
    print(f"{ip}: {status}")
```

### 8. 巡检报告存文件模板（datetime + subprocess 调 df）

```python
import datetime
import subprocess

now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
report = f"==== 巡检报告 {now} ====\n"

# universal_newlines=True 让输出以文本返回（3.6 写法，3.7 起可简写 text=True）
df = subprocess.run(["df", "-h"], stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE, universal_newlines=True)
report += df.stdout + "\n"

with open("/tmp/report.txt", "w") as f:
    f.write(report)
print("报告已生成 /tmp/report.txt")
```

### 9. 报错速查表

| 报错 | 意思 | 一句话解决 |
|---|---|---|
| `ModuleNotFoundError: No module named 'xxx'` | 库没装 | `pip3 install xxx`（注意是 pip3） |
| `IndentationError` | 缩进不对 | 照报错行号，同层对齐、4 空格 |
| `SyntaxError: Non-UTF-8 code` | 文件编码不对 | Linux 用 cat 写；Windows 用 VS Code 存成 UTF-8 |
| `NameError: name 'xxx' is not defined` | 名字没定义就用 | 查拼写、import 漏没漏、定义是否在调用之前 |
| `PermissionError: [Errno 13]` | 没权限 | 切 root，或给文件加权限 |
| `FileNotFoundError` | 路径不存在 | `ls` 确认路径；cron 里必须写绝对路径 |
| `TypeError: ... unexpected keyword argument 'capture_output'` | 用了 3.7+ 的参数 | 改用 `stdout=subprocess.PIPE`（见速查 7） |
| crontab 不执行 | 服务没跑/路径没写全 | `service crond status`；命令全部写绝对路径 |

> AI生成
