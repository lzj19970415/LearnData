---
title: LNMP生产环境部署
category: Linux基础
tags:
  - Linux
  - LNMP
  - Nginx
---

# LNMP生产环境部署

> LNMP = **L**inux + **N**ginx + **M**ySQL + **P**HP。Nginx 处理静态请求，PHP 动态请求通过 FastCGI 转发给 php-fpm（127.0.0.1:9000），数据存 MySQL。本篇覆盖：MySQL/Nginx/PHP 源码编译安装全流程、systemd 服务管理、Nginx+PHP 联动、禅道部署与管理入门。

## 一、编译安装 MySQL 5.7

### 1. 官方资源与版本命名

- 官网：https://dev.mysql.com/；下载：https://dev.mysql.com/downloads/mirrors/；文档：https://dev.mysql.com/doc/relnotes/mysql/5.7/en/（每个版本都有对应文档，看文档要对准版本）。

软件版本命名（Alpha → Beta → RC → GA）：

| 版本 | 含义 | 生产可用 |
|------|------|---------|
| Alpha | 内部测试版，不对外发布，Bug 多 | 否 |
| Beta | Alpha 后版本，消除严重错误但仍有缺陷，会持续加新功能 | 否 |
| RC | Release Candidate，无新增功能，只修 Beta 反馈的 Bug，接近 GA | 谨慎 |
| GA | Generally Available，最终发行版/稳定版，Bug 相对少 | **是** |
| Release | 最终交付版本，MySQL 中一般没有，封面用符号 (R) 表示 | — |

### 3. 查询 MySQL 版本

```bash
# 已登录 MySQL 内查询
mysql> status;
mysql> select version();
mysql> select @@version;
mysql> show variables like "%version%";
# 不登录查询
mysql -V
mysql --version
mysql --help | grep Distrib
rpm -qa | grep mysql
```

### 2. 查询版本与版本号含义

以 5.7.27 为例：**5** 主版本号（文件格式改动时作为新版本发布）；**7** 发行版本号（新增特性或不兼容改动时变更）；**27** 发行序列号（小改动：Bug 修复、函数增改、配置参数更改）。

### 3. 版本类型与安装方式

- **版本类型**：Community Server 社区版（开源免费 GPL，无官方技术支持，最常用）；Enterprise Edition 企业版（付费，可试用 30 天）；Cluster 集群版（开源免费，多个 Server 封装成一个，CGE 高级集群版付费）。
- **安装方式**：yum（简单易用，联网+yum 源可用，可用 163/sohu/阿里源）；编译安装（5.1.X 以前 `./configure && make && make install`，5.4.X~5.7.X 改用 **cmake**，需提前装 cmake，可定制功能）；二进制（官方包解压初始化即用）；rpm（下载包后 rpm/yum 安装）。

### 4. 编译安装全流程

#### （1）目录、编译环境、下载源码包

```bash
mkdir -p /usr/local/src/mysql
yum -y install gcc gcc-c++ glibc automake autoconf libtool make
cd /usr/local/src/mysql
wget https://nchc.dl.sourceforge.net/project/boost/boost/1.59.0/boost_1_59_0.tar.gz      # boost 库
wget https://github.com/Kitware/CMake/releases/download/v3.14.5/cmake-3.14.5.tar.gz      # cmake
wget http://ftp.ntu.edu.tw/MySQL/Downloads/MySQL-5.7/mysql-5.7.27.tar.gz                 # MySQL 源码
```

- MySQL 5.7 编译**必须依赖 boost 1.59.0**。

#### （2）安装 cmake、解压 boost、建目录建用户

```bash
tar -zxvf cmake-3.14.5.tar.gz && cd cmake-3.14.5
./bootstrap && gmake && gmake install
cmake -version        # 验证

tar xf boost_1_59_0.tar.gz -C /usr/local/
mv /usr/local/boost_1_59_0 /usr/local/boost
yum install ncurses-devel -y
mkdir -p /database/mysql/{data,tmp,binlog,logs}
groupadd mysql
useradd mysql -s /sbin/nologin -M -g mysql     # 不能登录、无 HOME、指定组
```

#### （3）cmake 配置

