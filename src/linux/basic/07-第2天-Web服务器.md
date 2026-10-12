---
title: Web服务器（Apache/Nginx）
category: Linux基础
tags:
  - Linux
  - Apache
  - Nginx
---

# Web服务器（Apache/Nginx）

本篇覆盖 Web 服务基础（HTTP/HTTPS、工作原理）、Apache 与 Nginx 的搭建与常用配置（虚拟主机、rewrite、日志、防盗链、访问控制）、Web 中间件、LNMP/LAMP 架构，并以 LNMP 搭建 WordPress 为综合实战。

## Web 服务基础

### 什么是 Web 服务器

- 最主流的三大 Web 服务器：**Apache、Nginx、IIS**。
- Web 服务器是驻留在服务器上的**被动程序**：只有浏览器发起请求时才响应。
- 服务器通过 **HTTP（超文本传输协议）** 与浏览器交流，因此也叫 HTTP 服务器。
- 能存储信息、放置网站文件供浏览/下载，也能在用户请求基础上运行脚本和程序（动态内容）。

### HTTP 与 HTTPS

- 应用层使用 HTTP 协议；HTML 是文档格式；浏览器通过 **URL** 定位资源。
- **HTTPS = HTTP + SSL**：为解决 HTTP 明文传输的安全缺陷，加入 SSL 协议——**依靠证书验证服务器身份**，并对浏览器与服务器之间的通信加密。
- WWW 采用**浏览器/服务器（B/S）**结构。

### Web 服务器与应用服务器的区别

| 对比项 | Web 服务器 | 应用服务器 |
| --- | --- | --- |
| 处理对象 | **专门处理 HTTP 请求**，返回静态页面/图片、跳转，或把动态响应委托给 CGI/JSP/ASP 等程序 | 通过多种协议为应用提供**商业逻辑（business logic）**，支持事务处理、数据库连接池、消息 |
| 典型代表 | Apache、Nginx、IIS | Tomcat、WebLogic、JBoss |

- Web 服务器只提供"执行服务器端程序并返回响应"的环境，不会超出职能范围。
- 负载均衡、缓存等容错与可扩展特性，Web 服务器同样可以配置实现（并非应用服务器专属）。

### Web 服务器工作原理（四步骤）

1. **连接过程**：浏览器与服务器建立连接（成功即建立 socket 虚拟文件）。
2. **请求过程**：浏览器通过 socket 向服务器提出各种请求。
3. **应答过程**：HTTP 把请求传到服务器处理，结果再经 HTTP 传回浏览器展示。
4. **关闭连接**：应答完成后断开连接。

四步环环相扣，可支持多进程、多线程及混合技术。

## Apache 与 Nginx

### Apache 特点

- 世界使用排名第一（课件时期市场占有率约 60%），名字取自 "a patchy server"（充满补丁的服务器）。
- 简单、速度快、性能稳定，可做代理服务器；源码开放、跨平台（几乎所有 UNIX/Linux/Windows）。
- 特性：支持 http/1.1、基于文件的配置（httpd.conf）、CGI、虚拟主机、HTTP 认证、集成 Perl/代理、SSI、SSL、FastCGI、Java Servlets、自定义日志、用户会话跟踪。

### Nginx 特点

- 俄罗斯人 Igor Sysoev 开发（engine X），高性能 **HTTP 服务器 + 反向代理服务器**，兼做 IMAP/POP3/SMTP 代理。
- **事件驱动**编写，性能极佳；支持内核 Poll 模型，官方数据可支持 5 万并发连接。
- **分阶段资源分配**技术使 CPU/内存占用极低：保持 1 万个无活动连接只占 2.5M 内存，抗 DOS/慢速连接攻击。
- **支持热部署**：可 7×24 不间断运行，不停止服务即可升级版本。
- 不支持 CGI 方式运行（减少漏洞），执行 PHP 必须用 **FastCGI** 方式。

### Apache vs Nginx 选型

