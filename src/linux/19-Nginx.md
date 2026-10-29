---
title: Nginx 从入门到生产实战
category: Linux进阶
tags:
  - Linux
  - Nginx
  - Web服务
---

# Nginx 从入门到生产实战（实验闯关版）

> 这篇不是查阅手册，是**跟着做就能做出来**的实验教程。你在 CentOS 7 虚拟机上从零开始：装 Nginx → 换上自己的网页 → 玩透 location 四种匹配 → 分清 root/alias → 一台机器跑两个网站 → 反向代理+负载均衡（后端挂了自动切换）→ 配 HTTPS → 看日志排错 404/502。8 关连成一条主线，每一处动手都讲清四件事：**要实现什么结果、有什么用、配置改在哪、怎么算成功**。通关后你拥有一台生产同款架构的 Nginx，和"改配置 → 测试 → 重载 → 验证"的肌肉记忆；生产模板和铁律全收在篇末速查区，干活时回来查。

## 实验环境准备

**用哪台机器**：CentOS 7 虚拟机（2 核 CPU / 2G 内存 / 20G 磁盘足够；1核1G 也能跑，只是卡）。**要联网**（yum 要装包）。全程用 root 登录操作。

**浏览器验证怎么来**：在你 Windows 宿主机的浏览器里访问虚拟机 IP。没有浏览器也行，所有验证都能用 `curl` 完成。

**小建议**：用 Xshell / MobaXterm / FinalShell 这类 SSH 工具连虚拟机（支持复制粘贴），比在 VMware 控制台里手敲舒服。以下命令全部在虚拟机里执行。

**确认环境就绪（逐条跑，全部过关再往下走）**：

```bash
cat /etc/redhat-release          # 系统版本，应包含 CentOS Linux release 7
free -m                           # 内存，Mem 行 total 大于 1500 即可
df -h /                           # 磁盘，"可用/Avail"列大于 2G 即可
ping -c 2 mirrors.aliyun.com      # 网络，应包含 0% packet loss（ping 不通但能开网页也算通）
yum repolist                      # yum 源，应列出仓库名和数字（base/updates/extras 等）
getenforce                        # SELinux 状态：Enforcing/Permissive/Disabled，记下来后面用
python --version                  # 应显示 Python 2.7.5（后面用 python 模拟后端服务器）
```

预期输出对照（关键行）：

```
CentOS Linux release 7.9.2009 (Core)
---
2 packets transmitted, 2 received, 0% packet loss
repo id                          repo name
base/7/x86_64                    ...
updates/7/x86_64                 ...
Python 2.7.5
```

❗第一次用 vim 的人，先把这 4 步背下来（后面全靠它改配置）：

```bash
vim 文件名     # 1. 打开文件
# 2. 按 i 键：左下角出现 INSERT，进入编辑模式（此时右键可粘贴 Windows 复制的内容）
# 3. 改完按 Esc 键：退出编辑模式
# 4. 输入 :wq 回车：保存退出（输 :q! 回车 = 放弃修改强退）
```

## 实验一：装上 Nginx，看到第一个网页

### 🎯 目标

把 Nginx 装进虚拟机并启动，让它变成一台真正在 80 端口"营业"的 Web 服务器，然后亲眼在浏览器看到默认欢迎页——这是整篇的第一个正反馈时刻。干什么用：以后公司任何网页要"发布出去给人访问"，底层都是这一步。

### 📍 在哪动手

不动任何文件，只敲命令。yum 会自动把 Nginx 装好，配置文件落在 `/etc/nginx/nginx.conf`（后面的实验天天和它打交道）。

### 🔧 动手做

```bash
yum install -y nginx        # 从 CentOS 官方源安装（版本 1.20.1，学习完全够用；
                            # 想要最新版可换官方源，做法见篇末生产速查）
nginx -v                    # 验证装上了，应显示 nginx version: nginx/1.x（以你装到的版本为准）
systemctl start nginx       # 启动 Nginx（现在开始监听 80 端口）
systemctl enable nginx      # 开机自启：防止服务器重启后网站打不开（生产必做）
systemctl status nginx      # 看运行状态
```

三条 `systemctl` 的分工：`start` 现在启动、`enable` 开机自启、`status` 看状态——生产上三件事都要做。

CentOS 7 默认开着 firewalld 防火墙，80 端口默认不放行，不放行的话 Windows 浏览器会打不开：

```bash
systemctl is-active firewalld                 # 显示 active 才需要做下面两条；inactive 就跳过
firewall-cmd --permanent --add-service=http   # 永久放行 HTTP（80 端口）
firewall-cmd --reload                         # 让上面那条规则立即生效
```

最后查一下虚拟机 IP（浏览器访问要用）：

```bash
ip addr | grep "inet "    # 找形如 inet 192.168.x.x/24 的那行（127.0.0.1 那行不算）
```

### ✅ 怎么算成功

先在虚拟机里自测（curl 就是命令行版的"浏览器"）：

```bash
curl -I http://127.0.0.1/
```

```
HTTP/1.1 200 OK
Server: nginx/1.20.1
Date: ...
Content-Type: text/html
```

（第一行 `200 OK` 是关键；版本号可能不同）

再确认进程状态：

```bash
systemctl status nginx
```

```
● nginx.service - The nginx HTTP and reverse proxy server
   Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; vendor preset: disabled)
   Active: active (running) since ...
```

（应包含关键字 `active (running)`）

最后在你 Windows 宿主机的浏览器里输入 `http://虚拟机IP/`——**看到 "Welcome to nginx!" 或 "Testing 123" 风格的欢迎页，实验一通关。**

### 🩹 如果不对

- **浏览器打不开，且 `curl -I http://127.0.0.1/` 也失败** → Nginx 没起来或 80 端口被占：

```bash
systemctl status nginx                  # 看是不是 failed
ss -tlnp | grep :80                     # 看谁占了 80
systemctl stop httpd; systemctl disable httpd   # 常见凶手：以前装过 Apache（httpd）
systemctl restart nginx
```

- **curl 通、浏览器打不开** → 十有八九是防火墙：回去执行那两条 `firewall-cmd`；还不通就是 Windows 到虚拟机的网络本身不通，先 `ping 虚拟机IP` 确认。

## 实验二：把欢迎页换成自己的网站

### 🎯 目标

现在网站内容还是 Nginx 自带的欢迎页，我们要换成**自己写的网页**。以后前端同事发你一个页面说"帮我挂到服务器上"，就是这一套动作：放文件 → 改配置指路 → 测试 → 重载 → 验证。

### 📍 在哪动手

两个地方：① 新建目录 `/data/www` 放网页文件（`mkdir` 建目录、`cat >` 写文件）；② 改配置文件 `/etc/nginx/nginx.conf`——yum 安装的 Nginx，站点配置就写在这里面 `http { }` 里的 `server { }` 块里。

### 🔧 动手做

第 1 步：建目录、写网页：

```bash
mkdir -p /data/www            # -p：没有就建，有也不报错
cat > /data/www/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>我的第一个网站</title></head>
<body><h1>你好，Nginx！这是我亲手部署的网页。</h1></body>
</html>
EOF
cat /data/www/index.html      # 确认内容写进去了
```

第 2 步：给目录"上户口"。CentOS 7 的 SELinux（安全子系统）默认开着，它不认识 `/data` 这个新目录，会**不让 Nginx 读里面的文件**（症状是 403）：

```bash
chcon -R -t httpd_sys_content_t /data/www    # 给目录打上"网站文件"标签
# 就算 getenforce 显示 Disabled（这条用不上），执行了也无害
```

第 3 步：先看看默认配置长什么样（纯参观，重点找 http 里的 server 块）：