```bash
cd /usr/local/src/mysql
tar xf mysql-5.7.27.tar.gz && cd mysql-5.7.27
cmake . -DCMAKE_INSTALL_PREFIX=/database/mysql -DMYSQL_DATADIR=/database/mysql/data \
-DMYSQL_UNIX_ADDR=/database/mysql/tmp/mysql.sock -DDEFAULT_CHARSET=utf8 \
-DDEFAULT_COLLATION=utf8_general_ci -DEXTRA_CHARSETS=gbk,gb2312,utf8,ascii \
-DENABLED_LOCAL_INFILE=ON -DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DWITH_FEDERATED_STORAGE_ENGINE=1 -DWITH_BLACKHOLE_STORAGE_ENGINE=1 \
-DWITHOUT_EXAMPLE_STORAGE_ENGINE=1 -DWITH_ZLIB=bundled -DWITH_EMBEDDED_SERVER=1 \
-DWITH_DEBUG=0 -DWITH_BOOST=/usr/local/boost
```

出现 `-- Build files have been written to:` 即配置完成。关键参数：`PREFIX`=安装目录、`DATADIR`=数据目录、`UNIX_ADDR`=sock 路径、`CHARSET/COLLATION`=字符集排序、`ENABLED_LOCAL_INFILE`=本地导入、`WITH_xxx_STORAGE_ENGINE`=引擎开关（禁用用 `WITHOUT_xxx`）、`WITH_BOOST`=boost 路径（5.7 必需）、`WITH_DEBUG=0` 禁 debug。

#### （5）编译、安装、环境变量与属主

```bash
make
make install
echo $?                 # 每步结束检查返回值，0 才算成功
ls /database/mysql/     # 有内容说明安装成功

echo 'export PATH=/database/mysql/bin:$PATH' >> /etc/profile
source /etc/profile
chown -R mysql:mysql /database/mysql/
chown mysql:mysql /etc/my.cnf
cp /etc/my.cnf /etc/my.cnf.bak     # 先备份
```

> **易错点**：5.7 的 support-files 目录下**没有 .cnf 模板**（与 5.6 不同），/etc/my.cnf 要手动编辑。

### 5. /etc/my.cnf 关键配置

```ini
[client]
port = 3306                                  # 连接端口
socket = /database/mysql/tmp/mysql.sock      # 本地 socket
default-character-set = utf8
[mysqld]
port = 3306                                  # 服务端口
user = mysql                                 # 启动用户
basedir = /database/mysql                    # 安装根目录
datadir = /database/mysql/data               # 数据目录
pid-file = /database/mysql/mysqld.pid
socket = /database/mysql/tmp/mysql.sock
tmpdir = /database/mysql/tmp                 # 临时文件目录
character_set_server = utf8
server-id = 1                                # 服务唯一编号，主从必须唯一
max_connections = 100                        # 最大连接数
max_connect_errors = 10
sql_mode = NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_AUTO_VALUE_ON_ZERO,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,PIPES_AS_CONCAT,ANSI_QUOTES
log-bin = /database/mysql/binlog/mysql-bin   # 开启二进制日志
log-error = /database/mysql/logs/mysql_5_7_27.err
```

sql_mode 常用模式速查：

| 模式 | 作用 |
|------|------|
| NO_ENGINE_SUBSTITUTION | 引擎被禁用时防止自动替换存储引擎 |
| STRICT_TRANS_TABLES | 严格模式，非法数据值被拒绝 |
| NO_AUTO_CREATE_USER | 禁止 GRANT 创建空密码用户 |
| NO_AUTO_VALUE_ON_ZERO | 允许向自增列插入 0 |
| NO_ZERO_IN_DATE / NO_ZERO_DATE | 不接受月日为 0 / `0000-00-00` 日期 |
| ERROR_FOR_DIVISION_BY_ZERO | 严格模式被零除报错 |
| PIPES_AS_CONCAT | `||` 视为字符串连接符 |
| ANSI_QUOTES | 双引号视为标识符引号 |

### 6. 初始化与 SSL