| 维度 | Nginx 相对 Apache |
| --- | --- |
| 高并发 | 单台万级并发（静态页 30000-50000/s），表现优秀 |
| 反向代理 | 性能好，可用于负载均衡 |
| 资源占用 | 内存/CPU 约为 Apache 的 1/5-1/10 |
| 功能 | 较少（常用功能均有）；PHP 走 CGI/FastCGI，无模块编译加载方式 |

**总结**：
- **Apache**：模块组件丰富、稳定性强、BUG 少、**动态内容处理强**。
- **Nginx**：轻量级、占用资源少、**高并发与静态内容处理强**、负载均衡。

## Web 中间件

### 概念

- 中间件是**系统软件与应用软件之间**的连接软件，将应用运行环境与操作系统隔离；容器就是中间件的一种（是一类软件的总称，不是单个软件）。
- 一次 Web 访问顺序：**Web 浏览器 → 服务器（硬件）→ Web 容器 → Web 应用服务器 → 数据库服务器**。

### Java 中间件

| 中间件 | 简介 | 默认端口 |
| --- | --- | --- |
| **Tomcat** | Apache 基金会 Jakarta 核心项目，轻量级 Servlet 容器，JSP 开发调试首选，独立进程运行 | **8080** |
| **WebLogic** | Oracle 出品的 JavaEE 中间件，用于开发/集成/部署/管理大型分布式应用 | **7001** |
| **JBoss** | 基于 Java EE 的开源应用服务器，既是 Servlet 容器也是 EJB 容器；核心服务不含 WEB 容器，常与 Tomcat/Jetty 绑定 | **8080** |
| **WebSphere** | IBM 软件平台，模块化、基于开放标准，跨平台（Intel/Linux/z/OS） | **9080** |

### Python 中间件（易混淆三个名字）

- **WSGI**：一种实现 Python 解析的**通用接口标准/协议**（类似 Ruby 的 Rack），让 web.py/django 等框架能部署在不同 web server 上。
- **uwsgi**：uWSGI 服务器**自有的通信协议**，定义传输信息的类型（packet 前 4 字节为类型描述），与 WSGI 是两样东西。
- **uWSGI**：一种 **Python Web 服务器/网关**，同时实现了 WSGI、uwsgi、http 等协议；Nginx 的 HttpUwsgiModule 负责与它交换数据。

### PHP 中间件

- **CGI**：通用 Web 标准，可粗略理解为"用任意语言写 Web 程序"的标准。
- **FastCGI**：Web 服务器（如 Nginx）与语言解释器（如 uWSGI/PHP 解释器）之间**底层通信协议规范**，是 CGI 的开放扩展。
- **php-fpm**：PHP FastCGI **进程管理器**——按访问压力动态唤起/销毁 CGI 进程、平滑重载 PHP 配置、走 Unix-Socket 通信（无需配端口）、状态输出和 slowlog 更友好（502 时给出更多细节）。
- Php-FastCGI 流程：Web Server 启动时载入 FastCGI 进程管理器 → 管理器初始化多个 CGI 解释器进程等待连接 → 请求到达时选择一个解释器处理 → 处理完**不退出**，继续等待下一个连接（普通 CGI 模式下 php-cgi 处理完即退出）。

## Apache 服务搭建与配置

### 环境准备与安装

```bash
# 1. 关闭 selinux
vim /etc/selinux/config      # SELINUX=enforcing 改为 disabled
setenforce 0
reboot
sestatus                     # 确认 SELinux status: disabled

# 2. 关闭防火墙
systemctl stop firewalld.service

# 3. 装 epel 源与 httpd
yum -y install epel-release.noarch
yum -y install httpd*
rpm -qa | grep httpd         # 确认安装包
```

### 主配置文件核心参数

```bash
vim /etc/httpd/conf/httpd.conf
```

