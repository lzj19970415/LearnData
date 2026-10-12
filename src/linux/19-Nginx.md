---
title: Nginx 从入门到生产实战
category: Linux进阶
tags:
  - Linux
  - Nginx
  - Web服务
---

> 面向生产实战的 Nginx 学习笔记，覆盖安装、配置、虚拟主机、反向代理、负载均衡、HTTPS、日志、优化与排障，读完可直接上手。

## 一、Nginx 是什么

Nginx 是高性能的 **HTTP 服务器**和**反向代理服务器**，采用事件驱动模型（epoll），内存占用极低却能支撑数万并发连接。

### 1.1 两个核心角色

- **Web 服务器**：直接对外提供静态文件（HTML/CSS/JS/图片）
- **反向代理**：站在后端业务服务器前面，把用户请求转发给后端再返回结果，同时承担负载均衡、HTTPS 卸载、缓存等职责

### 1.2 正向代理 vs 反向代理

- **正向代理**：代理**客户端**，服务器不知道真实用户是谁（如办公网出口代理）
- **反向代理**：代理**服务端**，用户不知道真实后端是谁（生产标配架构）

### 1.3 为什么生产都选 Nginx（对比 Apache）

| 对比项 | Nginx | Apache |
|--------|-------|--------|
| 并发模型 | 事件驱动（异步非阻塞），几万并发轻松 | 每连接一个进程/线程，并发高时开销大 |
| 反向代理/负载均衡 | 原生支持，功能强大 | 需模块，性能一般 |
| 静态文件 | 极快，高并发优势明显 | 一般 |
| 动态语言 | 交给后端（php-fpm、Tomcat），各司其职 | 可内置模块处理 |

生产典型架构：**Nginx 做统一入口，后面挂静态资源、Tomcat、PHP、业务网关**——云平台 Web 控制台、业务系统前端基本都是这个模式。

## 二、安装部署

### 2.1 yum 安装（推荐）

```bash
cat > /etc/yum.repos.d/nginx.repo << 'EOF'
[nginx-stable]
name=nginx stable repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=1
enabled=1
gpgkey=https://nginx.org/keys/nginx_signing.key
EOF

yum install -y nginx    # 或直接用系统自带源（版本较老但稳定）
```

### 2.2 源码编译（需要定制模块时用）

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

### 2.3 目录结构

```bash
[root@web ~]# tree /usr/local/nginx
/usr/local/nginx
├── conf/     # 配置目录（nginx.conf 主配置、mime.types 类型映射）
├── html/     # 默认站点目录（index.html、50x.html）
├── logs/     # 日志目录（access.log / error.log / nginx.pid）
└── sbin/     # 可执行文件
```

### 2.4 systemd 服务管理

```bash
# 源码安装需先写服务文件（yum 安装自带）
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
systemctl status nginx       # 查看运行状态
```

### 2.5 日常管理命令

```bash
nginx -t              # 检查配置语法（改完配置必做！）
nginx                 # 启动
nginx -s reload       # 平滑重载（不中断服务，生产改配置就用它）
nginx -s stop          # 立即停止；-s quit 优雅停止（处理完存量请求再停）
nginx -V              # 查看版本和编译参数
```

**生产铁律**：改完配置先 `nginx -t`，输出 `successful` 再 `reload`；reload 是平滑的，老 worker 处理完存量请求才退出，用户无感知。

## 三、配置文件结构

### 3.1 层级关系

```nginx
worker_processes  auto;         # ===== main 块：进程数、全局日志、运行用户 =====
error_log  /var/log/nginx/error.log warn;

events {                        # ===== events 块：连接相关 =====
    worker_connections  10240;
    use epoll;
}

http {                          # ===== http 块：HTTP 服务全局 =====
    server {                    # ===== server 块：一个虚拟主机（站点） =====
        listen       80;
        server_name  www.example.com;

        location / {            # ===== location 块：URL 匹配规则 =====
            root   /data/www;
            index  index.html;
        }
    }
}
```