```bash
cd /database/mysql/
./bin/mysqld --initialize-insecure --user=mysql \
--basedir=/database/mysql --datadir=/database/mysql/data
# --initialize-insecure：生成空密码；5.7 必须加该参数，否则初始化失败
# --user=mysql 初始化用户；--basedir/--datadir 工作与数据目录

./bin/mysql_ssl_rsa_setup --initialize-insecure --user=mysql \
--basedir=/database/mysql --datadir=/database/mysql/data
chmod +r /database/mysql/data/server-key.pem
```

> **易错点**：server-key.pem 不给其他用户/组可读权限，启动会报 `[ERROR] SSL error: Unable to get private key from 'server-key.pem'`。

### 7. 启动、验证与安全加固

```bash
cp /database/mysql/support-files/mysql.server /etc/init.d/mysqld
systemctl daemon-reload
systemctl enable mysqld.service       # 开机自启（redirect 到 chkconfig）
chkconfig mysqld on

/etc/init.d/mysqld start              # Starting MySQL. SUCCESS!
systemctl start mysqld
ps aux | grep mysqld                  # mysqld_safe 守护 + mysqld 进程
ss -anput | grep 3306                 # 检查端口（CentOS7 默认无 netstat，用 ss）
```

设置密码并重新加载授权表：

```sql
mysql> select user,host from mysql.user;
mysql> grant all privileges on *.* to qfedu@'localhost' identified by 'Qfedu.123com' with grant option;
mysql> set password for root@localhost = password('Qfedu.123com');
mysql> set password for 'mysql.session'@'localhost' = password('Qfedu.123com');
mysql> set password for 'mysql.sys'@'localhost' = password('Qfedu.123com');
mysql> flush privileges;
```

> 5.7 建议配置 SSL 加密连接；命令行明文传密码不安全。

### 8. 优雅关闭与远程授权

```bash
/etc/init.d/mysqld stop
systemctl stop mysqld
mysqladmin -uqfedu -pQfedu.123com shutdown    # 命令行密码有告警
```

```sql
mysql> grant all privileges on *.* to qfedu1@'192.168.152.%' identified by 'Qfedu.123com' with grant option;
mysql> flush privileges;
```

```bash
mysql -h192.168.152.167 -uqfedu1 -pQfedu.123com -P3306   # 测试远程登录
```

## 二、编译安装 Nginx

Nginx 是轻量级 Web 服务器/反向代理服务器及电子邮件（IMAP/POP3）代理服务器，BSD-like 协议发行；特点是**占内存少、并发能力强**，国内典型用户：百度、京东、新浪、网易、腾讯、淘宝。

### 1. 依赖与准备

```bash
yum install -y gcc gcc-c++ pcre pcre-devel zlib zlib-devel \
openssl openssl-devel perl-devel perl-ExtUtils-Embed gd-devel
# gcc/gcc-c++：编译环境；pcre：http 模块解析正则；zlib：gzip 压缩；OpenSSL：支持 https
mkdir -p /usr/local/src/nginx && cd /usr/local/src/nginx
wget https://nginx.org/download/nginx-1.16.0.tar.gz
useradd -s /sbin/nologin -M nginx          # 运行用户
mkdir -p /var/tmp/nginx/client/            # 请求体临时目录
```

### 2. configure 与编译

```bash
tar zxvf nginx-1.16.0.tar.gz && cd nginx-1.16.0
./configure --user=nginx --group=nginx \
--prefix=/usr/local/nginx --conf-path=/etc/nginx/nginx.conf --sbin-path=/usr/sbin/nginx \
--error-log-path=/var/log/nginx/nginx_error.log --http-log-path=/var/log/nginx/nginx_access.log \
--pid-path=/usr/local/nginx/run/nginx.pid --lock-path=/usr/local/nginx/lock/nginx \
--with-http_ssl_module --with-http_realip_module --with-http_stub_status_module \
--with-http_gzip_static_module --with-pcre \
--http-client-body-temp-path=/var/tmp/nginx/client/ --http-proxy-temp-path=/var/tmp/nginx/proxy \
--http-fastcgi-temp-path=/var/tmp/nginx/fcgi --http-uwsgi-temp-path=/var/tmp/nginx/uwsgi \
--http-scgi-temp-path=/var/tmp/nginx/scgi

make -j2 && make install
```