```text
ServerRoot "/etc/httpd"         # 存放配置文件的目录
Listen 80                       # 监听端口
User apache / Group apache      # 子进程运行用户/组
ServerAdmin root@localhost      # 管理员邮件地址
DocumentRoot "/var/www/html"    # 网站家目录

<Directory "/var/www/html">     # 目录属性容器
    Options Indexes FollowSymLinks  # 找不到主页时以目录列表呈现；允许链接站外
    AllowOverride None              # None 不使用 .htaccess；All 允许
    Require all granted             # granted 允许所有访问；denied 拒绝所有
</Directory>

DirectoryIndex index.html       # 主页文件（按顺序匹配）
AddDefaultCharset UTF-8         # 字符编码（中文网站可能需改 gb2312/gbk）
```

### 启动与验证

```bash
systemctl start httpd.service
lsof -i:80                  # 确认 80 监听（root 主进程 + apache 子进程）
curl 192.168.1.20           # 命令行验证
yum -y install elinks       # 文本浏览器（Ctrl+C 退出）
elinks 192.168.1.20
```

### 配置实例

```bash
# 例1：建立网站主页
echo 'main page' > /var/www/html/index.html
systemctl restart httpd.service
firefox http://192.168.1.20

# 例2：把网站家目录改成 /www
mkdir /www
vim /etc/httpd/conf/httpd.conf
# 第 119 行：DocumentRoot "/www"
# 第 131 行：<Directory "/www">    # 两处必须同步修改，易漏
systemctl restart httpd.service
echo "这是新修改的网站家目录/www" > /www/index.html

# 例3：修改主页类型/名字
vim /etc/httpd/conf/httpd.conf
# 164 行：DirectoryIndex index.php
systemctl reload httpd.service       # reload 或 restart
echo 'php main page' > /www/index.php
```

### 常用命令（apachectl）

```bash
/usr/local/apache2/bin/apachectl -M          # 查看常见模块（动态+静态）
/usr/local/apache2/bin/apachectl -l          # 查看加载的静态模块
/usr/local/apache2/bin/apachectl -t          # 检查配置文件语法错误（改完配置必做）
/usr/local/apache2/bin/apachectl graceful    # 加载新配置但不重启服务
/usr/local/apache2/bin/apachectl start|restart|stop
```

### 用户认证

```bash
# 虚拟主机配置中加认证段
vim /usr/local/apache2/conf/extra/httpd-vhosts.conf
```

```text
<Directory /data/www/abc>
    AllowOverride AuthConfig
    AuthName "cct"
    AuthType Basic
    AuthUserFile /data/.htpasswd      # 存放用户名和密码的文件
    require valid-user
</Directory>
```

```bash
htpasswd -c /data/.htpasswd cct    # -c 首次创建密码文件，指定用户名 cct
/usr/local/apache2/bin/apachectl graceful
```

### 默认虚拟主机

```text
# 将此段放在虚拟主机配置最上面：
<VirtualHost *:80>
    DocumentRoot "/tmp/111"    # 目录可以不存在
    ServerName 111.com
</VirtualHost>
<VirtualHost *:80>
    DocumentRoot "/data/www"
    ServerName www.test.com
    ServerAlias www.aaa.com    # 别名域名
</VirtualHost>
```

> 效果：除已设置域名（test/aaa）外，其余域名访问均跳到 `/tmp/111`。

### rewrite 规则

规则写在 `<IfModule mod_rewrite.c>` 模块下；`RewriteCond` 是跳转条件，`RewriteRule` 是跳转规则。

```text
# 1. 域名 301 跳转（301 永久跳转，302 暂时跳转）
<IfModule mod_rewrite.c>
RewriteEngine on                          # 打开 rewrite 功能
RewriteCond %{HTTP_HOST} ^www.aaa.com$ [OR]
RewriteCond %{HTTP_HOST} ^www.bbb.com$
RewriteRule ^/(.*)$ http://www.test.com/$1 [R=301,L]
</IfModule>

# 2. 禁止指定 user_agent（禁止 curl 和 chrome）
RewriteCond %{HTTP_USER_AGENT} ^.*curl.* [NC,OR]
RewriteCond %{HTTP_USER_AGENT} ^.*chrome.* [NC]
RewriteRule .* - [F]                      # [F] 即禁止（403）

# 3. 禁止访问某目录
RewriteCond %{REQUEST_URI} ^.*/tmp/.* [NC]
RewriteRule .* - [F]
</IfModule>
```