```bash
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak    # 变更前先备份（生产军规）
grep -n 'server {' /etc/nginx/nginx.conf             # -n 显示行号，应显示 server { 的位置
```

第 4 步：学习机可以直接整份覆盖主配置（生产上只改 server 块、不整份覆盖）。下面这份带中文注释，覆盖后你会清楚每一行在干嘛：

```bash
cat > /etc/nginx/nginx.conf << 'EOF'
user  nginx;                       # Nginx 工作进程用哪个系统用户跑
worker_processes  auto;            # 自动 = CPU 几核就开几个"工人"
error_log  /var/log/nginx/error.log warn;    # 错误日志：只记 warn 及以上
pid        /run/nginx.pid;         # 进程号文件（systemctl 靠它管理进程）

events {
    worker_connections  1024;      # 每个"工人"最多同时接 1024 个连接
}

http {
    include       /etc/nginx/mime.types;        # 文件后缀→类型的对照表（让浏览器知道这是图还是字）
    default_type  application/octet-stream;     # 对照表没命中的，按"下载文件"处理
    types_hash_max_size 2048;                   # 类型表大小，防止版本告警

    sendfile           on;         # 发文件走内核高效通道
    keepalive_timeout  65;         # 连接保持 65 秒，减少反复握手

    access_log  /var/log/nginx/access.log;      # 访问日志（谁、什么时候、要了什么、结果如何）

    server {                       # 一个 server 块 = 一个网站
        listen      80;            # 守在 80 端口（http 默认端口）
        server_name localhost;     # 网站名字（实验五的虚拟主机要用它）
        location / {               # URL 规则：所有请求按这里的办法处理
            root  /data/www;      # 网站文件根目录（❗分号不能少）
            index index.html;     # 只访问目录时，默认给这个文件当首页
        }
    }

    include /etc/nginx/conf.d/*.conf;   # ★ 拆分配置的入口：这个目录里的 .conf 自动生效
}
EOF
```

人话记住配置的"五层楼"：`main`（最外层定全局）→ `events`（管连接）→ `http`（管所有网站）→ `server`（一个网站）→ `location`（一类 URL 的规则）。口诀：**main 定全局，events 管连接，http 管网站，server 分站点，location 分路径。**

第 5 步：改完配置的"两连击"（⚠️【必考】背下来，后面每个实验结束都做）：

```bash
nginx -t          # 第一击：检查语法（test），显示 successful 才继续
nginx -s reload   # 第二击：平滑重载新配置（不断线，老请求处理完才换，用户无感知）
```

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### ✅ 怎么算成功

```bash
curl http://127.0.0.1/
```

```
<head>...<title>我的第一个网站</title>...
<h1>你好，Nginx！这是我亲手部署的网页。</h1>
```

（应包含关键字 `我的第一个网站` 和 `你好，Nginx`）

浏览器打开 `http://虚拟机IP/`，看到"你好，Nginx！…"，标签页标题变成"我的第一个网站"——欢迎页被换掉了，实验二通关。

### 🩹 如果不对

- **403 Forbidden**（文件在但 Nginx 没权限读）：最常见是 SELinux——回去做第 2 步的 `chcon`，再 `nginx -s reload`；其次是 `/data/www` 拼写和配置里的 `root` 对不上。
- **404 Not Found**：`root` 指的目录和文件实际位置对不上；或者 ❗【易错】**改了配置忘了 `nginx -s reload`**——Nginx 不会自动读新配置，改完必须重载。
- **curl 通、浏览器还是欢迎页**：浏览器缓存——Ctrl+F5 强制刷新。

## 实验三：location 四种匹配，让不同的 URL 各走各路

### 🎯 目标

`location` 是 Nginx 的"URL 分拣员"：同一个网站，不同路径交给不同规则处理。这一关配出四种典型分法——`/health` 回一句 "ok"（负载均衡、监控探活就认它）、`/static/` 直接给静态文件、`.html/.css/.js` 后缀走正则、`/api/` 转发给后端程序（这就是**反向代理**：Nginx 替后端收发请求，用户只跟 Nginx 打交道）。配完逐个验证，最后做一个"删一条配置、看请求被谁抢走"的对比实验，把优先级口诀变成亲眼所见。

### 📍 在哪动手

① 建几个测试文件和目录；② 改 `/etc/nginx/nginx.conf` 里实验二写的那个 `server { }` 块（vim）；③ 起一个 python 迷你后端。

### 🔧 动手做

第 1 步：准备测试文件：

```bash
mkdir -p /data/www/static /data/www/regex/static /data/api
# ^~ /static/ 要用的图片（SVG 是用文本写出来的图片，浏览器能直接显示）
cat > /data/www/static/logo.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">
  <rect width="300" height="100" fill="#2d8cf0"/>
  <text x="20" y="60" font-size="24" fill="#fff">static OK</text>
</svg>
EOF
# 同名 app.js 放进两个不同目录——待会儿用来"看见"请求到底被谁处理
echo '我是 /data/www/static/app.js —— 来自 ^~ 前缀阻断块'   > /data/www/static/app.js
echo '我是 /data/www/regex/static/app.js —— 来自正则块'      > /data/www/regex/static/app.js
echo '正则块自己的文件：/data/www/regex/app.js'               > /data/www/regex/app.js
echo 'api 后端的测试文件' > /data/api/note.txt
```

第 2 步：先解锁 SELinux 的"出网限制"——它默认禁止 Nginx 主动连接其他端口，而反向代理干的就是这事，不放开会 502：

```bash
setsebool -P httpd_can_network_connect 1    # 允许 Nginx 连后端（-P = 永久生效）
```

第 3 步：起一个 python 迷你后端（一行命令起一个 Web 服务，模拟公司里的 Tomcat/Java 服务）：

```bash
cd /data/api                                        # python 迷你服务器把"当前目录"当网站根
python -m SimpleHTTPServer 8080 > /tmp/api8080.log 2>&1 &   # 后台跑，刷屏日志收进文件
cd ~
```

（若你的机器是 Python 3：把命令换成 `python3 -m http.server 8080`）

第 4 步：改 server 块。vim 小技巧：先 `grep -n 'server {' /etc/nginx/nginx.conf` 看行号，vim 打开后输 `:行号` 回车可直达；在要删的行上按 `dd` 删一行；删完按 `i` 粘贴新内容，Esc → `:wq`。把 `server {` 到它配对的 `}` 整块换成：

```nginx
server {
    listen      80;                 # 守 80 端口
    server_name localhost;

    # ① 精确匹配（=）：URL 一字不差是 /health 才命中，优先级最高
    location = /health {
        return 200 "ok";           # 不读任何文件，直接回 200 状态码 + "ok" 两个字母
    }

    # ② 前缀阻断（^~）：/static/ 开头的请求到这就停，不再往下看正则
    location ^~ /static/ {
        root /data/www;            # 真实文件 = /data/www + /static/logo.svg
    }

    # ③ 正则（~* 不区分大小写）：以 .html / .css / .js 结尾的 URL 都归它
    location ~* \.(html|css|js)$ {
        root /data/www/regex;      # 实验故意换目录，让"谁抢走了请求"一眼可见
    }

    # ④ 普通前缀：/api/ 开头的请求转发给后端（反向代理）
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;   # 转发到本机 8080；末尾 / 的含义见下
    }

    # 兜底：上面都没命中的，按最长前缀落到这里（首页等静态页）
    location / {
        root  /data/www;
        index index.html;
    }
}
```

❗两条易碎提醒：③ 会拦下**所有**带 `.html/.css/.js` 后缀的 URL（首页 `/` 不受影响，因为 URI 是 `/`，没有后缀）；④ 的 `proxy_pass` 末尾 `/` 表示"把 `/api/` 前缀剥掉再转给后端"——`/api/note.txt` 后端收到的是 `/note.txt`。**带不带这个 `/` 结果完全不同，是生产事故常客。**