关键参数：`--prefix` 安装根路径（其他路径依赖它）；`--with-http_ssl_module` 支持 https；`--with-http_realip_module` 从请求头更改客户端 IP；`--with-http_stub_status_module` 获取工作状态；`--with-http_gzip_static_module` 实时压缩输出；`--http-*-temp-path` 各类临时目录。

### 3. 编译常见问题（易错点）

| 报错 | 原因 | 解决 |
|------|------|------|
| `./configure: error: perl module ExtUtils::Embed is required` | 缺 perl 模块 | `yum -y install perl-ExtUtils-Embed` |
| `nginx: [emerg] getpwnam("nginx") failed` | 没有 nginx 用户 | `useradd -s /sbin/nologin -M nginx` |
| `/bin/sh^M: bad interpreter` | 脚本 Windows 格式 | vim 中 `:set ff=unix` 保存 |
| user 相关启动报错 | nginx.conf 中 user 被注释 | 去掉注释改为 `user nginx;` |

### 4. 启动与 systemd 管理

```bash
nginx -V                      # 查看版本与编译参数
/usr/sbin/nginx               # 启动
netstat -ntlp | grep nginx    # 检查 80 端口
vim /lib/systemd/system/nginx.service
```

```ini
[Unit]
Description=nginx
After=network.target
[Service]
Type=forking
ExecStart=/usr/sbin/nginx
ExecReload=/usr/sbin/nginx -s reload
ExecStop=/usr/sbin/nginx -s quit
PrivateTmp=true
[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl start nginx
systemctl enable nginx        # 开机自启
```

> **注意**：[Service] 中启动/重启/停止命令必须**绝对路径**；Type=forking 表示后台运行；PrivateTmp=true 给服务独立临时空间。也可用 SysV 启动脚本方式：写 `/etc/rc.d/init.d/nginx` → `chmod +x` → `chkconfig --add nginx && chkconfig nginx on`。

### 5. 配置文件解读（核心结构）

```nginx
user    nginx;                              # 运行用户
worker_processes  1;                        # 进程数，通常与 CPU 数量相等
error_log  /var/log/nginx/error.log;
pid        /usr/local/nginx/run/nginx.pid;
log_format access '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" "$http_user_agent"';
events {
    use epoll;                    # 多路复用 IO，仅 linux 2.6+ 内核，大幅提升性能
    worker_connections 1024;      # 单个 worker 最大并发连接数
}
http {
    include       /etc/nginx/mime.types;      # mime 类型
    default_type  application/octet-stream;
    sendfile      on;           # zero copy 输出；下载重 IO 应用可 off
    keepalive_timeout  65;      # 连接超时
    gzip  on;                   # 开启压缩
    client_header_buffer_size 1k;   # 请求缓冲
    large_client_header_buffers 4 4k;
    include /etc/nginx/conf.d/*.conf;
    upstream mysvr {            # 负载均衡列表，weight 越高被分配几率越大
        server 192.168.8.1:3128 weight=5;
        server 192.168.8.2:80   weight=1;
    }
    server {
        listen 80;                          # 侦听端口
        server_name nginx.xxx.com;          # 域名
        access_log /var/log/nginx/xxx_access.log access;
        location / {
            root   /var/nginx/html/;        # 网站根目录
            index index.php index.html index.htm;
        }
        error_page 500 502 503 504 /50x.html;   # 错误页
        location ~ ^/(images|js|css|static)/ {
            root /var/nginx/virtual/htdocs;
            expires 30d;                    # 静态文件缓存 30 天
        }
        location ~ \.php$ {                 # PHP 转发 FastCGI
            fastcgi_pass 127.0.0.1:9000;
            fastcgi_index index.php;
            include fastcgi_params;
        }
        location ~ /\.ht { deny all; }      # 禁止访问隐藏文件
    }
}
```

日志变量：`$remote_addr`/`$http_x_forwarded_for` 客户端 IP；`$remote_user` 用户名；`$time_local` 时间时区；`$request` 请求 URL 与协议；`$status` 状态码（成功 200）；`$body_bytes_sent` 发给客户端的主体大小；`$http_referer` 来源页面。

### 6. 虚拟主机与访问控制

