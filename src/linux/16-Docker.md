---
title: Docker 从入门到生产实战
category: Linux进阶
tags:
  - Linux
  - Docker
  - 容器
---

> 面向云平台运维的 Docker 实战笔记：从安装、镜像、容器、网络、Dockerfile 到 Compose、Harbor 私有仓库，覆盖生产部署规范与高频故障排查，目标是进公司就能干活。

# Docker 从入门到生产实战

## 一、核心概念：镜像、容器、仓库

### 1. 三大核心对象

- **镜像（Image）**：只读模板，包含运行应用所需的程序、依赖、配置。类比：软件安装包。
- **容器（Container）**：镜像的运行实例，可启停删除。一个镜像可起 N 个容器，互不影响。类比：安装后正在运行的进程。
- **仓库（Registry）**：集中存放镜像的地方。类比：应用商店。公共仓库如 Docker Hub，企业内部用私有仓库（Harbor）。

三者关系：**从仓库拉取镜像 → 基于镜像运行容器 → 容器内的修改默认随容器删除而丢失**，所以生产必须规划好数据卷挂载（见第五章）。

### 2. 容器与虚拟机的区别

| 对比项 | 容器（Docker） | 虚拟机（KVM/VMware） |
|---|---|---|
| 隔离级别 | 进程级（共享宿主机内核） | 硬件级（独立内核） |
| 启动速度 | 秒级 | 分钟级 |
| 资源占用 | MB 级，单机可跑上百个 | GB 级，受限于内存 |
| 适用场景 | 单一应用、快速交付、弹性扩缩 | 完整 OS、强隔离、多租户 |

一句话：**虚拟机隔离重、容器交付快**。云平台常见组合是"虚拟机当节点 + 容器跑业务"。

## 二、安装部署（CentOS 7 / EL 系列）

### 1. yum 安装 Docker

```bash
# 1. 卸载系统自带老版本（没有会提示无需删除，直接过）
yum remove -y docker docker-client docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 2. 安装依赖并添加阿里云 docker-ce 源（内网环境用公司内部 yum 源）
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 3. 安装最新稳定版
yum install -y docker-ce docker-ce-cli containerd.io

# 生产建议固定版本：yum list docker-ce --showduplicates 查版本后安装
yum install -y docker-ce-24.0.9-1.el7 docker-ce-cli-24.0.9-1.el7 containerd.io
```

### 2. 配置国内镜像加速

2024 年以后 Docker Hub 直连国内基本拉不动，网易、中科大等公共加速器也陆续关停。生产环境优先级：**公司私有仓库 > 云厂商专属加速器 > 社区加速器**。

- 阿里云：cr.console.aliyun.com → "镜像加速器"页面有专属地址 `https://<你的ID>.mirror.aliyuncs.com`
- 腾讯云内网机器：`https://mirror.ccs.tencentyun.com`（仅腾讯云内网可用）

编辑 `/etc/docker/daemon.json`（没有就新建）：

```json
{
  "registry-mirrors": [
    "https://xxxxxxxx.mirror.aliyuncs.com",
    "https://mirror.ccs.tencentyun.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "live-restore": true
}
```

关键项说明（这是生产标配，不只是加速器）：

- `registry-mirrors`：拉取镜像的加速地址，多个会依次尝试
- `log-opts`：容器日志轮转，**不配它，业务一刷日志就可能把磁盘打爆**（详见第十一章）
- `live-restore`：daemon 重启/升级时容器不中断，**生产必须开**；`log-opts` 只对新建容器生效，老容器需重建

### 3. 启动、开机自启与验证

```bash
systemctl daemon-reload && systemctl restart docker    # 改配置后先重载再重启
systemctl enable --now docker                          # 开机自启 + 立即启动
docker version                                         # Client/Server 都有输出即正常
docker info | grep -A3 "Registry Mirrors"              # 确认加速器已生效
```