改完两连击：`nginx -t` → `nginx -s reload`。

### ✅ 怎么算成功

① 精确匹配：

```bash
curl http://127.0.0.1/health
```

```
ok
```

（`return 200 "ok"` 原样输出，不带换行，终端提示符紧贴着 ok——正常。）生产上负载均衡器、容器健康检查就是反复探这个接口，回 200 就算这台机器活着。再试 `curl http://127.0.0.1/health/` 会 404——精确匹配要求**一字不差**，多个斜杠都不行。

② 前缀阻断：

```bash
curl -I http://127.0.0.1/static/logo.svg
```

```
HTTP/1.1 200 OK
Content-Type: image/svg+xml
```

浏览器打开 `http://虚拟机IP/static/logo.svg`，能看到蓝底白字 "static OK" 的图片。

③ 正则匹配（拿一个不在 `/static/` 下的 js 试）：

```bash
curl http://127.0.0.1/app.js
```

```
正则块自己的文件：/data/www/regex/app.js
```

④ 普通前缀 + 反向代理：

```bash
curl http://127.0.0.1/api/
```

```
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
...
<h1>Directory listing for /</h1>
<a href="note.txt">note.txt</a>
```

（应包含关键字 `Directory listing for /` 和 `note.txt`——这页是 python 后端生成的，Nginx 只当了传话筒，这就是反向代理。Python 3 的页面样式略有不同，不影响。）顺手 `curl http://127.0.0.1:8080/` 直连后端，看到同样内容——排障心法第一条：**先确认后端自己活着，再怀疑 Nginx。**

进阶验证：亲眼看到优先级。把 ② `^~ /static/` 那几行用 vim 删掉（vim 里按 `dd` 逐行删），两连击后再打同一个 URL：

```bash
curl http://127.0.0.1/static/app.js
```

```
我是 /data/www/regex/static/app.js —— 来自正则块
```

② 还在时这条命令返回的是 `/data/www/static/app.js` 的内容；删掉 ② 后**同一个 URL 被正则抢走了**——普通前缀 `/` 虽然也能匹配 `/static/app.js`，但正则的优先级压过普通前缀。⚠️【必考】优先级口诀（面试原题）：**精确（`=`）＞ 前缀阻断（`^~`）＞ 正则（`~`/`~*`，按书写顺序）＞ 普通前缀（谁长听谁）**。看完把 ② 加回配置并两连击，`curl /static/app.js` 又会变回 ② 的内容。

### 🩹 如果不对

- **`curl /health` 404**：`=` 那条没写进 server 块，或忘了两连击；或 URL 多了尾巴（`/health/`、`/healthx` 都不命中）。
- **`/api/` 返回 502 Bad Gateway**：后端没起，或 SELinux 拦了。`ss -tlnp | grep 8080` 应看到 python 在 LISTEN；`tail /var/log/nginx/error.log` 若出现 `connect() failed (13: Permission denied)`，就是 SELinux——回去做第 2 步的 `setsebool`。

## 实验四：root 和 alias——同一个 URL，两种找文件的算法

### 🎯 目标

`root` 和 `alias` 都是"告诉 Nginx 去磁盘哪里找文件"，但算法不同：**root 是"拼接"，alias 是"替换"**。这一关用同一个 URL `/down/a.txt` 分别配两种写法，亲眼看到它找到的是两个不同文件。生产里 90% 用 root（语义清晰不易踩坑），但看懂别人配的 alias 是基本功。

### 📍 在哪动手

新建两个测试目录和文件；在 `/etc/nginx/nginx.conf` 的 `server` 块里加一个 `location /down/`（放在 `location /` 上面即可）。

### 🔧 动手做

```bash
mkdir -p /data/www/down /data/file
echo 'root 配法找到的：/data/www/down/a.txt' > /data/www/down/a.txt
echo 'alias 配法找到的：/data/file/a.txt'   > /data/file/a.txt
```

配法一（root 拼接）——vim 编辑 `/etc/nginx/nginx.conf`，在 server 块里加：

```nginx
    location /down/ {
        root /data/www;      # 真实路径 = root 值 + 完整 URL = /data/www + /down/a.txt
    }
```

人话：root 说"把整个 URL 原样接在我后面"。两连击后验证：

```bash
nginx -t && nginx -s reload
curl http://127.0.0.1/down/a.txt
```

```
root 配法找到的：/data/www/down/a.txt
```

配法二（alias 替换）——把上面那段改成：

```nginx
    location /down/ {
        alias /data/file/;    # 真实路径 = alias 值 +（URL 去掉 /down/ 前缀）= /data/file/ + a.txt
    }
```

人话：alias 说"location 匹配的那截前缀 `/down/`，被我替换成 `/data/file/`"。两连击后再打同一个 URL：

```bash
nginx -t && nginx -s reload
curl http://127.0.0.1/down/a.txt
```

```
alias 配法找到的：/data/file/a.txt
```

### ✅ 怎么算成功

同一个 URL `/down/a.txt`：root 时返回 `/data/www/down/a.txt` 的内容，alias 时返回 `/data/file/a.txt` 的内容——**拼接 vs 替换，亲眼验证**。口诀：**root 是接尾巴，alias 是换前缀。**

### 🩹 如果不对

- **404**：拿纸笔把两种算法算一遍真实路径，八成和你配置的目录对不上；❗【易错】alias 的值末尾必须带 `/`（`/data/file/` 而不是 `/data/file`），少了会拼出错误路径。
- 通病：改完忘了两连击（`nginx -t` + `nginx -s reload`）。

## 实验五：虚拟主机——一台机器跑两个网站

### 🎯 目标

一台服务器跑两个站：`oa.test.com` 是 OA 办公系统、`shop.test.com` 是商城系统，**同一个 80 端口，靠"报文里的 Host（域名）"分流**。生产上一台机器挂多个内部系统就是这么干的，也是生产 90% 的虚拟主机选择的方式（比按端口、按 IP 分流都省资源、好维护）。

### 📍 在哪动手

① 新建文件 `/etc/nginx/conf.d/vhosts.conf`——实验二写的主配置里有一行 `include /etc/nginx/conf.d/*.conf;`，意思是"这个目录里的 .conf 自动生效"，这正是生产"配置拆分"的雏形，每个站一个文件、互不干扰；② 改 `/etc/hosts` 给两个假域名做"劫持"。

### 🔧 动手做

第 1 步：两个站各写一个首页（这里用 `echo` 一行写法，和实验二的 heredoc 效果一样）：

```bash
mkdir -p /data/www/oa /data/www/shop
echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>OA</title></head><body><h1>这里是 OA 办公系统的首页</h1></body></html>' > /data/www/oa/index.html
echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>商城</title></head><body><h1>这里是商城系统的首页</h1></body></html>' > /data/www/shop/index.html
```

第 2 步：写两个 server 块（`vim /etc/nginx/conf.d/vhosts.conf`，文件不存在 vim 会自动新建）：

```nginx
server {
    listen      80;               # 两个站都守 80
    server_name oa.test.com;      # 报文 Host 是它 → 走这个站
    root  /data/www/oa;
    index index.html;
}
server {
    listen      80;
    server_name shop.test.com;
    root  /data/www/shop;
    index index.html;
}
```

第 3 步：让虚拟机自己认识这两个假域名（正式域名要花钱买和做解析；测试用 `/etc/hosts` 顶替——它就是本机的"迷你 DNS"）：

```bash
echo "127.0.0.1 oa.test.com shop.test.com" >> /etc/hosts
tail -1 /etc/hosts               # 确认写进去了
nginx -t && nginx -s reload
```