常用标记：`R=301` 强制外部重定向；`[F]` 禁用 URL 返回 403；`NC` 不区分大小写；`[OR]` 或者。

常用变量：
- `%{HTTP_USER_AGENT}`：访问者 UA；
- `%{HTTP_HOST}`：当前访问网址前缀（如 `www.123.com`，不含 http:// 和 /）；
- `%{REQUEST_URI}`：相对根目录的地址（如 `www.123.com/xiang/1.html` 中的 `xiang/1.html`，含最前面的 /）。

### 日志切割与管理

日志路径在 `/usr/local/apache2/logs` 下：

```text
ErrorLog "logs/test.com-error_log"            # 错误日志
CustomLog "logs/test.com-access_log" common   # common 为日志类型

# 主配置中的日志格式定义
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
# %h 来源IP  %u 访问用户  %t 时间  %r 动作
# 用户走代理时 %h 显示代理 IP，加 %{X-FORWARDED-FOR}i 可显示真实 IP
```

**按天切割日志**（用 rotatelogs，86400 秒 = 一天，`%Y%m%d` 年月日）：

```text
CustomLog "|/usr/local/apache2/bin/rotatelogs -l /usr/local/apache2/logs/test.com-access_%Y%m%d_log 86400" combined
```

**不记录指定类型文件**（图片/js/css 减少日志量）：

```text
SetEnvIf Request_URI ".*\.gif$" image-request     # 给 gif 请求打标记
SetEnvIf Request_URI ".*\.jpg$" image-request
SetEnvIf Request_URI ".*\.png$" image-request
SetEnvIf Request_URI ".*\.js$"  image-request
SetEnvIf Request_URI ".*\.css$" image-request
CustomLog "|/usr/local/apache2/bin/rotatelogs -l /usr/local/apache2/logs/test.com-access_%Y%m%d_log 86400" combined env=!image-request
```

> **注意**：`SetEnvIf` 要和 `CustomLog` 写在一起，中间不要有分隔。

### 静态缓存

让图片、html、css、JS 在客户端缓存，减少服务器访问（需先确认支持 `mod_expires.c` 模块）：

```text
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType image/gif  "access plus 1 days"
    ExpiresByType image/jpeg "access plus 24 hours"
    ExpiresByType image/png  "access plus 24 hours"
    ExpiresByType text/css   "now plus 2 hours"
    ExpiresByType application/x-javascript "now plus 2 hours"
    ExpiresDefault "now plus 0 min"
</IfModule>
```

### 防盗链

防止其他网站盗用图片，流量跑掉带宽：

```text
SetEnvIfNoCase Referer "^http://.*\.test\.com" local_ref    # 给本站网址做标注
<filesmatch "\.(txt|png|gif|doc|mp3|zip|rar|jpg|css|js)">   # 限定文件类型
    Order Allow,Deny
    Allow from env=local_ref     # 只允许本站引用
</filesmatch>
```

### 访问控制

```text
# 1. 针对目录禁止某 IP
<Directory "/data/www">
    AllowOverride None
    Options None
    Order allow,deny
    Allow from all
    deny from 192.168.206.1      # 禁止该 IP 访问
</Directory>

# 2. 针对 URI 做限制（URI 中含 admin 的都限制）
<filesmatch "(.*)admin(.*)">
    Order allow,deny
    Allow from all
    Deny from 192.168.206.1
</filesmatch>
```

### 禁止解析 PHP（安全场景）

上传目录禁止解析 PHP，防止上传木马被运行：

```text
<Directory /data/www/data>
    php_admin_flag engine off       # 关闭 PHP 解析引擎
    <filesmatch "(.*)php">
        Order deny,allow
        Deny from all
    </filesmatch>
</Directory>
```

> **易错点**：只设 `engine off` 不加 `filesmatch` 禁止的话，浏览器访问该 php 文件会**把源文件下载下来**，同样有风险，两者要配合使用。

## Nginx 服务搭建与配置

### 安装