- **多域名虚拟主机**：多个 server 段，各自 `server_name` 不同；**基于端口**：改 `listen` 端口，`server_name` 改成 IP；**别名**：`server_name nginx.etiantian.org etiantian.org;` 写两个域名即别名。

```nginx
location / {
    deny 172.16.50.173;      # 拒绝该 IP
    allow all;               # 允许其他全部
}
location / {
    allow 172.16.50.0/24;    # 只允许该网段（也可单个 IP）
    deny all;
}
```

### 7. 状态信息（stub_status）

```nginx
server {
    listen 80;
    server_name status.qf.edu;
    location / {
        stub_status on;
        access_log off;
    }
}
```

```text
Active connections: 3
server accepts handled requests
 9 9 192
Reading: 0 Writing: 1 Waiting: 2
```

- **Active connections**：正在处理的活动连接数；
- **accepts**：启动以来成功创建的连接数（握手数-连接数=丢失请求数）；**requests**：共处理请求数；
- **Reading**：正在读取客户端 Header 数；**Writing**：正在返回 Header 数；
- **Waiting**：处理完驻留等待长连接数 = active - (reading + writing)。

### 8. 已安装 Nginx 添加新模块（平滑升级）

```bash
git clone https://github.com/cuber/ngx_http_google_filter_module   # 1. 下载扩展模块
nginx -V                                                          # 2. 查看已编译参数
./configure ...原参数全部保留... --add-module=/data/software/ngx_http_google_filter_module  # 3. 重新 configure
make                                     # 4. 只 make，不要 make install
cp /usr/sbin/nginx /usr/sbin/nginx.bak   # 5. 备份旧二进制
cp ./objs/nginx /usr/sbin/               #    替换新二进制
systemctl reload nginx                   # 6. 重载服务
nginx -V                                 # 7. 验证
```

> **易错点**：加模块只 `make` 不 `make install`（否则覆盖安装目录）；替换二进制前必须备份便于回滚。

## 三、编译安装 PHP 7.3

### 1. 依赖与 libzip

```bash
yum -y install gcc gcc-c++ glibc automake autoconf libtool make
yum -y install libxslt-devel libjpeg libjpeg-devel libpng libpng-devel \
freetype freetype-devel libxml2 libxml2-devel zlib zlib-devel glibc glibc-devel \
glib2 bzip2-devel ncurses ncurses-devel curl curl-devel e2fsprogs e2fsprogs-devel \
krb5-devel libidn libidn-devel openssl openssl-devel

# PHP 7.3 依赖高版本 libzip
cd /usr/local/src/php
wget https://libzip.org/download/libzip-1.5.2.tar.gz
tar -zxvf libzip-1.5.2.tar.gz && cd libzip-1.5.2/
mkdir build && cd build
cmake .. && make -j2 && make test && make install
```
### 2. configure 与编译

```bash
wget https://www.php.net/distributions/php-7.3.6.tar.gz
tar -zxvf php-7.3.6.tar.gz && cd php-7.3.6
./configure --prefix=/usr/local/php7 --with-config-file-path=/usr/local/php7 \
--enable-mysqlnd --with-mysqli --with-pdo-mysql \
--enable-fpm --with-fpm-user=nginx --with-fpm-group=nginx \
--with-gd --with-iconv --with-zlib --with-openssl --with-curl \
--enable-xml --enable-mbstring --enable-ftp --enable-pcntl --enable-sockets \
--enable-soap --with-jpeg-dir --with-freetype-dir --enable-opcache --enable-zip

make && make install
```

关键参数：`--enable-fpm` 启用 FastCGI 进程管理器（核心）；`--with-fpm-user/group` fpm 运行身份；`--with-mysqli/--with-pdo-mysql` 数据库扩展；`--enable-opcache` 缓存加速；`--with-gd/--with-jpeg-dir/--with-freetype-dir` 图片处理。

若 configure 报 `off_t` 类型相关错误，在 /etc/ld.so.conf 中追加 `/usr/local/lib64`、`/usr/local/lib`、`/usr/lib`、`/usr/lib64` 四行，然后 `ldconfig -v` 刷新。

### 3. 配置文件与进程池