## 三、镜像管理

### 1. 搜索、拉取与查看

```bash
docker search nginx                     # 搜索公共镜像
docker pull nginx:1.25                  # 拉取指定版本
docker pull nginx                       # 不带 tag 默认 latest —— 生产禁止这样用
docker images                           # 列出本地镜像
docker inspect nginx:1.25               # 镜像完整元数据（入口、环境变量、卷定义）
docker history nginx:1.25               # 分层构建历史，排查镜像为什么大
```

> 生产规范：`latest` 是移动靶，升级不可控，所有镜像写死具体版本号。

### 2. tag / 删除 / 导出导入

```bash
# 打标签：docker tag 源镜像 新名字:新tag
docker tag nginx:1.25 harbor.internal.example.com/prod/nginx:1.25

# 删除
docker rmi nginx:1.25                              # 按名字删
docker image prune                                # 清理悬空镜像（<none> 残留层）
docker image prune -a --filter "until=168h"        # 清理 7 天未使用的镜像（配定时任务）

# 离线交付：内网机器没法联网拉镜像时，"能上网的机器导出 → 拷贝 → 导入"
docker save nginx:1.25 | gzip > nginx-1.25.tar.gz     # save/load 针对镜像，保留分层（推荐）
gunzip -c nginx-1.25.tar.gz | docker load
docker export web-nginx > web-snap.tar                # export/import 针对容器快照，丢历史（应急）
docker import web-snap.tar my-app:snapshot
```

### 3. 加速器失效怎么办

换用社区仓库代理形式拉取，如 `docker pull docker.m.daocloud.io/library/nginx:1.25` 拉下来再 `docker tag` 改名；最终方案是公司统一部署 Harbor，内网机器全部从 Harbor 拉（见第九章）。

## 四、容器生命周期管理

### 1. docker run 核心参数（重点）

生产上 90% 的容器就是一条 run 命令带全参数：

```bash
docker run -d \
  --name web-nginx \
  -p 80:80 \
  -v /data/nginx/html:/usr/share/nginx/html \
  -v /data/nginx/logs:/var/log/nginx \
  -e TZ=Asia/Shanghai \
  --restart=always \
  --memory=512m --memory-swap=512m \
  --cpus=1 \
  --health-cmd "curl -fs http://localhost/ || exit 1" --health-retries=3 \
  nginx:1.25
```

| 参数 | 作用 | 生产要点 |
|---|---|---|
| `-d` | 后台运行 | 服务类容器必加 |
| `--name` | 容器名 | 规范命名：业务-组件，如 `app-nginx` |
| `-p 宿主端口:容器端口` | 端口映射 | 对外服务用；`-p 127.0.0.1:8080:80` 只绑本机 |
| `-v 宿主路径:容器路径` | 目录挂载 | 配置、日志、数据必须挂出来，容器删了数据还在 |
| `-e KEY=VALUE` | 环境变量 | 传时区 `TZ`、数据库地址、密码等 |
| `--restart=always` | 重启策略 | **服务器重启后容器自动拉起，生产必配** |
| `--memory` / `--memory-swap` | 内存限制 | 两者设同值等于禁用 swap，防超卖拖垮宿主机 |
| `--cpus` | CPU 限制（核数） | 如 `1`、`1.5` 表示 1.5 核 |
| `--health-cmd` 系列 | 健康检查 | `docker ps` 可见 healthy/unhealthy，配合监控告警 |

重启策略补充：`--restart=on-failure:5` 非正常退出时最多重试 5 次；`unless-stopped` 表示人工 stop 过的不自动拉起。

### 2. 启动 / 停止 / 重启 / 删除

```bash
docker start web-nginx        # 启动
docker stop -t 30 web-nginx   # 停止：先 SIGTERM 给 30 秒优雅退出，超时再 SIGKILL
docker restart web-nginx      # 重启
docker rm web-nginx           # 删除已停止的容器
docker rm -f web-nginx        # 强制删除运行中的容器（确认数据已挂载出来）
docker ps                     # 看运行中的容器
docker ps -a                  # 看全部容器（包括已退出的）
docker container prune        # 批量清理已停止的容器
```