```bash
# 环境准备同 Apache：关 selinux、关防火墙、装 epel
# 1. 设置 nginx 官方安装源（方式一：装官方 rpm）
rpm -Uvh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm

# 方式二：手动添加源
vim /etc/yum.repos.d/nginx.repo
```

```ini
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/7/$basearch/
gpgcheck=0
enabled=1
```

```bash
# 2. 安装、启动、开机自启
yum search nginx          # 确认源已添加
yum install -y nginx
systemctl start nginx.service
systemctl enable nginx.service
```

### 配置文件结构

- 主配置文件：`/etc/nginx/nginx.conf`。
- `/etc/nginx/conf.d/` 下存放多个子配置（类似虚拟主机），Nginx 运行时加载进主配置。

### Nginx 支持 PHP（fastcgi 9000 端口）

Nginx 通过 **php-fpm** 通信，需监听 **9000** 端口。在 `/etc/nginx/conf.d/` 下新建配置：

```nginx
server {
    listen       80;
    server_name  admin1.test.com admin.test.com;
    root         /var/www/card/public;
    index        index.php index.html index.htm;

    location / {
        if (!-e $request_filename) {
            rewrite ^(.*)$ /index.php?s=/$1 last;   # 隐藏 URL 中的 index.php
            break;
        }
    }
    location ~ \.php$ {
        fastcgi_pass   127.0.0.1:9000;              # 交给 php-fpm
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }
}
```

### Nginx 反向代理与负载均衡

```nginx
# upstream 定义后端服务器组（weight 为权重）
upstream test {
    server 192.168.68.43:8080 weight=1;
    server 192.168.68.44:8080 weight=1;
}
server {
    listen      80;
    server_name porxy.zxy.com;
    location / {
        proxy_pass http://test;        # 与 upstream 名称一致；单后端可直接写 IP
        proxy_redirect    off;
        proxy_set_header  Host $host;                        # 请求的服务器域名和端口
        proxy_set_header  X-Real-IP $remote_addr;
        proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;  # 后端可获真实 IP

        client_max_body_size       10m;   # 允许客户端请求的最大单文件字节数
        client_body_buffer_size    128k;  # 缓冲用户端请求的最大字节数
        proxy_connect_timeout      300;   # 与后端连接超时
        proxy_send_timeout         300;   # 后端回传数据超时
        proxy_read_timeout         300;   # 连接成功后后端响应时间
        proxy_buffer_size          4k;    # 保存用户头信息的缓冲区
        proxy_buffers              4 32k; # 缓冲区数量与大小
        proxy_busy_buffers_size    64k;   # 高负荷下缓冲大小
        proxy_temp_file_write_size 64k;   # 缓存文件夹大小
    }
}
```

## LA/NMP 架构

### 三种组合对比

| 架构 | 组成 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **LAMP** | Linux+Apache+MySQL+PHP | 动态处理强，约 70% 网站流量由其提供，部署灵活、成本低 | 并发不如 Nginx |
| **LNMP** | Linux+Nginx+MySQL+PHP | 占用资源少，Nginx 配置简单，fastcgi 解析 PHP | php-fpm 负载能力有限，高并发时进程易僵死、易 502 |
| **LNAMP** | Linux+Nginx+Apache+MySQL+PHP | Nginx 处理静态+转发，Apache 处理动态（处理 PHP 能力强于 php-fpm），不易 502，适合大流量 | 占用更多资源；配虚拟主机要同时改 Nginx 和 Apache，稍麻烦 |

各组件：Linux（多用户多任务操作系统）、Apache（主程序 httpd）、Nginx（轻量高并发）、MySQL/MariaDB（MariaDB 是 MySQL 的分支）、PHP（超文本预处理器，脚本嵌入 HTML 执行）。

## MySQL / MariaDB 安装与配置

### MySQL 官方源安装

```bash
yum -y install wget
wget https://repo.mysql.com//mysql57-community-release-el7-11.noarch.rpm
yum -y localinstall mysql57-community-release-el7-11.noarch.rpm   # 装官方 yum 源
yum -y install mysql-community-server mysql    # server 套件已含 client

systemctl start mysqld
systemctl enable mysqld
ls /var/lib/mysql                              # 确认安装

# 获取首次随机密码并登录
grep 'temporary password' /var/log/mysqld.log
mysql -uroot -p'awm3>!QFl6zR'
```