```bash
cp /usr/local/src/php/php-7.3.6/php.ini-production /usr/local/php7/etc/php.ini
cd /usr/local/php7/etc
cp php-fpm.conf.default php-fpm.conf
vim php-fpm.conf        # pid=/usr/local/php7/var/run/php-fpm.pid
cd php-fpm.d
cp www.conf.default nginx.conf && vim nginx.conf
```

```ini
user = nginx
group = nginx
listen = 127.0.0.1:9000
pm.max_children = 100
pm.start_servers = 20
pm.min_spare_servers = 5
pm.max_spare_servers = 35
```

php-fpm 进程池两种模式：

- **static（静态）**：直接开固定数量进程，不再增减；只有 `pm.max_children` 生效；
- **dynamic（动态）**：启动 `pm.start_servers` 个进程，请求量大时增至 `pm.max_children` 上限，空闲时回收到 `pm.min_spare_servers` ~ `pm.max_spare_servers` 之间；4 个参数都生效。

> **易错点**：`pm.max_spare_servers` 必须**小于等于** `pm.max_children`，否则 fpm 启动报错。

### 4. 启动与 systemd 服务

```bash
/usr/local/php7/sbin/php-fpm       # 直接启动
ps aux | grep php-fpm              # master + pool www worker（nginx 用户身份）
# 环境变量：/etc/profile 中追加 export PHP_HOME=/usr/local/php7
#          export PATH=$PATH:$PHP_HOME/bin:$PHP_HOME/sbin，然后 source /etc/profile
vim /lib/systemd/system/php-fpm.service
```

```ini
[Unit]
Description=php-fpm
After=network.target
[Service]
Type=forking
ExecStart=/usr/local/php7/sbin/php-fpm
ExecStop=/bin/pkill -9 php-fpm
PrivateTmp=true
[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
pkill php-fpm
systemctl start php-fpm.service
systemctl enable php-fpm.service
```

> [Unit]：Description 描述服务、After 服务类别；[Service]：Type=forking 后台运行，ExecStart/ExecReload/ExecStop 为启停命令，**必须绝对路径**；[Install]：WantedBy=multi-user.target 即运行级别 3。

## 四、Nginx 配置支持 PHP

### 1. server 段添加 PHP 转发

```nginx
server {
    listen 80;
    server_name localhost;
    index index.html index.htm index.php;
    root /usr/local/nginx/html;
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass 127.0.0.1:9000;        # 转给 php-fpm
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME /usr/local/nginx/html$fastcgi_script_name;
    }
}
```

### 2. 测试页与验证

```bash
cd /usr/local/nginx/html/ && vim index.php    # 内容：<?php phpinfo(); ?>
systemctl restart php-fpm.service
systemctl reload nginx
# 浏览器访问 http://ip/index.php 出现 phpinfo 页面即成功
```

> **易错点**：`SCRIPT_FILENAME` 的目录必须与 `root` 一致，否则报 File not found；php-fpm 未启动或 9000 端口不通会报 502。

## 五、部署禅道（企业级项目管理系统）

### 1. 下载、安装与 zbox 管理

- 官网 https://www.zentao.net 下载（例：开源版 11.6）；**一键安装包必须直接解压到 /opt**，不要解压到别处再拷贝（改变属主和权限），也不要整个目录 chmod 777。

```bash
tar -zxvf ZenTaoPMS.11.6.stable.zbox_64.tar.gz -C /opt/
/opt/zbox/zbox start                     # 启动 Apache 和 MySQL
/opt/zbox/zbox stop                      # 停止
/opt/zbox/zbox restart                   # 重启
/opt/zbox/zbox start -ap 8888 -mp 3307   # 端口冲突时指定（-ap Apache、-mp MySQL）
/opt/zbox/zbox -h                        # 帮助
firewall-cmd --zone=public --add-port=8888/tcp --permanent
firewall-cmd --reload
```

### 2. 访问与数据库管理

- 浏览器访问 `http://ip:8888` → "开源版"，默认账号 `admin` / `123456`，登录后改密码；
- 数据库管理用 adminer，访问前需加验证用户：`cd /opt/zbox/auth/ && ./adduser.sh`（自定义账号密码）；
- 网页点击"数据库管理"→ 输入 adduser.sh 设置的账号密码 → 连接：服务器 `127.0.0.1:3307`（与 -mp 一致）、用户 root、密码 123456、数据库 zentao。