### ✅ 怎么算成功

```bash
curl http://oa.test.com/
```

```
...<h1>这里是 OA 办公系统的首页</h1>...
```

```bash
curl http://shop.test.com/
```

```
...<h1>这里是商城系统的首页</h1>...
```

第二种验证姿势（不依赖 /etc/hosts，直接伪造 Host 头——生产排障天天用）：

```bash
curl -H "Host: shop.test.com" http://127.0.0.1/
```

```
...这里是商城系统的首页...
```

浏览器验证（可选）：在 Windows 宿主机用管理员身份打开 `C:\Windows\System32\drivers\etc\hosts`，加一行 `虚拟机IP oa.test.com shop.test.com`，保存后浏览器分别访问两个域名，各回各家。

### 🩹 如果不对

- **返回的还是"你好，Nginx"主站** → Host 没对上。Nginx 的规则：**所有 server_name 都不匹配时，把请求交给"同端口里第一个 server 块"兜底**（所以直接打 IP 进来永远落主站）。检查 `server_name` 拼写、`curl -H` 有没有带、`/etc/hosts` 那行在不在（`cat /etc/hosts`）。
- **404**：`root` 目录写错；或 `vhosts.conf` 根本没被加载——`nginx -T` 会打印当前生效的完整配置，能 grep 到 `oa.test.com` 才算加载成功（`nginx -T | grep oa.test.com`）。

## 实验六：反向代理 + 负载均衡——两台后端轮着干活，挂一台也不怕

### 🎯 目标

故事升级：业务火了，一台后端扛不住，我们扩到**两台**（用两个 python 进程顶替，分别监听 8081、8082，各自能报出"我是谁"），再让 Nginx 把进来的请求**轮流分给两台**——这就是负载均衡，大流量分摊给多台机器的生产标配。最后亲手干掉一台后端，看 Nginx 自动把流量切给活着的那个——生产后端宕机"用户无感"就是这么实现的。

### 📍 在哪动手

① 起两个 python 后端；② 新建 `/etc/nginx/conf.d/lb.conf`（放"后端池"定义 + 一个新入口站 lb.test.com）。实验三那条单后端 `/api/` 转发不动它，两个入口并存。

### 🔧 动手做

第 1 步：起两个"能报出自己是谁"的后端：

```bash
mkdir -p /data/backend1 /data/backend2
touch /data/backend1/i-am-backend-1.txt      # 目录页会显示文件名——用它认人
touch /data/backend2/i-am-backend-2.txt
cd /data/backend1
python -m SimpleHTTPServer 8081 > /tmp/b1.log 2>&1 &    # 后端 1 在 8081
cd /data/backend2
python -m SimpleHTTPServer 8082 > /tmp/b2.log 2>&1 &    # 后端 2 在 8082
cd ~
# 直连确认两台都活着（应各显示自己的文件名）
curl -s http://127.0.0.1:8081/ | grep am-
curl -s http://127.0.0.1:8082/ | grep am-
```

预期输出（两行，各报各的名）：

```
<a href="i-am-backend-1.txt">i-am-backend-1.txt</a><br>
<a href="i-am-backend-2.txt">i-am-backend-2.txt</a><br>
```

这两个后端**故意不做防火墙放行**：Nginx 在本机转发找它们，用户永远只许打 Nginx——生产同理，后端只监听内网，入口只有一台。

第 2 步：定义后端池 + 入口站（`vim /etc/nginx/conf.d/lb.conf`）：

```nginx
# upstream：定义一个"后端池"，名字自己起（下面 proxy_pass 要用这个名字）
upstream backend_pool {
    server 127.0.0.1:8081;     # 后端 1
    server 127.0.0.1:8082;     # 后端 2（两个都不带参数 = 轮询：1→2→1→2）
    # 生产写法（健康检查）：30 秒内失败 3 次踢下线 30 秒
    # server 192.168.10.21:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen      80;
    server_name lb.test.com;             # 新入口的域名
    location /api/ {
        proxy_pass http://backend_pool/;  # 转发目标从"IP:端口"升级成了"池名"
    }
}
```

```bash
nginx -t && nginx -s reload
```

### ✅ 怎么算成功

连续请求三次，看响应轮流换人（❗忘了 `-H` 会落到主站兜底上变 404）：

```bash
curl -s -H "Host: lb.test.com" http://127.0.0.1/api/ | grep am-
curl -s -H "Host: lb.test.com" http://127.0.0.1/api/ | grep am-
curl -s -H "Host: lb.test.com" http://127.0.0.1/api/ | grep am-
```

```
<a href="i-am-backend-1.txt">i-am-backend-1.txt</a><br>
<a href="i-am-backend-2.txt">i-am-backend-2.txt</a><br>
<a href="i-am-backend-1.txt">i-am-backend-1.txt</a><br>
```

1 号、2 号、1 号轮流响应——**轮询负载均衡，眼见为实。**

进阶验证：亲手"宕机"一台，看自动切换：

```bash
pkill -f "SimpleHTTPServer 8082"        # 干掉 2 号后端（模拟宕机）
curl -s -H "Host: lb.test.com" http://127.0.0.1/api/ | grep am-
curl -s -H "Host: lb.test.com" http://127.0.0.1/api/ | grep am-
```

```
<a href="i-am-backend-1.txt">i-am-backend-1.txt</a><br>
<a href="i-am-backend-1.txt">i-am-backend-1.txt</a><br>
```

2 号挂了，请求**全部自动落到 1 号，服务一次都没断**——Nginx 默认"这台连不上就立刻换下一台"；生产再配上 `max_fails=3 fail_timeout=30s` 就是标准故障摘除。把 2 号救活，等 10 秒再请求，轮询恢复：

```bash
cd /data/backend2
python -m SimpleHTTPServer 8082 > /tmp/b2.log 2>&1 &
cd ~
```

### 🩹 如果不对

- **一直 502**：池子里端口写错或后端没起。`ss -tlnp | grep 808` 应看到 8081、8082 两个 python 在 LISTEN；再直连 `curl http://127.0.0.1:8081/` 确认后端本身活着。
- **返回 404 而不是后端页面**：`proxy_pass` 末尾 `/` 忘了带，后端收到 `/api/` 开头的路径找不到文件。

## 实验七：HTTPS——亲手给网站配证书加密

### 🎯 目标

给网站上"锁"：生成证书 → 配置 443 端口 → `curl -k` 和浏览器双重验证。生产流程一模一样，区别只是：实验用**自签证书**（自己给自己发身份证，浏览器不认、会报警告——仅限测试）；生产用 CA 机构/云平台签发的**正式证书**（浏览器显示小绿锁）。

### 📍 在哪动手

① 敲命令把证书生成到 `/etc/nginx/ssl/`（目录不存在先 `mkdir`）；② 新建 `/etc/nginx/conf.d/ssl.conf`。

### 🔧 动手做

第 1 步：一条命令自签证书（openssl 就是证书界的"打印机"）：

```bash
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/self.key \    # 生成私钥（印章，绝不外泄）
  -out /etc/nginx/ssl/self.crt \       # 生成证书（身份证，公开摆着）
  -subj "/CN=192.168.10.11"           # CN 写你虚拟机的 IP（换成你的）
chmod 600 /etc/nginx/ssl/self.key     # 私钥权限收紧：只能 root 读（生产铁律）
ls -l /etc/nginx/ssl/                  # 应看到 self.crt 和 self.key 两个文件
```