### 3. 进入容器 exec

```bash
docker exec -it web-nginx bash      # 进入容器开交互终端
docker exec -it web-nginx sh        # 精简镜像（alpine）没有 bash，用 sh
docker exec web-nginx nginx -t      # 不进容器直接执行命令，排障常用
```

### 4. inspect 查看容器详情

```bash
docker inspect web-nginx                                            # 全量 JSON
docker inspect -f '{{.State.Status}}' web-nginx                    # 运行状态
docker inspect -f '{{.State.ExitCode}}' web-nginx                   # 退出码
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' web-nginx    # 重启策略
docker inspect -f '{{.HostConfig.Memory}}' web-nginx                # 内存限制（字节）
docker inspect -f '{{.LogPath}}' web-nginx                           # 日志文件位置
```

### 5. logs 看日志、stats 看资源、cp 拷文件

```bash
docker logs -f --tail 100 web-nginx             # 类似 tail -f，跟踪最后 100 行
docker logs --since 30m web-nginx               # 只看最近 30 分钟
docker logs --tail 500 db 2>&1 | grep -i error  # 过滤错误
docker stats                                    # 动态刷新，类似 top
docker stats --no-stream                        # 输出一次即退出，适合脚本采集
docker cp web-nginx:/etc/nginx/nginx.conf /tmp/            # 容器 -> 宿主机
docker cp /data/app.conf web-nginx:/etc/app/app.conf       # 宿主机 -> 容器
```

`stats` 关注 `MEM%`：长期 95% 以上说明内存限额将被打满，是 OOM 前兆。`docker cp` 是应急排障利器：改配置、取日志、抓数据都不用进容器。

## 五、数据卷

### 1. 三种挂载方式

| 方式 | 写法 | 特点 | 生产用途 |
|---|---|---|---|
| 绑定挂载 | `-v /宿主路径:/容器路径` | 直接映射宿主目录，路径明确 | 挂配置文件、日志目录 |
| 具名卷 | `-v 卷名:/容器路径` | Docker 统一管理，位于 `/var/lib/docker/volumes/卷名/_data` | 挂业务数据（数据库存储等） |
| 匿名卷 | `-v /容器路径` | 随机卷名，难辨认 | 尽量少用 |

### 2. 绑定挂载示例

```bash
mkdir -p /data/nginx/{html,logs,conf}
docker run -d --name web-nginx -p 80:80 --restart=always \
  -v /data/nginx/html:/usr/share/nginx/html:ro \
  -v /data/nginx/logs:/var/log/nginx \
  -v /data/nginx/conf/app.conf:/etc/nginx/conf.d/app.conf:ro \
  nginx:1.25
```

挂载末尾加 `:ro` 表示只读，防止容器被入侵后篡改宿主配置；改配置文件后需 `docker restart` 生效。

### 3. 具名卷管理

```bash
docker volume create mysql-data          # 创建具名卷
docker volume ls                         # 列出所有卷
docker volume inspect mysql-data         # 看卷详情（挂载点路径）
docker run -d --name app-db \
  -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD='StrongPwd@2026' \
  --restart=always mysql:5.7
docker volume rm mysql-data               # 删除卷（先确认没容器在用）
docker volume prune                       # 清理未使用的卷（慎用，删了数据就没了）
```

### 4. 数据备份与恢复

**思路**：起一个一次性容器把卷挂进去，打成 tar 包落到宿主备份目录：

```bash
# 备份 mysql-data 卷到 /backup
docker run --rm -v mysql-data:/data:ro -v /backup:/backup \
  alpine tar czf /backup/mysql-data-$(date +%F).tar.gz -C /data .
# 从备份恢复
docker run --rm -v mysql-data:/data -v /backup:/backup:ro \
  alpine tar xzf /backup/mysql-data-2026-10-12.tar.gz -C /data
```