层级：**main → events → http → server → location**，`http` 里可以有多个 `server`，`server` 里可以有多个 `location`。

### 3.2 location 匹配规则与优先级

| 语法 | 含义 | 优先级 |
|------|------|--------|
| `location = /login` | 精确匹配 | 1（最高） |
| `location ^~ /static/` | 前缀匹配，命中后不再查正则 | 2 |
| `location ~ \.php$` | 正则匹配（区分大小写） | 3 |
| `location ~* \.(jpg|png)$` | 正则匹配（不区分大小写） | 3 |
| `location /images/` | 普通前缀匹配 | 4（最低，走最长前缀） |

**记忆口诀**：精确（`=`）＞ 前缀阻断（`^~`）＞ 正则（`~`/`~*`，按书写顺序）＞ 普通前缀（谁长听谁）。

```nginx
server {
    listen 80;
    location = /health {              # 精确匹配：健康检查接口
        return 200 "ok";
    }
    location ^~ /static/ {            # 前缀阻断：静态资源目录
        root /data/www;
        expires 7d;
    }
    location ~* \.(html|css|js)$ {    # 正则：静态文件后缀
        root /data/www;
    }
    location /api/ {                  # 普通前缀：其余交给后端
        proxy_pass http://127.0.0.1:8080;
    }
}
```

### 3.3 include 拆分管理（生产规范）

站点多了全塞 nginx.conf 没法维护。生产标准做法：**主配置只留公共部分，每个站点一个文件**——改一个站点不影响别人，迁移时整个目录拷走。

```nginx
# nginx.conf 的 http 块末尾加一行
http {
    ...
    include /usr/local/nginx/conf/vhost/*.conf;
}
```

```bash
mkdir -p /usr/local/nginx/conf/vhost
vim /usr/local/nginx/conf/vhost/oa.conf      # OA 系统站点
vim /usr/local/nginx/conf/vhost/shop.conf    # 商城系统站点
```

## 四、静态站点

### 4.1 root 与 alias 的区别

```nginx
location /download/ {
    root /data/www;       # root 拼接：真实路径 = root + URL → /data/www/download/x.zip
}
location /download/ {
    alias /data/file/;    # alias 替换：location 部分被替换 → /data/file/x.zip
}
```

`root` 是"拼接"，`alias` 是"替换"；生产建议优先用 `root`，语义清晰不易踩坑。

### 4.2 文件下载站完整配置

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

## 五、虚拟主机

一台服务器跑多个站点，靠**域名、端口、IP** 三种方式区分——云平台单机多站点场景标配。

### 5.1 基于域名（最常用）

```nginx
# /usr/local/nginx/conf/vhost/oa.conf
server {
    listen       80;
    server_name  oa.example.com;       # OA 系统
    root /data/www/oa;                  # root 也可直接写在 server 级
    index index.html;
}
# /usr/local/nginx/conf/vhost/shop.conf —— 端口相同、域名不同（前提：域名都解析到本机）
server {
    listen       80;
    server_name  shop.example.com;     # 商城系统
    root /data/www/shop;
    index index.html;
}
```

### 5.2 基于端口

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

适合内网测试、没有域名时用；生产对外站点尽量不用非标端口。

### 5.3 基于 IP

```nginx
server {
    listen       192.168.10.11:80;    # 绑定第一个 IP（服务器需配多 IP）
    server_name  _;
    root /data/www/site1;
}
server {
    listen       192.168.10.12:80;    # 绑定第二个 IP
    server_name  _;
    root /data/www/site2;
}
```

实际生产 **90% 用域名方式**：一个 IP、一个 80/443 端口，靠域名分流，最省资源、最好维护。

## 六、反向代理与负载均衡

### 6.1 反向代理基础（proxy_pass）

最典型场景：Nginx 前面收 80，后端 Tomcat 跑 8080。

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

### 6.2 WebSocket 支持