❗易碎提醒：行尾的 `\` 是续行符，后面**不能有空格**，手敲容易翻车——写成一行也行。

第 2 步：配置 HTTPS 站点（`vim /etc/nginx/conf.d/ssl.conf`）：

```nginx
server {
    listen       443 ssl;                  # 守 443 端口并启用 ssl
    server_name  _;
    ssl_certificate      /etc/nginx/ssl/self.crt;   # 证书
    ssl_certificate_key  /etc/nginx/ssl/self.key;   # 私钥
    ssl_protocols        TLSv1.2 TLSv1.3;   # 只留安全协议（老系统对 TLSv1.3 报错就删掉它）
    ssl_ciphers          HIGH:!aNULL:!MD5; # 加密套件强度
    ssl_session_cache    shared:SSL:10m;   # 会话缓存：回头客少一次握手，省资源
    ssl_session_timeout  10m;
    location / {
        root  /data/www;               # 复用实验二的网页——同一个站，加把锁
        index index.html;
    }
}
```

```bash
nginx -t && nginx -s reload
firewall-cmd --permanent --add-service=https && firewall-cmd --reload   # 放行 443（firewalld 关着的跳过）
```

### ✅ 怎么算成功

```bash
curl -k https://127.0.0.1/
```

```
<!DOCTYPE html>
...<h1>你好，Nginx！这是我亲手部署的网页。</h1>...
```

（`-k` = 跳过证书校验。自签证书不在信任名单里，不加 `-k` 会报错，如下）：

```bash
curl https://127.0.0.1/
```

```
curl: (60) ...
```

（应包含关键字 `(60)`，意思是"证书校验失败"——这正是自签证书的本色）

浏览器验证：Windows 宿主机打开 `https://虚拟机IP/` → 浏览器红色警告"您的连接不是私密连接" → 点"高级"→"继续前往" → 看到自己的网页。**警告不是失败，是浏览器在提醒"这证书是自己签的"**；换成生产正式证书后，这里就是一把小绿锁。

### 🩹 如果不对

- **`nginx -t` 报 `ssl_certificate ... does not exist`**：证书路径写错或第 1 步没生成成功——`ls /etc/nginx/ssl/` 检查两个文件在不在。
- **`curl -k` 通、浏览器打不开**：443 没放行——回去执行那两条 `firewall-cmd`。
- **报 `the "ssl" parameter requires ngx_http_ssl_module`**：你的 Nginx 编译时没带 ssl 模块（源码安装常见）——按生产速查里的编译参数重装；yum 装的不会遇到。

## 实验八：日志与排错——亲眼看请求，亲手排 404 和 502

### 🎯 目标

养成运维最重要的习惯：**出事不瞎猜，先看日志**。这一关：① 看见自己刚发的请求在 access.log 里的样子并读懂每一列；② 认识 error.log（它比 access.log 多告诉你"为什么"）；③ 亲手制造一次 404、一次 502、一次配置语法错误，把生产最常见的排错套路各走一遍。以后半夜收到告警，你的第一反应就是这一关教的。

### 📍 在哪动手

不改任何配置——yum 装的 Nginx 日志早就配好了：`/var/log/nginx/access.log`（访问日志）和 `/var/log/nginx/error.log`（错误日志）。只敲观察命令 + 复现问题。

### 🔧 动手做

第 1 步：制造访问、看自己的痕迹：

```bash
curl http://127.0.0.1/ > /dev/null     # 制造一次访问（> /dev/null = 返回内容扔掉不看）
tail -1 /var/log/nginx/access.log      # 看日志最后一行
```

```
127.0.0.1 - - [29/Oct/2026:10:00:00 +0800] "GET / HTTP/1.1" 200 145 "-" "curl/7.29.0"
```

逐列翻译（生产看日志就是看这几个字段）：

| 字段 | 例子 | 含义 |
|------|------|------|
| 第 1 列 | 127.0.0.1 | 谁来访问的（客户端 IP——抓刷量攻击就看它） |
| 请求行 | "GET / HTTP/1.1" | 要了什么（方法 + 路径 + 协议版本） |
| 状态码 | 200 | 结果：200 成功；404 没找到；502 后端挂了 |
| 字节数 | 145 | 回了多少内容 |
| 工具 | "curl/7.29.0" | 访客用的什么（浏览器会写 Chrome/xxx） |

实时视角：另开一个 SSH 窗口跑 `tail -f /var/log/nginx/access.log`（挂着不动），回原窗口 curl 或刷新浏览器，日志滚一行——生产排障的"实时监控视角"，Ctrl+C 退出。

第 2 步：制造一次 404 并排掉：

```bash
curl -I http://127.0.0.1/no-such-page
```

```
HTTP/1.1 404 Not Found
```

404 排查套路（生产顺序）：① URL 本身对不对；② location 有没有命中你以为的那条（想想实验三的优先级）；③ `root` 指向的目录里到底有没有这个文件；④ ❗【易错】改了配置两连击了吗？再看 error.log，它多给一个"为什么"：

```bash
tail -1 /var/log/nginx/error.log
```

```
2026/10/29 10:05:00 [error] 1234#0: *56 open() "/data/www/no-such-page" failed (2: No such file or directory), client: 127.0.0.1, ...
```

第 3 步：制造一次 502 并排掉（502 = Nginx 连不上后端，生产最高频告警）：

```bash
pkill -f SimpleHTTPServer        # 把 python 后端全干掉（模拟后端全宕机）
curl -I -H "Host: lb.test.com" http://127.0.0.1/api/
```

```
HTTP/1.1 502 Bad Gateway
```

502 排查三连（背下来）：

```bash
# ① 后端进程还在吗？（生产最常见：Java/Tomcat 挂了）
ss -tlnp | grep 808               # 应看到 8081/8082 在 LISTEN——现在空空如也
# ② 绕过 Nginx 直连后端
curl -I http://127.0.0.1:8081/
```

```
curl: (7) Failed connect to 127.0.0.1:8081; Connection refused
```

```bash
# ③ 看 error.log，Nginx 把原因写得明明白白
tail -2 /var/log/nginx/error.log
```

```
...connect() failed (111: Connection refused) while connecting to upstream, client: 127.0.0.1, server: lb.test.com, request: "HEAD /api/ HTTP/1.1", upstream: "http://127.0.0.1:8081/", host: "lb.test.com"
```

翻译：连接后端时被拒 = 后端没起。修复它：

```bash
cd /data/backend1
python -m SimpleHTTPServer 8081 > /tmp/b1.log 2>&1 &
cd /data/backend2
python -m SimpleHTTPServer 8082 > /tmp/b2.log 2>&1 &
cd ~
curl -I -H "Host: lb.test.com" http://127.0.0.1/api/    # 恢复 200 OK 即修复成功
```

第 4 步：故意制造一次配置语法错误，学会读报错。用 vim 随便删掉 `nginx.conf` 里某行末尾的分号（比如 `root /data/www;` 的分号），然后：

```bash
nginx -t
```

```
nginx: [emerg] unexpected "}" in /etc/nginx/nginx.conf:43
nginx: configuration file /etc/nginx/nginx.conf test failed
```

报错直接给出**文件:行号**——去 43 行附近找少分号/少大括号/中文引号，改回来再 `nginx -t`。⚠️【必考】铁律：**`nginx -t` 不通过，绝不 reload**（好在 reload 失败也不影响正在跑的服务，改对再重试就行）。

第 5 步：一眼统计今天的状态码分布（日志分析入门）：

```bash
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn
```

```
     12 200
      2 404
      1 502
```

一眼看出今天有多少 404/502。更狠的日志三板斧（TOP IP、TOP URL、慢请求）收在篇末生产速查。

### ✅ 怎么算成功

你现在能当场回答三个问题：这台 Nginx 今天**被谁访问过**（access.log 第 1 列）、**有没有 404/502**（awk 统计状态码）、**每个错的原因是什么**（error.log 翻原文）。三个都能答，实验八通关。