生产建议：把备份写成 cron 定时任务，备份文件再同步 NFS/对象存储。**容器无状态化 + 数据全落卷 + 卷定时备份**，才是合格的容器数据方案。

## 六、容器网络

### 1. 端口映射

```bash
docker run -d -p 80:80 nginx:1.25            # 宿主 80 -> 容器 80
docker run -d -p 8080:80 nginx:1.25          # 宿主 8080 -> 容器 80
docker run -d -p 127.0.0.1:8080:80 nginx     # 只绑本机回环，外部访问不到
docker port web-nginx                        # 查看容器端口映射
ss -tlnp | grep -E ':80\b'                   # 宿主机确认监听
```

### 2. bridge 模式与容器互联

默认 bridge 模式：容器经 `docker0` 网桥（172.17.0.0/16）NAT 上网，**重启后 IP 可能变化，容器间通信绝不要写 IP**。默认 bridge 不支持容器名互访，**自定义网络自带 DNS，容器名即域名**：

```bash
docker network create --driver bridge app-net    # 创建业务专用网络
docker network ls                                # 默认有 bridge/host/none 三种

# 让第五章的 app-db 加入，再起一个 web（写法同第五章，多加 --network）
docker network connect app-net app-db
docker run -d --name app-web --network app-net --restart=always nginx:1.25

docker exec -it app-web ping -c2 app-db      # 互通验证：容器名解析成功
docker network connect app-net 容器名        # 让已运行容器加入网络
```

生产要点：**一个业务系统一个独立网络**，互不干扰、权限边界清晰。host 模式（直接用宿主机网络栈）用于性能敏感、要看真实客户端 IP 的场景，注意端口冲突；none 模式无网络，用于离线沙箱。

## 七、Dockerfile：自定义镜像

### 1. 常用指令一览

| 指令 | 作用 | 说明 |
|---|---|---|
| `FROM` | 基础镜像 | 第一条必须是它，如 `FROM centos:7.9.2009` |
| `RUN` | 构建时执行命令 | 装包、改配置；多层用 `&&` 合并 |
| `COPY` | 复制宿主文件进镜像 | 推荐；`ADD` 多了解压/远程 URL 能力，易踩坑 |
| `ENV` | 环境变量 | 构建期和运行期都生效 |
| `WORKDIR` | 设定工作目录 | 后续指令相对路径的基准 |
| `EXPOSE` | 声明端口 | 仅声明，真正映射靠 run -p |
| `USER` | 切换运行用户 | 生产用于非 root 运行 |
| `ENTRYPOINT` | 固定入口命令 | 不易被覆盖 |
| `CMD` | 默认命令/参数 | 可被 run 末尾参数覆盖；容器退出本质是 CMD 前台进程退出 |

### 2. 完整示例：打一个业务 Nginx 镜像

在空目录放好 `Dockerfile`、`index.html`、`app.conf`，外加 `.dockerignore`（构建时排除无关文件，加速并防泄密）：

```text
.git
*.log
upload/
```

Dockerfile：

```dockerfile
FROM centos:7.9.2009

LABEL maintainer="ops@example.com" app="app-nginx"

# 装包：合并成一层并清缓存，否则 yum 缓存全打进镜像
RUN yum install -y epel-release && \
    yum install -y nginx && \
    yum clean all && \
    rm -rf /var/cache/yum

ENV TZ=Asia/Shanghai LANG=C.UTF-8

WORKDIR /usr/share/nginx/html

COPY index.html .
COPY app.conf /etc/nginx/conf.d/app.conf

EXPOSE 80

USER nginx

ENTRYPOINT ["nginx", "-g", "daemon off;"]
```

### 3. 构建镜像