```bash
/opt/zbox/bin/mysql -u root -P 3307 -p                      # 命令行登录
/opt/zbox/bin/mysql -u root -P 3307 -p zentao < zentao.sql  # 导入数据库
```

### 3. 禅道开机自启（systemd）

CentOS7 服务脚本在 `/usr/lib/systemd/`：system（开机不登录即运行）与 user（登录后运行）之分，服务以 .service 结尾。

```bash
vim /lib/systemd/system/zentao.service
```

```ini
[Unit]
Description=zentao
After=network.target
[Service]
Type=forking
ExecStart=/opt/zbox/zbox start
ExecReload=/opt/zbox/zbox restart
ExecStop=/opt/zbox/zbox stop
PrivateTmp=true
[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable zentao
systemctl start zentao
systemctl status zentao
ps aux | grep zbox
```

## 六、禅道项目管理入门

- **组织与权限**：管理员 → 组织 → 用户视图 → 维护部门（点部门名可加子部门），部门管"汇报关系"；组织 → 用户列表添加/批量添加用户，指定职位后还需**关联分组**才能获得权限；组织 → 权限分组 → 新增分组 → 权限/成员维护。分组管"权限"，与部门无必然关系；一个用户属多个分组时权限取**合集**；受限操作分组：只能编辑与自己相关的需求/任务/bug、不能新增，适合新员工；
- **项目任务管理（简流程）**：创建项目 → 设置团队（成员、角色、可用工作日/工时）→ 分解任务指派到人 → 任务流转：开始（设消耗/剩余工时）→ 更新工时 → 完成 → 关闭。需求列表 T/B/C 分别代表任务数/Bug 数/用例数；多人任务按顺序开始、完成后转交下一个人，不可创建子任务；子任务工时之和覆盖父任务工时；
- **Bug 管理**：前提先创建产品；流程：**测试提交 → 开发确认 → 开发解决 → 测试验证 → 测试关闭**；验证不通过可激活重走；必填影响版本、标题、重现步骤；
- **需求管理**：三要素为**标题、描述、验证标准**；勾"不需要评审"则直接激活，否则草稿待评审；只有**激活状态**需求才能关联到项目；改标题/描述/验证标准必须走**变更流程**，评审结果：确认通过/撤销变更/有待明确/拒绝。

### 5. Scrum 与禅道概念对应

| Scrum | 禅道 | Scrum 角色 | 禅道角色 |
|-------|------|-----------|---------|
| product | 产品 | product owner | 产品经理 |
| user story | 需求 | scrum master | 项目经理 |
| sprint | 项目 | team | 团队成员 |
| task / team | 任务 / 团队 | | |

- Scrum 基本流程：产品负责人整理 user story → 发布计划会议 → 迭代计划会议（任务分解）→ 每日例会 → 演示会议 → 回顾会议；迭代周期 1~4 周，团队 5~9 人；
- 禅道完整基本流程：创建产品 → 创建需求 → 创建项目 → 关联需求 → 分解任务指派到人 → 测试提交 bug；
- 禅道补充概念：发布计划、路线图、项目版本、bug、测试用例、测试单、测试结果、文档、待办。

## 七、易错点汇总

- MySQL 5.7 编译必须 boost 库；`--initialize-insecure` 不加会初始化失败；每步编译后用 `echo $?` 验证。
- 5.7 没有 my.cnf 模板需手写；server-key.pem 无读权限会导致 SSL 启动报错。
- Nginx 报 `getpwnam("nginx") failed` = 没建用户；脚本 `^M` = Windows 换行，`:set ff=unix`。
- 加模块只 `make` 不 `make install`；替换二进制前先备份。
- php-fpm 配置 `pm.max_spare_servers ≤ pm.max_children`；`SCRIPT_FILENAME` 与 root 对应，否则 502/File not found。
- 禅道 zbox 必须直接解压到 /opt；端口冲突用 `-ap/-mp` 改端口并放行防火墙。
- systemd 服务启停命令必须绝对路径；改了 .service 要 `daemon-reload`。

> AI生成