### 🩹 如果不对

- **`tail -f` 没动静**：请求打到了别的 server 上（忘了 `-H`？），或日志路径不对——`ls /var/log/nginx/` 确认。
- **想直接捞某种错误**：`grep 502 /var/log/nginx/access.log | tail -5`，比翻全量日志快得多。

## 收尾：你现在会了什么

8 关打完，回头看这条线：一台裸的 CentOS 7 → 一台 Web 服务器 → 有自己的网站 → 会分拣 URL → 懂两种找文件的算法 → 一台机器跑多站 → 两台后端负载均衡带故障切换 → 全程 HTTPS → 出事会看日志。**这就是一台生产 Nginx 的完整生命周期。**

| 你掌握了 | 工作中什么时候用得上 |
|-----------|----------------------|
| 安装启动、防火墙放行、开机自启 | 新机器从零搭 Web 入口 |
| 部署静态页 + "nginx -t → reload" 两连击 | 前端同事丢来一个页面让你"挂上去" |
| location 四种匹配和优先级口诀 | 配健康检查接口、动静分离、灰度切流、看懂别人配置 |
| root 和 alias 的区别 | 静态目录映射，排查 404 少走弯路 |
| 虚拟主机（按域名分流） | 一台机器跑 OA、商城、文档站多个内部系统 |
| 反向代理 + 负载均衡 + 故障摘除 | 业务上量后加机器分摊流量；后端宕机用户无感 |
| HTTPS 证书配置 | 证书到期换新、内网系统加 https、配合等保要求 |
| access.log / error.log 读法 + 404/502 套路 | 半夜告警第一眼看 error.log，而不是瞎猜乱重启 |

往后你还会在生产里遇到：配置拆分规范、gzip 压缩、限流防盗链、正式证书申请、内核参数调优、压测、上线 Checklist——这些不用背，全部收在下面的**生产速查**里，干活时回来查。

## 生产速查（收藏区）

> 跟做实验时不用抄这里；上岗干活、面试前复习时回来查。

### 1. 概念与选型

- Nginx 是高性能的 **HTTP 服务器 + 反向代理服务器**，事件驱动模型（epoll），内存占用极低却能支撑数万并发连接。
- 正向 vs 反向（口诀：**正向代理替用户出头，反向代理替服务器守门**）：正向代理代理**客户端**，服务器不知道真实用户是谁（如办公网出口代理）；反向代理代理**服务端**，用户不知道真实后端是谁（生产标配架构）。
- 与 Apache 对比：

| 对比项 | Nginx | Apache |
|--------|-------|--------|
| 并发模型 | 事件驱动（异步非阻塞），几万并发轻松 | 每连接一个进程/线程，并发高时开销大 |
| 反向代理/负载均衡 | 原生支持，功能强大 | 需模块，性能一般 |
| 静态文件 | 极快，高并发优势明显 | 一般 |
| 动态语言 | 交给后端（php-fpm、Tomcat），各司其职 | 可内置模块处理 |

- 生产典型架构：**Nginx 做统一入口，后面挂静态资源、Tomcat、PHP、业务网关**——云平台 Web 控制台、业务系统前端基本都是这个模式。

### 2. 安装备查

yum 官方源（要新版本时用）：

```bash
cat > /etc/yum.repos.d/nginx.repo << 'EOF'
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
EOF
```

源码编译（需要定制模块时用）：

```bash
yum install -y gcc gcc-c++ make openssl-devel pcre-devel zlib-devel
cd /usr/local/src
wget http://nginx.org/download/nginx-1.24.0.tar.gz
tar xf nginx-1.24.0.tar.gz && cd nginx-1.24.0

./configure \
  --prefix=/usr/local/nginx \          # 安装目录
  --with-http_ssl_module \            # HTTPS 支持（生产必开）
  --with-http_stub_status_module \    # 状态监控页
  --with-http_realip_module \         # 获取真实客户端 IP
  --with-stream \                     # TCP/UDP 四层代理（代理 MySQL/Redis）
  --with-http_v2_module               # HTTP/2
make && make install
/usr/local/nginx/sbin/nginx -V         # 验证版本和编译参数（加固可加 --without-http_autoindex_module）
```

源码安装目录结构（yum 安装的对应关系：配置 `/etc/nginx/`、默认网页 `/usr/share/nginx/html/`、日志 `/var/log/nginx/`）：

```
/usr/local/nginx
├── conf/     # 配置目录（nginx.conf 主配置、mime.types 类型映射）
├── html/     # 默认站点目录（index.html、50x.html）
├── logs/     # 日志目录（access.log / error.log / nginx.pid）
└── sbin/     # 可执行文件
```

源码安装需手写 systemd 服务文件（yum 安装自带）：

```bash
cat > /usr/lib/systemd/system/nginx.service << 'EOF'
[Unit]
Description=nginx
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/nginx/sbin/nginx
ExecReload=/usr/local/nginx/sbin/nginx -s reload
ExecStop=/usr/local/nginx/sbin/nginx -s quit
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload && systemctl enable nginx && systemctl start nginx
```

日常管理命令：

```bash
nginx -t              # 检查配置语法（改完配置必做！）
nginx                 # 启动
nginx -s reload       # 平滑重载（不中断服务，生产改配置就用它）
nginx -s stop         # 立即停止；-s quit 优雅停止（处理完存量请求再停）
nginx -V              # 查看版本和编译参数
```

**生产铁律**：改完配置先 `nginx -t`，输出 `successful` 再 `reload`；reload 是平滑的，老 worker 处理完存量请求才退出，用户无感知。

### 3. 配置结构与 location 优先级

层级：**main → events → http → server → location**，`http` 里可以有多个 `server`，`server` 里可以有多个 `location`。

| 语法 | 含义 | 优先级 |
|------|------|--------|
| `location = /login` | 精确匹配 | 1（最高） |
| `location ^~ /static/` | 前缀匹配，命中后不再查正则 | 2 |
| `location ~ \.php$` | 正则匹配（区分大小写） | 3 |
| `location ~* \.(jpg|png)$` | 正则匹配（不区分大小写） | 3 |
| `location /images/` | 普通前缀匹配 | 4（最低，走最长前缀） |

记忆口诀：**精确（`=`）＞ 前缀阻断（`^~`）＞ 正则（`~`/`~*`，按书写顺序）＞ 普通前缀（谁长听谁）。**

include 拆分管理（生产规范）：站点多了全塞 nginx.conf 没法维护。标准做法：**主配置只留公共部分，每个站点一个文件**——改一个站点不影响别人，迁移时整个目录拷走：

```nginx
# nginx.conf 的 http 块末尾加一行
http {
    ...
    include /etc/nginx/conf.d/vhost/*.conf;    # 源码安装对应 /usr/local/nginx/conf/vhost/*.conf
}
```

```bash
mkdir -p /etc/nginx/conf.d/vhost
vim /etc/nginx/conf.d/vhost/oa.conf      # OA 系统站点
vim /etc/nginx/conf.d/vhost/shop.conf    # 商城系统站点
```

### 4. 静态站点与下载站

root 是"拼接"、alias 是"替换"；生产建议优先用 `root`，语义清晰不易踩坑（区别见实验四）。

文件下载站完整配置（autoindex 三件套 + 大文件提速）：

```nginx
server {
    listen       80;
    server_name  file.example.com;

    location / {
        root   /data/fileserver;
        index  index.html;
    }

    location /download/ {               # 下载目录：开启目录浏览
        alias           /data/files/;
        autoindex       on;              # 目录索引
        autoindex_exact_size off;        # 大小显示为 KB/MB
        autoindex_localtime on;          # 显示本地时间
        charset         utf-8;           # 中文目录名不乱码
    }

    location ~* \.(zip|tar\.gz|iso)$ {   # 单个大文件下载提速
        root       /data/files;
        sendfile   on;                   # 零拷贝，不占用户态内存
        tcp_nopush on;                   # 包攒满再发
    }
}
```