```bash
docker build -t app-nginx:v1.0 .            # -t 名字:tag，最后的 . 是构建上下文目录
docker build -f /path/Dockerfile -t app-nginx:v1.0 /path     # 指定 Dockerfile
docker build --no-cache -t app-nginx:v1.0 . # 全新构建（排查缓存问题用）
docker history app-nginx:v1.0               # 看每层大小
```

### 4. 多阶段构建：编译与运行分离（镜像瘦身利器）

前端项目典型示例——node 只用来编译，运行只要 nginx：

```dockerfile
# ---- 阶段一：编译 ----
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && npm install
COPY . .
RUN npm run build

# ---- 阶段二：运行 ----
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

编译阶段的 node_modules、npm 缓存全部丢弃，最终镜像从 1GB 级降到几十 MB。

### 5. 生产注意点

- **瘦身**：基础镜像选 `alpine`/`slim` 变体（`openjdk:8-jre-alpine`、`python:3.11-slim`）；`RUN` 合并写并清理缓存（apt 是 `rm -rf /var/lib/apt/lists/*`）；能多阶段就多阶段；变化少的步骤写前面（先 `COPY package.json` 装依赖再 COPY 源码），吃足构建缓存
- **非 root 运行**：镜像里 `USER nginx` 指定低权用户，运行时还可 `docker run --user 1000:1000` 兜底
- **最小权限**：不用 `--privileged`，确需能力用 `--cap-add` 精确加；根文件系统只读 `--read-only` + `--tmpfs /tmp`
- 固定 tag 版本、来源可信，上线前漏洞扫描（见第十章）

## 八、Docker Compose：多容器编排

单机跑一套"web + 数据库 + 缓存"，一条条 `docker run` 难维护，用 Compose 一个 yml 描述全部服务、一条命令拉起。

### 1. 安装

```bash
# 方式一：插件版（推荐，docker-ce 源直接装，命令无横杠）
yum install -y docker-compose-plugin
docker compose version

# 方式二：独立二进制（老环境；GitHub 下载慢就提前在外网机器下载后传入）
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose && chmod +x $_
```

### 2. docker-compose.yml 完整示例

一套典型业务：web + mysql + redis，含网络、卷、资源限制、健康检查：

```yaml
version: "3.8"

services:
  web:
    image: harbor.internal.example.com/prod/app-nginx:v1.0
    container_name: app-web
    ports:
      - "80:80"
    volumes:
      - ./nginx/logs:/var/log/nginx
    environment:
      TZ: Asia/Shanghai
      DB_HOST: db
      REDIS_HOST: redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-fs", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
    depends_on:
      - db
      - redis
    networks:
      - app-net
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "1.5"      # compose v2 插件下生效；老版 1.x 用 mem_limit/cpus 字段

  db:
    image: mysql:5.7
    container_name: app-db
    environment:
      MYSQL_ROOT_PASSWORD: "StrongPwd@2026"
      MYSQL_DATABASE: appdb
      TZ: Asia/Shanghai
    volumes:
      - mysql-data:/var/lib/mysql
      - ./mysql/my.cnf:/etc/mysql/conf.d/my.cnf:ro
    restart: always
    networks:
      - app-net

  redis:
    image: redis:6-alpine
    container_name: app-redis
    command: redis-server --requirepass "StrongPwd@2026" --appendonly yes
    volumes:
      - redis-data:/data
    restart: always
    networks:
      - app-net

volumes:
  mysql-data:
  redis-data:

networks:
  app-net:
    driver: bridge
```

要点：同项目服务自动同网络，`DB_HOST: db` 直接写服务名；`depends_on` 只保证启动顺序不保证 mysql 已就绪，应用要自己做连接重试；密码不要明文进 git，用同目录 `.env` 文件引用。

### 3. 常用命令

在 yml 所在目录执行（老版独立二进制写法 `docker-compose`，参数相同）：

```bash
docker compose up -d            # 后台启动全部服务（无镜像会自动 pull/build）
docker compose up -d --build    # 重新构建并更新启动
docker compose ps               # 各服务状态
docker compose logs -f web      # 跟踪某服务日志，不指定名字看全部
docker compose exec web bash    # 进入服务容器
docker compose restart web      # 重启单个服务
docker compose down             # 停止并删除容器、网络（卷保留）
docker compose down -v          # 连卷一起删，数据没了，慎用
docker compose pull             # 更新镜像
docker compose config           # 校验 yml 语法
```

**生产升级套路**：`docker compose pull && docker compose up -d && docker compose logs -f`，观察正常后 Ctrl+C 退出即可。

## 九、私有镜像仓库 Harbor

### 1. 为什么需要与部署思路

内网机器不能上公网、公司要统一镜像版本、权限要分部门管控、上线前要漏洞扫描——这些都靠私有仓库。**Harbor** 是 VMware 开源的企业级仓库（Web 管理、项目权限、镜像复制、Trivy 漏洞扫描、垃圾回收），本质是一套 `docker compose` 拉起的容器化服务，行业事实标准。部署要求一台 2C4G+ 专用机：

```bash
# 1. 下载离线安装包（内网提前在外网机器下载：github.com/goharbor/harbor/releases）
tar xf harbor-offline-installer-v2.9.0.tgz -C /opt/ && cd /opt/harbor

# 2. 复制模板并修改配置
cp harbor.yml.tmpl harbor.yml
vi harbor.yml     # 关键项见下方
```

```yaml
hostname: harbor.internal.example.com   # 本机 IP 或域名
http:
  port: 80
harbor_admin_password: Harbor@2026      # admin 管理员密码
data_volume: /data/harbor               # 数据目录（大磁盘，提前 mkdir）
```

```bash
# 3. 安装（自带 Trivy 漏洞扫描），浏览器访问主机名用 admin 登录后新建项目（prod/test）
./install.sh --with-trivy
docker compose ps    # 验证：一排组件容器全部 healthy
```

### 2. 客户端 login / push / pull

```bash
# http 方式部署时，客户端先在 /etc/docker/daemon.json 加 insecure-registries 后重启 docker：
#   { "insecure-registries": ["harbor.internal.example.com"] }
docker login harbor.internal.example.com -u deployer

# 推送：先按 仓库/项目/镜像:tag 规范打标
docker tag app-nginx:v1.0 harbor.internal.example.com/prod/app-nginx:v1.0
docker push harbor.internal.example.com/prod/app-nginx:v1.0

# 其他内网机器拉取
docker pull harbor.internal.example.com/prod/app-nginx:v1.0
```

生产建议：**用 https**（公司证书，自签需把 CA 分发到客户端 `/etc/docker/certs.d/仓库地址/ca.crt`）；定期备份 `/data/harbor`；磁盘告警要配，满了 push 直接失败。

## 十、生产实践清单

### 1. 资源限制与重启策略：每容器必配

```bash
docker run -d --name app-web \
  --memory=1g --memory-swap=1g --cpus=2 \
  --restart=always \
  harbor.internal.example.com/prod/app-nginx:v1.0

# 验证
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' app-web      # 应输出 always
```

容量规划经验值：JVM 类业务给堆内存的 1.5 倍做限额；所有容器限额之和不超过宿主机内存 80%。重启策略首选 `--restart=always`（容器挂了自动拉起、宿主机重启后也自动起）。

### 2. 日志配置：防磁盘打爆

daemon.json 全局轮转（见第二章），对日志量大的容器可单独覆盖：

```bash
docker run -d --log-driver json-file --log-opt max-size=100m --log-opt max-file=5 \
  --name log-heavy-app my-image:v1
# 验证：输出 {json-file map[...] max-file:5 max-size:100m ...} 即生效
docker inspect -f '{{.HostConfig.LogConfig}}' app-web
```

### 3. 定期清理：写在 crontab

```bash
# 每周日凌晨 2 点：清理创建超过 7 天且未被容器使用的镜像 + 构建缓存
0 2 * * 0 /usr/bin/docker image prune -af --filter "until=168h" >> /var/log/docker-prune.log 2>&1
30 2 * * 0 /usr/bin/docker builder prune -af >> /var/log/docker-prune.log 2>&1
# 每天凌晨 3 点：清理已退出的容器
0 3 * * * /usr/bin/docker container prune -f >> /var/log/docker-prune.log 2>&1
```

> 注意：`image prune -a` 会删掉所有"当前没容器在用"的镜像，回滚镜像也会被清掉；稳妥做法是 prune 前 `docker ps` 核对，或只删悬空镜像（不带 `-a`）。

### 4. 安全要点

- **不用 root 跑业务**：Dockerfile `USER` 指定低权用户，运行时 `--user 1000:1000` 兜底
- **不给业务容器挂 `/var/run/docker.sock`**：等于交出宿主机 root 权限
- **daemon 不裸奔**：不开 2375 无认证远程端口，远程管理走 TLS 或 SSH 隧道
- **镜像扫描**：Trivy 免费开源，Harbor 安装时已自带：

```bash
rpm -ivh trivy-0.50.0.x86_64.rpm                                  # 安装（内网提前下载）
trivy image --severity HIGH,CRITICAL app-nginx:v1.0               # 只输出高危以上
```

- **固定版本 tag** + 只从公司 Harbor 拉镜像，供应链可信

## 十一、常见故障排查

### 1. 容器起不来：标准排查四步

```bash
docker ps -a                          # 1. 看状态和退出码：Exited (137) 2 minutes ago
docker logs --tail 200 app-web        # 2. 看应用日志（最重要，80% 的原因在这里）
docker inspect app-web --format 'ExitCode={{.State.ExitCode}} OOM={{.State.OOMKilled}} Error={{.State.Error}}'
dmesg -T | grep -i -E "oom|killed process"    # 4. 确认是否被内核 OOM 杀掉
```

**退出码对照表（背下来）**：

| 退出码 | 含义 | 生产常见原因 |
|---|---|---|
| 0 | 正常退出 | 前台任务跑完结束（一次性脚本容器属正常） |
| 1 | 应用报错 | 配置错误、连不上数据库/依赖、代码异常 |
| 125 | daemon 自身错误 | run 参数写错、daemon.json 非法 |
| 126 | 命令不可执行 | 文件无执行权限 |
| 127 | 命令找不到 | 镜像里没这个命令/依赖没装全 |
| 137 | 被 SIGKILL (128+9) | **OOM 被内核杀**，或人工 kill -9 |
| 143 | 被 SIGTERM (128+15) | 正常 stop/restart 触发，一般是正常现象 |

高频场景：
- **秒退且退出码 0**：服务用后台方式启动（如 `systemctl start`），Docker 认为"活干完了"。容器必须有**前台常驻进程**，如 `nginx -g "daemon off;"`
- **退出码 1 + 日志报配置错误**：挂载的配置文件路径写错，`docker exec` + `cat` 核对容器内实际文件
- **退出码 137 + OOMKilled=true**：内存限额太小，调大 `--memory` 或查内存泄漏

### 2. 端口冲突

报错特征：`bind: address already in use` 或 `port is already allocated`。

```bash
ss -tlnp | grep -E ':80\b'          # 定位占用者
docker run -d -p 8080:80 --name web-nginx nginx:1.25    # 宿主老 nginx 占了 80 就换端口
# 已映射成功但外部访问不通：firewalld 和云平台安全组两层都要放行
firewall-cmd --permanent --add-port=8080/tcp && firewall-cmd --reload
```

> 云平台环境别忘安全组：宿主机 `firewalld` 和**云控制台安全组**两层都通才行，这是云上最经典的"容器内 curl 通、外面死活不通"陷阱。

### 3. 磁盘占满处理

```bash
df -h                                                    # 确认哪个盘满（通常 /var/lib/docker 所在盘）
docker system df                                         # Docker 占用分布：镜像/容器/卷/缓存
du -sh /var/lib/docker/containers/* | sort -rh | head    # 定位超大容器目录

# 1. 容器日志失控（最常见根因）：紧急清空用 truncate，不要 rm（rm 后空间不释放）
ls -lh /var/lib/docker/containers/*/*-json.log | sort -k5 -h | tail
truncate -s 0 /var/lib/docker/containers/<容器ID>/<容器ID>-json.log
# 根治：daemon.json 配 max-size/max-file 并重建容器（见第二章、第十章）