```sql
-- 修改 root 密码（必须符合复杂性：大小写字母+数字+特殊符号，≥8 位）
alter user 'root'@'localhost' identified by 'Qf.123com';
-- 创建库并授权
CREATE DATABASE qfedudb CHARACTER SET utf8 COLLATE utf8_bin;
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP,ALTER,INDEX ON qfedudb.* TO 'qfedu'@'localhost' IDENTIFIED BY 'Yangge.123com';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'qfedu'@'localhost';
```

### MariaDB 安装与初始化

MariaDB 是 MySQL 的**分支**（Oracle 收购 MySQL 后有闭源风险，社区分支规避），完全兼容 MySQL 的 API 和命令行。

```bash
# 1. 配置源
vim /etc/yum.repo.d/mariadb.repo
```

```ini
[mariadb]
name = MariaDB
baseurl = https://mirrors.ustc.edu.cn/mariadb/yum/10.4/centos7-amd64
gpgkey=https://mirrors.ustc.edu.cn/mariadb/yum/RPM-GPG-KEY-MariaDB
gpgcheck=1
```

```bash
# 2. 安装与启停
yum -y install MariaDB-server MariaDB-client
systemctl start mariadb     # stop/restart 同理
systemctl enable mariadb
netstat -ntlp | grep 3306   # 默认监听 3306

# 3. 初始化（安全加固，5 步）
mysql_secure_installation
# Enter current password for root：初次直接回车（默认空）
# Set root password? y → 设密码
# Remove anonymous users? y     # 删除匿名用户
# Disallow root login remotely? 一般 y
# Remove test database? y       # 删除测试库
# Reload privilege tables now? y  # 刷新授权立即生效
```

### 设置 utf8 编码

```ini
# /etc/my.cnf
[mysqld]
init_connect='SET collation_connection = utf8_unicode_ci'
init_connect='SET NAMES utf8'
character-set-server=utf8
collation-server=utf8_unicode_ci
skip-character-set-client-handshake
```

### 基本增删改查（与 MySQL 语法一致）

```sql
set password = PASSWORD('hsz123');              -- 修改当前用户密码
create database test;                            -- 建库（可加 charset=utf8）
use test;
create table mytest(id int, name char(32));      -- 建表
show tables;
desc mytest;                                     -- 看表结构
insert into mytest(id,name) values(1,"zero"),(2,"one");
select id,name from mytest;
delete from mytest where id=2;                   -- 必须带 where（漏了会报语法错）
update mytest set name="ten" where id=1;         -- 字符串值必须加引号
select * from mytest;
```

### 用户与权限（grant）

```sql
create user zero@'%' identified by 'zero';       # 创建用户（% 表示任意主机）
-- grant 权限 on 数据库.表名 to 账户@主机名;
grant all privileges on *.* to username@'%' identified by 'password';  # 全库全表所有权限
grant create on test.* to zero@'%' identified by 'zero';               # 仅 test 库建表权限
drop user one;                                   # 删除用户
flush privileges;                                # 刷新权限
```

### 备份与恢复（mysqldump）

```bash
mysqldump -u root -p --all-databases > /tmp/db.dump   # 备份所有库
mysqldump -u root -p text > /tmp/text.sql             # 备份单个库
mysql -uroot -p text2 < /tmp/text.sql                 # 恢复导入
drop database text;                                    # 删除库
```

## PHP 安装与配置（REMI 源 PHP7.3）