### 5. 虚拟主机三种方式

一台服务器跑多个站点，靠**域名、端口、IP** 三种方式区分——云平台单机多站点场景标配。生产 **90% 用域名方式**（做法见实验五）：一个 IP、一个 80/443 端口，靠域名分流，最省资源、最好维护。

基于端口（内网测试、没有域名时用；生产对外站点尽量不用非标端口）：

```nginx
server {
    listen       8080;                # 访问 http://IP:8080
    server_name  _;
    root /data/www/site1;
}
server {
    listen       8090;                # 访问 http://IP:8090
    server_name  _;
    root /data/www/site2;
}
```

基于 IP（服务器需配多 IP）：

```nginx
server {
    listen       192.168.10.11:80;    # 绑定第一个 IP
    server_name  _;
    root /data/www/site1;
}
server {
    listen       192.168.10.12:80;    # 绑定第二个 IP
    server_name  _;
    root /data/www/site2;
}
```

### 6. 反向代理与负载均衡

生产模板（真实 IP 透传三件套 + 超时三件套 + 失败转移）：

```nginx
server {
    listen       80;
    server_name  app.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;

        # 把真实信息传给后端
        proxy_set_header Host              $host;            # 保留原域名
        proxy_set_header X-Real-IP         $remote_addr;     # 真实客户端 IP
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;

        # 超时参数
        proxy_connect_timeout 5s;          # 连后端超时
        proxy_send_timeout    60s;         # 发请求超时
        proxy_read_timeout    60s;         # 等响应超时（后端慢接口要调大）

        # 失败转移
        proxy_next_upstream error timeout http_502 http_503;
    }
}
```

**为什么要传 X-Real-IP**：不加的话后端日志里全是 Nginx 的 IP，看不到真实用户，排障和安全审计全瞎。后端程序从 `X-Forwarded-For` 取第一个值即可。

WebSocket 支持（管理控制台、实时推送类系统必须加 `Upgrade` 头，否则握手直接失败）：

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;            # 长连接，超时要放大
}
```

upstream 生产模板：

```nginx
upstream backend_pool {
    # 健康检查：30 秒内失败 3 次踢下线，30 秒后再给机会
    server 192.168.10.21:8080 max_fails=3 fail_timeout=30s;
    server 192.168.10.22:8080 max_fails=3 fail_timeout=30s;
    # 权重方式（性能好的多分流量）：server ...:8080 weight=3;
    # ip_hash 方式（同一 IP 固定打同一台，会话保持用）：单独一行 ip_hash;

    keepalive 64;       # 与后端保持长连接池，减少握手开销
}