# 2. 清理 Docker 垃圾
docker container prune && docker image prune -af --filter "until=168h" && docker builder prune -af
docker volume prune        # 删数据！逐个 docker volume inspect 确认再执行

# 3. 系统日志瘦身
journalctl --disk-usage && journalctl --vacuum-size=200M
```

### 4. 其他高频踩坑

| 症状 | 根因 | 处理 |
|---|---|---|
| firewalld 重启后容器全部没网 | firewalld reload 清掉了 Docker 的 iptables 规则 | `systemctl restart docker` 恢复；装 Docker 的机器避免频繁 reload firewalld |
| 服务器重启后容器没自动起 | 没配 `--restart=always` | 重建容器带上，或 `docker update --restart=always 容器名` |
| 容器内时间差 8 小时 | 默认 UTC 时区 | `-e TZ=Asia/Shanghai` 或 `-v /etc/localtime:/etc/localtime:ro` |
| 改 daemon.json 后 docker 起不来 | JSON 语法错误（逗号引号） | `journalctl -u docker -n 50` 看报错，修好再 restart |
| 容器内解析不了域名 | DNS 问题 / 网段冲突 | run 加 `--dns 114.114.114.114`；检查自定义网段是否撞内网 |
| 镜像拉取超时 | 加速器失效 | 换可用加速器（第三章第 3 节），或从 Harbor 拉 |

## 十二、生产上线 Checklist

| 检查项 | 检查方法 | 达标标准 |
|---|---|---|
| 镜像来源可信、版本固定 | `docker images`、Harbor 项目归属 | 来自公司 Harbor，tag 为具体版本，非 latest |
| 漏洞扫描 | Harbor 扫描结果 / `trivy image` | 无未处置的高危（HIGH/CRITICAL）漏洞 |
| 资源限制 | `docker inspect -f '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}}' 容器名` | memory/cpus 已按容量规划设置 |
| 日志轮转 | `docker inspect -f '{{.HostConfig.LogConfig}}' 容器名` | max-size/max-file 生效，单实例日志有上限 |
| 重启策略 | `docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' 容器名` | always（或 unless-stopped） |
| 数据持久化 | `docker volume inspect`、挂载列表 | 数据全落卷/宿主目录，卷已纳入备份计划 |
| 健康检查 | `docker ps` STATUS 列 | 显示 (healthy)，接入监控告警 |
| 非 root 运行 | `docker exec 容器名 id -u` | 非 0 |
| 端口与防火墙 | `ss -tlnp`、`firewall-cmd --list-ports`、云安全组 | 端口最小化放行，云安全组同步配置 |
| daemon 生产配置 | `docker info` | live-restore 已开、日志轮转已配 |
| 清理与备份任务 | `crontab -l` | prune 定时任务在跑、数据备份定时任务在跑 |
| 监控告警接入 | `docker stats --no-stream`、监控平台 | CPU/内存/磁盘/容器存活均有告警 |
| 回滚预案 | 演练记录 | 知道如何快速回滚旧版本镜像、如何 down/up 重建 |

> AI生成