```bash
yum install epel-release
yum install http://rpms.remirepo.net/enterprise/remi-release-7.rpm   # REMI 源
yum install yum-utils                                                # yum 源管理工具

yum install -y php73-php-fpm php73-php-cli php73-php-bcmath php73-php-gd \
  php73-php-json php73-php-mbstring php73-php-mcrypt php73-php-mysqlnd \
  php73-php-opcache php73-php-pdo php73-php-pecl-crypto php73-php-snmp \
  php73-php-soap
# 安装完成后最好重启一下计算机，否则可能无法启动 php

systemctl enable php73-php-fpm
systemctl start php73-php-fpm

rpm -ql php73-php-fpm              # 查看安装位置
find /etc/opt/remi/php73 -name php.ini   # 找配置文件

# 安全设置：禁用 cgi.fix_pathinfo
sed -i 's/;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/' /etc/opt/remi/php73/php.ini

systemctl restart php73-php-fpm    # start/stop/status 同理
php73 -v                           # 查看版本
yum search php73                   # 查找更多组件
yum update                         # 更新所有可更新软件（含 PHP）
```

## 实战：LNMP 搭建 WordPress

WordPress 是 PHP + MySQL 开发的博客平台/CMS，需要 **MySQL + PHP + Nginx** 环境。

### 1. 准备数据库

```bash
wget -i -c http://dev.mysql.com/get/mysql57-community-release-el7-10.noarch.rpm
yum -y install mysql57-community-release-el7-10.noarch.rpm
yum -y install mysql-community-server
systemctl start mysqld
grep "password" /var/log/mysqld.log    # 获取默认密码
mysql -uroot -p
```

```sql
alter user 'root'@'localhost' identified by 'Lile@5201314';
create database wordpress;
create user 'wordpress'@'localhost' identified by 'Qfedu.123com';
grant all privileges on wordpress.* to 'wordpress'@'localhost';
flush privileges;
```

### 2. 配置 Nginx

```bash
yum install nginx -y
vim /etc/nginx/conf.d/wordpress.conf
nginx -s reload     # 重新加载配置
```

```nginx
server {
    listen 80;
    server_name opswordpress.transspay.net;
    root /wordpress;
    location / {
        index index.php index.html index.htm;
        try_files $uri $uri/ /index.php index.php;
    }
    location ~ .php$ {                 # PHP 交给 9000 端口的 php-fpm
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }
}
```

### 3. 安装 PHP 环境并检测

```bash
yum install php-fpm php-mysql -y
systemctl start php-fpm.service
lsof -i:9000          # 检测 php-fpm 监听（9000 为默认端口）
```

### 4. 部署 WordPress

```bash
wget https://wordpress.org/latest.tar.gz
tar xf latest.tar.gz /
cp /wordpress/wp-config-sample.php /wordpress/wp-config.php
vim /wordpress/wp-config.php
```

```php
define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', 'wordpress' );
define( 'DB_PASSWORD', 'Qfedu.123com' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );
// 密钥部分从官网获取：https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY', '...');   // 粘贴官网生成的 8 组 KEY/SALT
```

浏览器打开 IP/域名，按安装界面填写网站信息即可完成；之后用默认模板即可看到站点前端。

> **易错点**：安装主题时若提示需要 FTP，**不用装 FTP**，在 `wp-config.php` 里加三行即可：
>
> ```php
> define("FS_METHOD","direct");
> define("FS_CHMOD_DIR", 0777);
> define("FS_CHMOD_FILE", 0777);
> ```

## 本篇要点小结

1. Web 服务器四步工作原理：连接 → 请求 → 应答 → 关闭连接。
2. **Apache 强在动态与模块生态，Nginx 强在高并发、反向代理、低资源占用**；LNAMP 用 Nginx 前端 + Apache 后端取长补短。
3. 中间件默认端口常考：Tomcat 8080、WebLogic 7001、JBoss 8080、WebSphere 9080；php-fpm 监听 9000。
4. Apache 改家目录要同时改 `DocumentRoot` 和 `<Directory>` 两处；配置改完用 `apachectl -t` 查语法、`graceful` 平滑加载。
5. Nginx + PHP 的关键：`location ~ \.php$` 中 `fastcgi_pass 127.0.0.1:9000`，前提 php-fpm 已启动。
6. 数据库初始化用 `mysql_secure_installation`；MySQL 新版密码必须符合复杂性要求；备份恢复用 mysqldump 导出 + `mysql <` 导入。

> AI生成