管理控制台、实时推送类系统（堡垒机页面、监控大盘）用 WebSocket，必须加 `Upgrade` 头，否则握手直接失败：

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;            # 长连接，超时要放大
}
```

### 6.3 负载均衡（upstream）

```nginx
# 定义后端服务器池
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

## 七、HTTPS 配置

### 7.1 证书配置全流程

```bash
mkdir -p /usr/local/nginx/conf/ssl     # 证书两个文件：xxx.pem 证书 + xxx.key 私钥
cp www.example.com.pem www.example.com.key /usr/local/nginx/conf/ssl/
chmod 600 /usr/local/nginx/conf/ssl/*      # 私钥权限收紧
```

```nginx
server {
    listen       443 ssl;
    server_name  app.example.com;

    ssl_certificate      /usr/local/nginx/conf/ssl/www.example.com.pem;
    ssl_certificate_key  /usr/local/nginx/conf/ssl/www.example.com.key;
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

### 7.2 HTTP 强制跳转 HTTPS

```nginx
server {
    listen 80;
    server_name app.example.com;
    return 301 https://$host$request_uri;    # 带上原路径，用户无感跳转
}
```

### 7.3 自签证书（内网测试用）

```bash
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /usr/local/nginx/conf/ssl/test.key \
  -out /usr/local/nginx/conf/ssl/test.crt \
  -subj "/CN=192.168.10.11"
```

自签证书浏览器会提示"不安全"，手动信任即可，**仅限测试环境**；对外生产必须用 CA 签发的正式证书（云平台一般有统一证书申请渠道）。

## 八、日志管理

### 8.1 两类日志

```nginx
# http 块里定义日志格式
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time urt=$upstream_response_time';