server {
    listen       80;
    server_name  app.example.com;

    location / {
        proxy_pass http://backend_pool;    # 注意：这里换成了池名
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_connect_timeout 5s;
        proxy_read_timeout    60s;
    }
}
```

| 策略 | 写法 | 适用场景 |
|------|------|----------|
| 轮询（默认） | 什么都不写 | 后端机器配置一致 |
| 权重 | `weight=3` | 机器性能不均，强的多干活 |
| ip_hash | `ip_hash;` | 后端有本地 Session、不能漂移的旧系统 |

**注意**：`ip_hash` 解决会话但不利于故障转移，新系统建议后端用 Redis 共享 Session，负载均衡继续用轮询。

### 7. HTTPS

正式证书上线流程（证书两个文件：xxx.pem 证书 + xxx.key 私钥）：

```bash
mkdir -p /etc/nginx/ssl
cp www.example.com.pem www.example.com.key /etc/nginx/ssl/
chmod 600 /etc/nginx/ssl/*      # 私钥权限收紧
```

```nginx
server {
    listen       443 ssl;
    server_name  app.example.com;

    ssl_certificate      /etc/nginx/ssl/www.example.com.pem;
    ssl_certificate_key  /etc/nginx/ssl/www.example.com.key;
    ssl_protocols        TLSv1.2 TLSv1.3;        # 只留安全协议
    ssl_ciphers          HIGH:!aNULL:!MD5;        # 加密套件
    ssl_session_cache    shared:SSL:10m;          # 会话缓存，减少重复握手
    ssl_session_timeout  10m;

    location / {
        proxy_pass http://backend_pool;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

HTTP 强制跳转 HTTPS（带上原路径，用户无感）：

```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;
}
```

自签证书（内网测试用；浏览器会提示"不安全"，手动信任即可，**仅限测试环境**；对外生产必须用 CA 签发的正式证书，云平台一般有统一证书申请渠道）：

```bash
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/test.key \
  -out /etc/nginx/ssl/test.crt \
  -subj "/CN=192.168.10.11"
```

### 8. 日志管理

生产日志格式（多了 rt/urt 两个耗时字段）：

```nginx
# http 块里定义日志格式
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time urt=$upstream_response_time';

access_log  /var/log/nginx/access.log  main;
error_log   /var/log/nginx/error.log   warn;   # 只记 warn 以上
```

| 变量 | 含义 |
|------|------|
| `$remote_addr` | 客户端 IP（用户真实来源） |
| `$request` / `$status` | 请求行 / 状态码（200/404/502…） |
| `$request_time` | Nginx 处理总耗时 |
| `$upstream_response_time` | **后端响应耗时**（区分"用户慢"还是"后端慢"的关键） |

`error_log` 级别：`debug < info < notice < warn < error < crit`，生产一般 `warn`；排查时临时改 `debug`（日志量暴增，排查完记得改回）。

logrotate 切割（`/etc/logrotate.d/nginx`）：

```
/var/log/nginx/*.log {
    daily                    # 每天切割
    rotate 30                 # 保留 30 份
    missingok                 # 日志不存在不报错
    notifempty                # 空文件不切割
    dateext                   # 文件名带日期（access.log-20260815）
    compress                  # 旧日志 gzip 压缩
    sharedscripts             # 多个日志只执行一次脚本
    postrotate
        [ -f /run/nginx.pid ] && kill -USR1 $(cat /run/nginx.pid)
    endscript
}
```

`kill -USR1` 让 Nginx 重新打开日志句柄，**不能重启 Nginx**（会断服务），必须用这个信号。

awk 三板斧（定位思路：**先看状态码分布 → 再看 TOP IP → 最后看慢请求**，三步基本能锁定问题）：

```bash
# 1. TOP 10 来源 IP（判断刷量/攻击）
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

# 2. 被请求最多的 URL（找出热点接口）
awk '{print $7}' access.log | sort | uniq -c | sort -rn | head -10

# 3. 各状态码数量（一眼看出有多少 502/404）
awk '{print $9}' access.log | sort | uniq -c | sort -rn

# 4. 响应超过 3 秒的慢请求（后端性能定位）
awk '$NF > 3 {print $0}' access.log | head -20
```

### 9. 性能优化

核心参数：

```nginx
worker_processes  auto;            # main 块：自动按 CPU 核数起 worker
worker_rlimit_nofile 65535;        # worker 能打开的最大文件数

events {
    use epoll;                     # Linux 事件模型
    worker_connections 10240;      # 单 worker 最大连接数
}

http {
    sendfile      on;              # 零拷贝发文件，静态站必开
    tcp_nopush    on;              # 包攒满再发，配 sendfile 用
    keepalive_timeout  65;         # 长连接保持 65 秒，减少重复建连
    keepalive_requests 1000;       # 单连接最多处理 1000 个请求

    gzip  on;                      # gzip 压缩：文本体积砍 60% 以上
    gzip_min_length   1k;          # 小于 1k 不压（压了反而大）
    gzip_comp_level   5;           # 压缩级别 1-9，5 是性价比之选
    gzip_types  text/css application/javascript application/json text/xml;

    location ~* \.(css|js|jpg|png|gif|ico|woff2)$ {   # 静态资源缓存 30 天
        root    /data/www;
        expires 30d;
    }
}
```

内核参数（`/etc/sysctl.conf`）：

```bash
net.core.somaxconn = 32768        # 全连接队列长度，默认 128 太小
net.ipv4.tcp_max_syn_backlog = 8192    # 半连接队列
net.ipv4.ip_local_port_range = 1024 65000   # Nginx 当代理时的出口端口范围

sysctl -p                        # 立即生效
```

`somaxconn` 默认只有 128，高并发时请求直接被内核丢弃、用户看到超时，**这是新手最容易忽略的生产瓶颈**。

压测验证：

```bash
# ab 压测（-c 并发数 -n 总请求数）
ab -c 500 -n 10000 http://192.168.10.11/
# 看三个指标：Requests per second（吞吐量）、Time per request（单请求耗时）、
# Failed requests（失败数，必须为 0）
```

### 10. 访问控制与防护

IP 黑白名单（**规则按顺序匹配，命中即停**：先写的先生效，所以必须"白名单在前、`deny all` 在后"）：

```nginx
# 场景一：管理后台只允许内网访问（放行白名单 + deny all）
location /admin/ {
    allow 192.168.10.0/24;
    allow 10.130.0.0/16;
    deny all;
    proxy_pass http://127.0.0.1:8080;
}

# 场景二：封禁攻击 IP
location / {
    deny 203.0.113.50;
    allow all;
    root /data/www;
}
```

Basic Auth 密码保护：

```bash
yum install -y httpd-tools        # 安装工具
# 创建账号密码（-c 是新建文件；加第二个用户时不要再带 -c，否则覆盖）
htpasswd -cb /etc/nginx/.htpasswd admin 'Admin@123'
htpasswd -b  /etc/nginx/.htpasswd ops 'Ops@123'
```

```nginx
location /admin/ {
    auth_basic "Restricted";     # 提示语
    auth_basic_user_file /etc/nginx/.htpasswd;
    root /data/www;
}
```

限流（防刷接口）与防盗链（防别的网站盗用你的图）——生产常用补充：

```nginx
# http 块：按 IP 限速，每秒 10 个请求
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

server {
    location /login/ {
        limit_req zone=one burst=20 nodelay;    # 登录接口限流，突发容忍 20 个
    }
    location ~* \.(jpg|png|mp4)$ {
        valid_referers none blocked server_names *.example.com;   # 允许的来源
        if ($invalid_referer) {
            return 403;    # 非授权来源盗链，直接 403
        }
    }
}
```

### 11. 故障排查

502 Bad Gateway（本质：**Nginx 连不上后端**，套路见实验八）排查顺序：

```bash
# 1. 后端进程还在吗？（最常见：Tomcat/PHP 挂了）
ps -ef | grep java
ss -tlnp | grep 8080          # 原版命令用 netstat；若提示命令不存在=没装 net-tools，用 ss 代替
# 2. 后端端口能通吗？
curl -I http://127.0.0.1:8080
# 3. 看 Nginx 错误日志，有明确原因
tail -20 /var/log/nginx/error.log
```

常见原因：

- **`Connection refused`**：后端挂了 / `proxy_pass` 端口写错 / 后端只监听 127.0.0.1（改 0.0.0.0）
- **`No route to host`**：网络不通 / 对端防火墙没放行
- **SELinux 拦截**：源码装在非标端口常见，临时 `setenforce 0` 验证后配策略或 `setsebool -P httpd_can_network_connect 1`
- **`upstream sent too big header`**：响应头太大，加 `proxy_buffer_size 32k; proxy_buffers 4 32k;`

504 Gateway Timeout（本质：**连上了后端，但它在超时时间内没回话**）：

```bash
# 1. 确认是全站 504 还是个别接口
grep 504 access.log | tail -5
# 2. 个别接口慢 → 后端应用问题（慢 SQL、外部调用卡住），去应用日志找对应请求
# 3. 全站 504 → 后端整体过载，或超时设置太短
```

```nginx
# 治标：慢业务接口单独放大超时；治本：优化后端（加缓存/加机器/SQL 加索引）
location /report/ {
    proxy_pass http://backend_pool;
    proxy_read_timeout 300s;       # 报表类慢接口给 5 分钟
}
```

端口占用（启动报 `bind() failed (98: Address already in use)`）：

```bash
ss -tlnp | grep :80                 # 看谁占了 80
pkill nginx && nginx                # 情况一：起了两个 Nginx（进程残留）
systemctl stop httpd; systemctl disable httpd    # 情况二：别的程序占了（如 httpd）
```

负载高排查（top + netstat 组合拳）：

```bash
top    # 关注 load average（超 CPU 核数就紧张）；nginx 吃 CPU 高 → 看性能优化一节

netstat -n | awk '/^tcp/ {print $NF}' | sort | uniq -c
# TIME_WAIT 大 → 正常；SYN_RECV 大 → 疑似 SYN 攻击开 SYN Cookies；ESTABLISHED 数万 → 查是否被刷

netstat -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head
# 异常 IP 直接 deny 掉（见访问控制一节）
```

常见问题速查表：

| 现象 | 第一反应 |
|------|----------|
| 502 | 后端挂没挂？`error.log` 看真实原因 |
| 504 | 哪个接口超时？后端慢还是超时设短了 |
| 403 / 404 | 403 查文件权限/SELinux/无 index；404 查 root 路径与 location 匹配 |
| 页面打开慢 | gzip 开了吗？看 `$upstream_response_time` 分清前后端 |

### 12. 生产上线 Checklist

上线前逐项打勾，能避开 90% 的生产事故：

| # | 检查项 | 命令/操作 | 通过标准 |
|---|--------|-----------|----------|
| 1 | 配置检查与平滑重载 | `nginx -t` 通过后再 `reload` | 服务无中断，新配置生效 |
| 2 | HTTPS 证书 | 443 配置 + 证书有效期 | 浏览器无告警，剩余 >30 天 |
| 3 | HTTP 强制跳转 | 访问 80 自动 301 到 443 | 跳转后路径完整保留 |
| 4 | 真实 IP 透传 | 查后端日志来源 IP | 看到用户 IP 而非 Nginx IP |
| 5 | 日志切割 | `/etc/logrotate.d/nginx` | `logrotate -f` 手动验证能切 |
| 6 | 后端健康检查 | upstream 配 max_fails | 摘掉一台后端，请求自动转移 |
| 7 | 端口与防火墙 | `ss -tlnp` + firewalld 规则 | 只开必要端口，其余拒绝 |
| 8 | 开机自启 | `systemctl enable nginx` | `is-enabled` 返回 enabled |
| 9 | 内核参数调优 | somaxconn 等已生效 | `sysctl -a \| grep somaxconn` 确认 |
| 10 | 压测验证 | `ab -c 500 -n 10000` | 无失败请求，QPS 达标 |
| 11 | 配置备份 | vhost + nginx.conf 归档 | 每次变更备份，留存可回滚 |
| 12 | 监控告警 | 状态监控 + 证书到期告警 | 502/504、证书 <30 天有告警 |

**最后三条军规**：

1. **改配置必 `nginx -t`**，过不了测试绝不 reload
2. **变更前先备份**，`cp nginx.conf nginx.conf.$(date +%F).bak`，出事能秒回滚
3. **日志是第一现场**，出问题先 `tail error.log`，而不是瞎猜乱重启

> AI生成