access_log  /usr/local/nginx/logs/access.log  main;
error_log   /usr/local/nginx/logs/error.log   warn;   # 只记 warn 以上
```

| 变量 | 含义 |
|------|------|
| `$remote_addr` | 客户端 IP（用户真实来源） |
| `$request` / `$status` | 请求行 / 状态码（200/404/502…） |
| `$request_time` | Nginx 处理总耗时 |
| `$upstream_response_time` | **后端响应耗时**（区分"用户慢"还是"后端慢"的关键） |

`error_log` 级别：`debug < info < notice < warn < error < crit`，生产一般 `warn`；排查时临时改 `debug`（日志量暴增，排查完记得改回）。

### 8.2 logrotate 切割

```bash
# /etc/logrotate.d/nginx
/usr/local/nginx/logs/*.log {
    daily                    # 每天切割
    rotate 30                # 保留 30 份
    missingok                # 日志不存在不报错
    notifempty               # 空文件不切割
    dateext                  # 文件名带日期（access.log-20260815）
    compress                 # 旧日志 gzip 压缩
    sharedscripts            # 多个日志只执行一次脚本
    postrotate
        [ -f /usr/local/nginx/logs/nginx.pid ] && kill -USR1 $(cat /usr/local/nginx/logs/nginx.pid)
    endscript
}
```

`kill -USR1` 让 Nginx 重新打开日志句柄，**不能重启 Nginx**（会断服务），必须用这个信号。

### 8.3 日志分析思路（awk 三板斧）

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

定位思路：**先看状态码分布 → 再看 TOP IP → 最后看慢请求**，三步基本能锁定问题。

## 九、性能优化

### 9.1 核心参数

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

### 9.2 内核参数（/etc/sysctl.conf）

```bash
net.core.somaxconn = 32768        # 全连接队列长度，默认 128 太小
net.ipv4.tcp_max_syn_backlog = 8192    # 半连接队列
net.ipv4.ip_local_port_range = 1024 65000   # Nginx 当代理时的出口端口范围

sysctl -p                        # 立即生效
```

`somaxconn` 默认只有 128，高并发时请求直接被内核丢弃、用户看到超时，**这是新手最容易忽略的生产瓶颈**。

### 9.3 压力测试验证

```bash
# ab 压测（-c 并发数 -n 总请求数）
ab -c 500 -n 10000 http://192.168.10.11/
# 看三个指标：Requests per second（吞吐量）、Time per request（单请求耗时）、
# Failed requests（失败数，必须为 0）
```

## 十、访问控制

### 10.1 IP 黑白名单

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

**规则按顺序匹配，命中即停**：先写的先生效，所以必须"白名单在前、`deny all` 在后"。

### 10.2 Basic Auth 密码保护

```bash
yum install -y httpd-tools        # 安装工具
# 创建账号密码（-c 是新建文件；加第二个用户时不要再带 -c，否则覆盖）
htpasswd -cb /usr/local/nginx/conf/.htpasswd admin 'Admin@123'
htpasswd -b  /usr/local/nginx/conf/.htpasswd ops 'Ops@123'
```

```nginx
location /admin/ {
    auth_basic "Restricted";     # 提示语
    auth_basic_user_file /usr/local/nginx/conf/.htpasswd;
    root /data/www;
}
```

## 十一、故障排查

### 11.1 502 Bad Gateway（Nginx 连不上后端）

**本质：Nginx 到后端这一段出了问题。** 按顺序排查：

```bash
# 1. 后端进程还在吗？（最常见：Tomcat/PHP 挂了）
ps -ef | grep java
netstat -tlnp | grep 8080
# 2. 后端端口能通吗？
curl -I http://127.0.0.1:8080
telnet 127.0.0.1 8080
# 3. 看 Nginx 错误日志，有明确原因
tail -20 /usr/local/nginx/logs/error.log
```

常见原因：

- **`Connection refused`**：后端挂了 / `proxy_pass` 端口写错 / 后端只监听 127.0.0.1（改 0.0.0.0）
- **`No route to host`**：网络不通 / 对端防火墙没放行
- **SELinux 拦截**：源码装在非标端口常见，临时 `setenforce 0` 验证后配策略
- **`upstream sent too big header`**：响应头太大，加 `proxy_buffer_size 32k; proxy_buffers 4 32k;`

### 11.2 504 Gateway Timeout（后端太慢）

**本质：连上了后端，但它在超时时间内没回话。**

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

### 11.3 配置语法错误

```bash
nginx -t
# [emerg] unexpected "}" in .../vhost/oa.conf:15  ← 报错定位到 文件:行号
# 多半是少分号、少大括号、中文引号
```

**没有 `nginx -t` 通过之前绝不 reload**；reload 失败不影响存量服务（新配置不生效），修正后重试即可。

### 11.4 端口占用

```bash
# 启动报错 bind() failed (98: Address already in use)
ss -tlnp | grep :80                 # 看谁占了 80
pkill nginx && nginx                # 情况一：起了两个 Nginx（进程残留）
systemctl stop httpd; systemctl disable httpd    # 情况二：别的程序占了（如 httpd）
```

### 11.5 负载高排查（top + netstat 组合拳）

```bash
top    # 关注 load average（超 CPU 核数就紧张）；nginx 吃 CPU 高 → 看第九章优化

netstat -n | awk '/^tcp/ {print $NF}' | sort | uniq -c
# TIME_WAIT 大 → 正常；SYN_RECV 大 → 疑似 SYN 攻击开 SYN Cookies；ESTABLISHED 数万 → 查是否被刷

netstat -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head
# 异常 IP 直接 deny 掉（见第十章）
```

### 11.6 常见问题速查表

| 现象 | 第一反应 |
|------|----------|
| 502 | 后端挂没挂？`error.log` 看真实原因 |
| 504 | 哪个接口超时？后端慢还是超时设短了 |
| 403 / 404 | 403 查文件权限/SELinux/无 index；404 查 root 路径与 location 匹配 |
| 页面打开慢 | gzip 开了吗？看 `$upstream_response_time` 分清前后端 |

## 十二、生产上线 Checklist

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