---
title: Docker 从入门到生产实战
category: Linux进阶
tags:
  - Linux
  - Docker
  - 容器
---

# Docker 从入门到生产实战

> 这是一套照着敲就能全部做出来的实验：做完你会亲手装好 Docker 并跑通第一个容器 → 把一个 nginx 网页服务跑起来、让 Windows 浏览器能打开 → 钻进容器内部看个明白、学会看日志 → 把数据挂到容器外面（容器删了数据也不丢）→ 做出两张属于自己的镜像 → 用一个 yml 文件同时拉起两个配合工作的服务 → 最后把机器收拾干净。全程只需要你那台 CentOS 7 虚拟机。文末附「生产速查」，上班后当手册翻。

## 实验环境准备

**这台虚机要满足什么：**

| 条件 | 要求 | 为什么 |
|---|---|---|
| 系统 | CentOS 7（64 位） | 本篇所有命令、预期输出都在这个系统上验证 |
| 内存 | 建议 4G（2G 勉强能跑） | 实验六要同时跑两个容器 |
| 磁盘 | 剩余 20G 以上 | 安装包 + 镜像要占几百 MB |
| 网络 | 必须能上网 | 安装包从阿里云下载、镜像从仓库拉取 |
| 用户 | 直接用 root 登录 | 命令涉及系统目录和防火墙，入门阶段别折腾 sudo |
| 强烈建议 | 实验前给虚机拍个快照 | 玩坏了 30 秒满血复活 |

**动手前确认三件事**（在虚机终端里敲，敲完对照下面的预期输出）：

```bash
cat /etc/redhat-release    # 确认系统版本
free -h                    # 确认内存
ping -c 3 mirrors.aliyun.com >/dev/null && echo "网络 OK"   # 确认能连上阿里云
```

预期输出（看到这几行就是就绪）：

```
CentOS Linux release 7.9.2009 (Core)
              total        used        free      shared  buff/cache   available
Mem:           3.7G        180M        3.2G        8.0M       296M        3.3G
网络 OK
```

**🩹 如果 yum 直接报错**：CentOS 7 已于 2024 年停止维护，官方源服务器已下线，老虚机第一次跑 yum 常见报错 `Could not resolve host: mirrorlist.centos.org`。一次性修复——把系统源换成阿里云的"档案库"（vault）：

```bash
sed -i -e 's|^mirrorlist=|#mirrorlist=|g' -e 's|^#baseurl=http://mirror.centos.org/centos/$releasever|baseurl=https://mirrors.aliyun.com/centos-vault/7.9.2009|g' /etc/yum.repos.d/CentOS-*.repo
yum clean all && yum makecache    # 最后能跑完不报错就是修好了
```

另外：如果这台虚机以前装过老版本 docker，不用提前处理，实验一第 1 步会自动把它卸载掉。

## 实验一：安装 Docker，跑通你的第一个容器

### 🎯 目标

这一步要干成的**一件事**：在这台虚机上装好 Docker 服务，并跑通官方测试容器 hello-world。**为什么要它**：Docker 是把"应用程序 + 它依赖的一切"打包成集装箱运输的工具，以后你要上线的任何服务（网页、数据库、定时任务）都能做成一个个集装箱，一键起、一键删、换台机器跑出来一模一样。装好它，后面 6 个实验才有舞台。

先记三个词，⚠️【必考】：

- **镜像（Image）**：只读的"安装包"，里面装好了程序和依赖
- **容器（Container）**：把安装包装起来跑着的"活进程"，一个镜像可以起 N 个互不干扰的容器
- **仓库（Registry）**：放安装包的"应用商店"（如 Docker Hub，国内一般走加速代理）

口诀：**镜像好比安装包，容器好比装好的软件，仓库好比应用商店**。

### 📍 在哪动手

全程在你的 CentOS 7 虚机终端里敲命令（root 用户）；唯一要写的文件是 `/etc/docker/daemon.json`——这是 Docker 后台服务（守护进程）的配置文件。

### 🔧 动手做

```bash
# ── 第 1 步：卸载老版本（老 Docker 与新版冲突；提示 No Match for argument 说明本来就没装，直接往下走）──
yum remove -y docker docker-client docker-common \
  docker-latest docker-latest-logrotate docker-logrotate docker-engine

# ── 第 2 步：装依赖工具，并把阿里云的 docker-ce 源加进 yum ──
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# ── 第 3 步：安装 Docker（-y 表示全自动确认，不用你按 y）──
yum install -y docker-ce docker-ce-cli containerd.io
```

然后写守护进程配置文件（这条文件路径记牢）：新建 `vi /etc/docker/daemon.json`，按 `i` 进入编辑、贴入以下内容，`Esc` 后输 `:wq` 保存：

```json
{
  "registry-mirrors": ["https://docker.m.daocloud.io"],
  "log-driver": "json-file",
  "log-opts": { "max-size": "100m", "max-file": "3" },
  "live-restore": true
}
```

这份文件配了三件事，实验环境照这个练、上班直接照抄：

- `registry-mirrors`：拉镜像走这个"中转站"——直连国外仓库基本拉不动，这是第一个要配的原因
- `log-opts`：单个日志文件最大 100MB、最多留 3 份自动轮换。**不配它，业务一刷日志就能把磁盘写爆**
- `live-restore`：升级/重启 Docker 服务本身时，业务容器不跟着断——生产必开（实验七会亲眼验证这个效果）

启动服务：

```bash
systemctl daemon-reload        # 刚写了新配置文件，让 systemd 重新读取服务定义
systemctl enable --now docker  # 设开机自启 + 立即启动，一条顶两条
```

### ✅ 怎么算成功

验证命令 `docker version`（**Client 和 Server 两段都有**就说明客户端和后台服务都活了；CentOS 7 上装到的最高版本就是 24.0.9，正常）：

```
Client: Docker Engine - Community
 Version:    24.0.9
 ...
Server: Docker Engine - Community
  Version:    24.0.9
```

加速器是否生效：`docker info | grep -A3 "Registry Mirrors"` 应列出 `https://docker.m.daocloud.io/`。然后是第一个正反馈时刻——跑官方测试容器 `docker run hello-world`，预期输出：

```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

**看到 `Hello from Docker!` 这一行，实验一就算全部成功。**

顺便看懂刚才这几秒发生了什么（Docker 在输出后半段自己写了说明书）：你敲的 `docker` 命令只是个**客户端**（传话的）→ 它把活派给后台**守护进程**（真正干活的）→ 守护进程发现本地没有这个**镜像**，去**仓库**拉了一份 → 照着镜像起了一个一次性**容器**，把结果打回你的屏幕。

最后看一眼容器清单 `docker ps -a`，预期输出：

```
CONTAINER ID   IMAGE         COMMAND     CREATED          STATUS                      NAMES
a1b2c3d4e5f6   hello-world   "/hello"    2 minutes ago    Exited (0) 2 minutes ago    cranky_tesla
```

❗【易错】STATUS 是 `Exited (0)` **不是失败**：hello-world 是"打印一句话就收工"的一次性容器，退出码 0 = 正常干完。常驻服务容器会一直 `Up`，实验二就见。

### 🩹 如果不对

1. **卡在拉取**：`error pulling image configuration ... i/o timeout`——加速器不可用。去阿里云控制台 `cr.console.aliyun.com` 左侧「镜像加速器」领一个你的专属地址（形如 `https://xxxxx.mirror.aliyuncs.com`），替换 daemon.json 里 `registry-mirrors` 的值，再 `systemctl restart docker`
2. **`Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`**——服务没起来。`systemctl status docker -l` 看报错，十有八九是 daemon.json 写坏了（少逗号、多引号），`journalctl -u docker -n 50` 能看到具体哪一行错，改完再 `systemctl restart docker`

## 实验二：跑一个真正有用的容器——nginx 网页服务

### 🎯 目标

hello-world 只是玩具，这次干一件真正有用的事：**把虚机变成一台网页服务器，让你 Windows 办公电脑的浏览器能打开它**。做完你会掌握容器时代最高频的一条命令 `docker run` 和它最重要的三个参数（起名、后台、端口映射）。以后公司里"一个服务 = 一个容器"，全是这个套路。

### 📍 在哪动手

还在你的 CentOS 7 虚机终端里，只敲命令，不写文件。起的是实验一已经拉好环境的 Docker。

### 🔧 动手做

```bash
docker run -d --name web-nginx -p 8080:80 nginx:1.25
```

逐个参数什么意思（⚠️【必考】）：

- `nginx:1.25`：用哪个镜像。❗【易错】生产禁止不带版本号（不带就是 latest "最新版"，哪天别人一升级你就翻车），要哪版就写死哪版
- `-d`：后台运行，把终端还给你（不加的话终端会被容器占住，你一按 Ctrl+C 容器就停了）
- `--name web-nginx`：给容器起个名，以后 stop/logs/rm 都喊这个名字，不用记随机 ID
- `-p 8080:80`：端口映射。口诀：**冒号左边宿主机（虚机对外），右边容器（里面）**。nginx 在容器里监听 80，这一句把虚机的 8080 门牌接到了它的 80 上

### ✅ 怎么算成功

`docker run` 本身会先拉镜像再起容器，输出长这样（之后还会再打印一串 64 位容器 ID）：

```
Unable to find image 'nginx:1.25' locally
1.25: Pulling from library/nginx
...
Status: Downloaded newer image for nginx:1.25
```

看它活着没有（`docker ps`，重点看 STATUS 列）：

```
CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS          PORTS                                     NAMES
d3f5b2a8f1c9   nginx:1.25    "/docker-entrypoint.…"   30 seconds ago   Up 29 seconds   0.0.0.0:8080->80/tcp, :::8080->80/tcp    web-nginx
```

`Up` 说明它一直活着（对比实验一 hello-world 的 `Exited (0)`）。本机验证 `curl -I http://127.0.0.1:8080`，预期输出：

```
HTTP/1.1 200 OK
Server: nginx/1.25.5
Content-Type: text/html
```

浏览器验证（这一步在 Windows 宿主机上做）：Windows 浏览器打开 `http://192.168.x.x:8080`，看到大大的 **Welcome to nginx!** 页面，实验二就成功了。注意 curl 走的是本机回环、**不经过防火墙**，外部访问才过，所以还要放行 8080：

```bash
ip addr show eth0 | grep inet                  # 先查虚机 IP，拿到形如 192.168.x.x 的地址
firewall-cmd --permanent --add-port=8080/tcp    # 防火墙放行 8080
firewall-cmd --reload                          # 重载生效
```

### 🩹 如果不对

1. **`docker: Error response from daemon: ... listen tcp4 0.0.0.0:8080: bind: address already in use`**——8080 被别的程序占了。`ss -tlnp | grep :8080` 找到占用者；不认识就换个端口，比如 `-p 8081:80`
2. **curl 通、浏览器打不开**——① 防火墙没放行（执行上面 firewall-cmd 两条）；② 云上的虚机还要去云控制台放行**安全组**。❗【易错】云上有两层墙：系统 firewalld + 平台安全组，**两层都通才行**，这是云上最经典的"容器里明明好的，外面就是不通"

## 实验三：钻进容器内部看看，顺便学会看日志

### 🎯 目标

上一轮网页跑起来了，但容器对你来说还是个黑盒。这一步干两件事：**亲手进去看一眼**——确认"容器其实就是个迷你 Linux"，以后排障才敢下手；**学会看容器日志**——容器出问题时的第一现场。

### 📍 在哪动手

还在虚机终端。进去的对象是实验二起的 `web-nginx` 容器（它必须处于运行中，`docker ps` 里是 Up 的状态才能进）。

### 🔧 动手做

```bash
docker exec -it web-nginx bash
```

- `exec`：往一个**正在运行**的容器里派一个新进程（容器该干嘛还干嘛，不受影响）
- `-it`：给这个进程一个交互终端，让你能敲字
- `bash`：派进去的是个 shell

进去后提示符变了：

```
root@d3f5b2a8f1c9:/#
```

`@` 后面就是容器 ID——现在你站在**容器里面**。看看这个"迷你 Linux"长什么样：

```bash
hostname                       # 容器有自己的主机名（就是容器 ID）
cat /etc/os-release | head -1  # 容器自带一套极简系统，这个 nginx 镜像里是 Debian
ls /usr/share/nginx/html       # 网页根目录，index.html 就在这里
ps -ef                         # 只能看到容器自己的进程
```

`ps -ef` 预期输出（注意 1 号进程就是 nginx 主进程，整个容器里只有它自己的进程，看不见宿主机的）：

```
UID    PID PPID  C STIME TTY  TIME CMD
root     1     0  0 10:02 ?   00:00:00 nginx: master process nginx -g daemon off;
nginx   30     1  0 10:02 ?   00:00:00 nginx: worker process
```

❗【易错】如果提示 `bash: ps: command not found`，说明这个精简镜像没带 ps 命令（alpine 类迷你系统很常见），用 `cat /proc/1/cmdline` 也能看到 1 号进程。

动手改一下页面（给实验五留个伏笔）：

```bash
echo "<h1>I changed the page inside the container</h1>" > /usr/share/nginx/html/index.html
exit    # 退出的是你的 bash 会话，容器本身继续跑
```

容器还活着，而且改动即时生效：

```bash
docker ps                        # web-nginx 还是 Up
curl -s http://127.0.0.1:8080    # 输出你刚写的那行 —— 顺手每次访问都会记进日志
```

看日志（排障第一现场），每 curl 一次，`-f` 跟着的日志里就多一条 `GET / ...` 记录：

```bash
docker logs web-nginx                # 一次性看全部
docker logs -f --tail 5 web-nginx    # 只跟踪最后 5 行，Ctrl+C 退出（同 tail -f）
```

不进去也能派命令（排障常用，比如改完配置验语法）：`docker exec web-nginx nginx -t`，预期输出：

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### ✅ 怎么算成功

四个证据：① 进容器后提示符变成 `root@容器ID:/#`；② `cat /etc/os-release` 看到是 Debian 而不是 CentOS（容器自带一套自己的极简系统）；③ `exit` 后 `docker ps` 里 web-nginx 依然是 Up、`curl` 还能访问；④ `docker logs` 能刷出访问记录。

### 🩹 如果不对

1. **`OCI runtime exec failed: exec: "bash": executable file not found in $PATH`**——这个镜像里没有 bash（alpine 这类迷你系统只有 sh），把命令里的 bash 换成 sh
2. **`the input device is not a TTY`**——忘了 `-t`，敲全 `docker exec -it 容器名 bash`

## 实验四：数据卷——把数据放到容器外面，容器删了也不丢

### 🎯 目标

先戳一个痛点。你实验三在容器里改的页面，现在把容器删了再照原样起一个：

```bash
docker rm -f web-nginx                                # 直接删掉这个容器
docker run -d --name web-nginx -p 8080:80 nginx:1.25  # 照原样再起一个
curl -s http://127.0.0.1:8080 | head -n 2             # 你上一轮改的页面没了，变回默认页
```

结论一句话：**容器里的一切改动，都随容器删除陪葬**。生产上把数据库、网页、配置放容器里，等于裸奔。这个实验要干成的事：**把数据放到宿主机上，用"挂载"接进容器——容器随便删随便换，数据原地不动**，并且做到"不重启容器、改文件页面立刻变"。

### 📍 在哪动手

虚机终端。先在**宿主机**（虚机本身）建目录 `/data/nginx/html`，再把 Docker 容器挂上去。

### 🔧 动手做

绑定挂载（把宿主机目录"接"进容器）：

```bash
mkdir -p /data/nginx/html                                     # 宿主机建目录，专门放网页
echo "<h1>My page v1 (from host)</h1>" > /data/nginx/html/index.html
docker rm -f web-nginx
docker run -d --name web-nginx -p 8080:80 \
  -v /data/nginx/html:/usr/share/nginx/html:ro \
  nginx:1.25
```

- `-v 宿主机路径:容器内路径`：⚠️【必考】跟 `-p` 一样"左宿主、右容器"。容器里看到的就是宿主机这份文件
- 末尾 `:ro` = read only，容器内只能读不能写，防止容器里的程序反过来改宿主机文件（生产挂配置常用）

本篇最核心的卖点——**不重启容器，热更新**：

```bash
echo "<h1>My page v2 (hot update, no restart)</h1>" > /data/nginx/html/index.html
curl -s http://127.0.0.1:8080     # 立刻就是 v2，容器一次都没重启
```

再验证"删容器不丢数据"：

```bash
docker rm -f web-nginx
docker run -d --name web-nginx -p 8080:80 -v /data/nginx/html:/usr/share/nginx/html:ro nginx:1.25
curl -s http://127.0.0.1:8080     # 还是 v2 —— 数据在宿主机，跟容器共存亡的只有容器自己
```

数据库这类"不该让人直接碰"的数据，用**具名卷**（Docker 统一保管的卷）：

```bash
docker volume create my-data     # 创建一个由 Docker 统一保管的卷
# 第一个"一次性容器"往卷里写一行字，写完自动销毁（--rm = 退出即自动删除，一次性工具容器标准写法）
docker run --rm -v my-data:/data alpine sh -c 'echo "important data" > /data/note.txt'
# 换第二个"一次性容器"去读
docker run --rm -v my-data:/data alpine cat /data/note.txt
```

容器换了一个又一个，卷里的数据还在。看看 Docker 把卷实际放哪了：

```bash
docker volume inspect my-data
```

```
[
    {
        "Mountpoint": "/var/lib/docker/volumes/my-data/_data",
        "Name": "my-data",
        ...
    }
]
```

Docker 把卷实际存到了这个路径。绑定挂载（挂指定目录）+ 具名卷（Docker 托管）覆盖 99% 场景；还有一种匿名卷（只写容器路径、名字随机生成）难辨认难管理，尽量少用。

### ✅ 怎么算成功

四个证据：① 挂载后 curl 看到宿主机写的那行字；② 改宿主机文件、**不重启容器**，curl 立刻变 v2；③ 删容器重新起，页面还是 v2；④ 两个 alpine 一次性容器一写一读，第二个输出 `important data`。

### 🩹 如果不对

1. **`curl` 返回 403 Forbidden**——你把一个**空目录**挂上去了，把容器里原有的 index.html"盖住"了（挂载就是覆盖）。先在宿主机目录里把 index.html 写好、再挂载，顺序别反
2. **`docker: Error response from daemon: invalid mount config for type "bind": bind source path does not exist: /data/nginx/html`**——宿主机路径不存在，先 `mkdir -p` 建好再挂

## 实验五：做出你自己的镜像——先偷懒（commit），后正规（Dockerfile）

### 🎯 目标

前面你改页面都是"手工在容器里改"，容器一删就没（实验四靠挂载救了数据）。这个实验要干成的事：**把"改好的状态"固化成一个新镜像，谁拿到都能一键复现**。教你两种做法，并说清为什么生产只用第二种。口诀：**commit 是拍快照，Dockerfile 是菜谱**——照片说不清过程，菜谱谁拿到都能重炒一遍。

### 📍 在哪动手

虚机终端。Dockerfile 阶段要在宿主机建一个专门目录 `/root/build-demo`，把"菜谱"和"原料"放一起。

### 🔧 动手做

**先看快照式（docker commit）：**

```bash
docker run -d --name app-ori -p 8083:80 nginx:1.25    # 起一个"原始"容器（这次故意不挂卷）
docker exec app-ori sh -c 'echo "<h1>app v1, made by me</h1>" > /usr/share/nginx/html/index.html'
curl -s http://127.0.0.1:8083     # app v1, made by me —— 改动目前只存在于容器里
docker commit -m "v1: change index page" app-ori my-app:v1   # 给容器拍快照，存成镜像 my-app:v1
docker rm -f app-ori              # 把原容器删掉！
docker run -d --name app-v1 -p 8084:80 my-app:v1     # 用自己的镜像起新容器
curl -s http://127.0.0.1:8084     # 还是 app v1 —— 容器删了，改动通过镜像活了下来
```

`docker commit` 输出一串 `sha256:` 开头的镜像 ID 就是成功。**但 commit 有三个天生缺陷**：① 菜谱在哪？没人知道你当时敲了什么；② 不可复现，换台机器做不出一样的；③ 镜像里全是"祖传积淀"，越滚越大。生产正确姿势是 Dockerfile：

**正规军（Dockerfile）：**

```bash
mkdir -p /root/build-demo && cd /root/build-demo     # 建一个干净目录，菜谱和原料放一起
echo "<h1>app v1 from Dockerfile</h1>" > index.html  # 原料：网页文件
vi Dockerfile                                        # 菜谱（注意文件名必须精确叫这个）
```

Dockerfile 内容（一共 3 行有效指令）：

```dockerfile
FROM nginx:1.25           # 打地基：以官方 nginx:1.25 镜像为起点（第一条必须是它）
COPY index.html /usr/share/nginx/html/index.html   # 把菜谱旁边这个文件复制进镜像的网页目录
EXPOSE 80                 # 声明本镜像用 80 端口对外服务（写给人看的说明书，真正开门还得靠 run -p）
```

照菜谱做镜像、跑起来验证：

```bash
docker build -t my-app:image-v1 .     # -t 给镜像起名；末尾这个点 = 构建上下文 = 当前目录
docker run -d --name app-from-df -p 8085:80 my-app:image-v1
curl -s http://127.0.0.1:8085          # app v1 from Dockerfile
```

### ✅ 怎么算成功

`docker build` 过程会逐条执行菜谱，关键输出：

```
Step 1/3 : FROM nginx:1.25
Step 2/3 : COPY index.html /usr/share/nginx/html/index.html
Step 3/3 : EXPOSE 80
Successfully tagged my-app:image-v1
```

三个证据：① commit 版容器删掉后，用 `my-app:v1` 起的新容器 curl 仍输出 `app v1, made by me`；② build 顺利走到 `Successfully tagged`；③ `curl http://127.0.0.1:8085` 输出 `app v1 from Dockerfile`。

顺带认识一个概念：**镜像是千层饼**，一条指令叠一层。`docker history my-app:image-v1` 能看到每一层是哪条指令摞出来的（也是日后排查"镜像为什么这么大"的工具）。

### 🩹 如果不对

1. **`unable to prepare context: unable to evaluate symlinks in Dockerfile path ...` 或 `COPY failed: file not found`**——两个高频原因：文件名必须精确叫 `Dockerfile`（区分大小写）；COPY 的源文件必须跟 Dockerfile 在同一个目录（构建上下文），build 命令末尾那个点别漏
2. **commit 出来的镜像里没有我挂载目录里的那些文件**——bind mount 挂进来的内容属于宿主机，**不会**被打进镜像，这是设计如此。要固化内容就写 Dockerfile 用 COPY

## 实验六：docker compose——一个 yml 文件拉起一套服务

### 🎯 目标

到这里你已经会"一条 docker run 起一个容器"了。但真实业务从来不是单打独斗：一个网站 = 前端 + 后端 + 数据库，三条 run 又长又难维护。这个实验要干成的事：**写一个 docker-compose.yml，一条命令同时拉起两个互相配合的容器**——一个 frontend 收请求、转发给 backend 处理。你还会亲眼见到容器之间**用名字互相找到对方**（这是容器网络最核心的知识点）。

### 📍 在哪动手

虚机终端。工作目录是新建的 `/root/compose-demo`，要写 3 个文件：`backend/index.html`、`frontend/default.conf`、`docker-compose.yml`。

### 🔧 动手做

先把前面实验还在跑的容器全停掉（腾出 8080 端口），装上 compose 插件：

```bash
docker stop $(docker ps -q)              # 停掉当前所有在跑的容器（容器还在，实验七统一清理）
yum install -y docker-compose-plugin     # 装 compose 插件，跟 docker 同一个阿里云源
docker compose version
```

```
Docker Compose version v2.24.6
```

搭工程骨架，先准备"原料"：

```bash
mkdir -p /root/compose-demo/{frontend,backend} && cd /root/compose-demo
echo "<h1>Hi, I am the BACKEND api</h1>" > backend/index.html   # 后端要展示的内容
vi frontend/default.conf
```

frontend 的转发配置（这个文件挂进容器后会覆盖 nginx 默认配置）：

```nginx
server {
    listen 80;
    location / {
        proxy_pass http://backend/;   # 收到的请求全部转发给 backend 容器
    }
}
```

⚠️【必考】注意写的是服务名 `backend`，**不是 IP**。容器 IP 重启就变，但 compose 会给同一套服务自动建一个专属网络，网络里**容器名 = 域名**，直接喊名字。

然后写总菜谱 `docker-compose.yml`：

```yaml
version: "3.8"

services:
  frontend:                     # 第一个服务：门口的接待员
    image: nginx:1.25
    container_name: demo-frontend
    ports:
      - "8080:80"               # 整套服务只有它对外开门
    volumes:
      - ./frontend/default.conf:/etc/nginx/conf.d/default.conf:ro   # 挂上转发配置
    depends_on:
      - backend                 # 先起 backend 再起自己（只管启动顺序）
    restart: always

  backend:                      # 第二个服务：真正干活的
    image: nginx:1.25
    container_name: demo-backend
    volumes:
      - ./backend/index.html:/usr/share/nginx/html/index.html:ro
    restart: always
```

一条命令拉起整套：

```bash
docker compose up -d
```

```
[+] Running 2/2
 ✔ Container demo-backend   Started
 ✔ Container demo-frontend  Started
```

### ✅ 怎么算成功

验证两个容器真的在配合（这条链路：你 → frontend(8080) → 转发 → backend(80) → 返回），并看这套服务的阵容（`docker ps` 里也能看到同样两个容器）：

```bash
docker compose ps
curl -s http://127.0.0.1:8080
```

```
NAME            IMAGE         COMMAND                  SERVICE     CREATED          STATUS
demo-backend    nginx:1.25    "/docker-entrypoint.…"   backend     12 seconds ago   Up 11 seconds
demo-frontend   nginx:1.25    "/docker-entrypoint.…"   frontend    11 seconds ago   Up 11 seconds

<h1>Hi, I am the BACKEND api</h1>
```

**看到这句话**就成功了——你请求的是 frontend 的 8080，回答你的是 backend 的页面。Windows 浏览器打开 `http://192.168.x.x:8080` 同样能看到（8080 防火墙实验二已放行）。再验证"容器名当域名"不是玄学：`docker exec demo-frontend getent hosts backend` 应输出一行 `172.` 开头的 IP + `backend`——frontend 容器里能把名字解析成对方 IP，这就是 compose 专属网络内置 DNS 干的活。

### 🩹 如果不对

1. **`yaml: line 6: mapping values are not allowed in this context`**——yml 缩进错了。❗【易错】yml **只能用空格、不能用 Tab**，层级靠缩进表达，建议每级 2 个空格。改完可用 `docker compose config` 先校验语法再 up
2. **`... bind: address already in use`**——8080 还被占着（前面实验的容器没停干净），先 `docker stop $(docker ps -q)` 再 `docker compose up -d`
3. **`Error response from daemon: Conflict. The container name "/demo-frontend" is already in use ...`**——上次 up 过没 down 就改了配置/名字。在 compose-demo 目录里执行 `docker compose down` 再 up

## 实验七：收尾管理——让容器自动复活，再把机器收拾干净

### 🎯 目标

两件事。① 学生产上的"保命配置"：容器挂了自己爬起来、升级 Docker 不连累业务——两个知识点实验一就埋了种子（`live-restore`），这里亲眼验证。② 把七个实验的容器、镜像、缓存收拾干净，顺便学会"看 Docker 在磁盘上占了什么、怎么清"。

### 📍 在哪动手

虚机终端；其中 `docker compose down` 必须在 `/root/compose-demo` 目录里执行（compose 按"当前目录的 yml"认服务）。

### 🔧 动手做

先验证实验六 yml 里的 `restart: always` 生效了没有：`docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' demo-frontend` 应输出 `always`（老容器当时没配的可以补救：`docker update --restart=always 容器名`，生产上非常常用。⚠️【必考】`--restart=always` 意味着：容器挂了自己爬起来，**虚机重启后也自动拉起**。）

再亲眼验证 `live-restore`——重启 Docker 服务本身，业务容器居然不断：

```bash
systemctl restart docker
docker ps
```

demo-frontend、demo-backend 的 STATUS 还是 `Up`、启动时间没变——这就是实验一 daemon.json 里 `"live-restore": true` 的效果。要是没配它，这一下所有容器都得跟着断一次。生产两件套记牢：**`--restart=always`（容器挂了自己爬）+ `live-restore`（升级 docker 不连累业务）**。

然后收拾实验环境：

```bash
cd /root/compose-demo
docker compose down                              # 停止并删除这套服务（容器+网络；卷保留）
docker rm -f web-nginx app-v1 app-from-df        # 删掉前面实验留下的容器（-f = 运行中也直接删）
docker rmi my-app:v1 my-app:image-v1 hello-world # 删掉自制镜像和测试镜像
docker image prune                               # 只清“悬空”的残留层（名字显示 <none> 的那种）
docker system df                                 # 看看 Docker 在磁盘上还占着什么
docker ps -a                                     # 复核：应该基本是空的（各实验容器已删干净）
```

`docker compose down` 的输出会逐行显示 Removed 掉两个容器和一张 `compose-demo_default` 网络。

### ✅ 怎么算成功

```bash
docker system df
```

```
TYPE            TOTAL   ACTIVE   SIZE       RECLAIMABLE
Images          2       0        234MB      234MB (100%)
Containers      0       0        0B         0B
Local Volumes   1       0        1.5kB       1.5kB (100%)
Build Cache     0       0        0B         0B
```

还剩的 2 个镜像是 nginx:1.25 和 alpine，1 个卷是 my-data——留它们复习用。TYPE 列那四行就是 Docker 吃磁盘的四个地方：镜像、容器（含日志）、卷、构建缓存。**生产上 `docker system prune -a` 一键全清是深水炸弹**：会把所有"当前没容器在用"的镜像全删掉，回滚镜像也保不住，清理套路见文末速查。

### 🩹 如果不对

1. **`Error response from daemon: You cannot remove a running container ... Stop the container before attempting removal`**——容器还在跑不让删：先 stop 再 rm，或者直接 `rm -f`
2. **`Error response from daemon: conflict: unable to remove repository reference "my-app:v1" ... is using its referenced image`**——还有容器（哪怕是已退出的）在用这个镜像。先 `docker ps -a` 找到对应容器 rm 掉，再 rmi

## 收尾：你现在会了什么

七个实验串起来就是一条完整主线：**装好引擎（一）→ 跑起服务（二）→ 进去排障（三）→ 数据外挂（四）→ 做出镜像（五）→ 一键编排（六）→ 停删清理（七）**——这就是公司里把一个业务搬上容器的全部动作。

- 三件套你已经不只是背概念，是亲手用过了：**镜像=安装包，容器=装好的软件，仓库=应用商店**；仓库拉镜像 → 镜像起容器 → 容器里的改动随删除消失（所以要挂卷）
- 遇到问题你知道先看哪：`docker ps -a` 看状态和退出码 → `docker logs` 看第一现场 → 再决定 exec 进去还是看挂载

容器和虚拟机的区别（面试常问、选型常用）：

| 对比项 | 容器（Docker） | 虚拟机（KVM/VMware） |
|---|---|---|
| 隔离级别 | 进程级（共享宿主机内核） | 硬件级（独立内核） |
| 启动速度 | 秒级 | 分钟级 |
| 资源占用 | MB 级，单机可跑上百个 | GB 级，受限于内存 |
| 适用场景 | 单一应用、快速交付、弹性扩缩 | 完整 OS、强隔离、多租户 |

一句话：**虚拟机隔离重、容器交付快**，云平台常见组合是"虚拟机当节点 + 容器跑业务"——你实验里那台 CentOS 虚机就是"节点"，里面跑的 nginx 就是"业务"。

你离生产的差距也不大，就差几样"规范件"：资源限额、日志轮转策略、健康检查、私有仓库、定时清理——下面速查区全有，上班照抄即可。

## 生产速查（收藏区）

实验教的是主线动作，这一节收的是生产模板和排障经验，上班后当手册翻。

### 1. 安装与 daemon.json

```bash
# 固定版本安装：生产必须写死版本，禁止让 yum 自己挑"最新"
yum list docker-ce --showduplicates | sort -r
yum install -y docker-ce-24.0.9-1.el7 docker-ce-cli-24.0.9-1.el7 containerd.io
```

加速器优先级：**公司私有仓库（Harbor）> 云厂商专属加速器 > 社区公共代理**（2024 年后 Docker Hub 直连基本拉不动，公共加速器也时好时坏）：

- 阿里云专属：登录 `cr.console.aliyun.com` → 左侧「镜像加速器」，形如 `https://<你的ID>.mirror.aliyuncs.com`，每个账号一个
- 腾讯云内网机器：`https://mirror.ccs.tencentyun.com`（仅腾讯云内网可用）
- 社区代理示例：`https://docker.m.daocloud.io`

daemon.json 关键项速查（实验一配过的三件套 + 对接私有仓库）：

| 配置项 | 作用 | 生产要点 |
|---|---|---|
| `registry-mirrors` | 拉镜像的中转站 | 可写多个，依次尝试 |
| `log-driver` + `log-opts` | 日志轮转：单文件最大 100m、最多 3 份 | **不配它磁盘会被日志打爆**；只对新建容器生效，老容器需重建 |
| `live-restore` | 重启/升级 docker 服务时容器不中断 | **生产必开**（实验七亲测） |
| `insecure-registries` | 对接 http 私有仓库时加仓库地址 | 见下方 Harbor 节 |

验证：`docker info | grep -A3 "Registry Mirrors"`。

### 2. 镜像管理

```bash
docker search nginx                          # 搜索公共镜像
docker pull nginx:1.25                       # 拉指定版本；❗不带 tag 就是 latest，生产禁止
docker images                               # 列出本地镜像
docker inspect nginx:1.25                    # 镜像完整元数据（入口、环境变量、卷定义）
docker history nginx:1.25                    # 分层构建史，排查镜像为什么大
docker tag nginx:1.25 harbor.internal.example.com/prod/nginx:1.25   # 打标签（推私有仓库前必做）
docker rmi nginx:1.25                        # 删镜像
docker image prune                           # 清悬空镜像（<none> 残留层）
docker image prune -a --filter "until=168h"  # 清 7 天未使用的镜像（配定时任务用）
# 离线交付：内网机器拉不了镜像时，"能上网的机器导出 → 拷贝 → 导入"
docker save nginx:1.25 | gzip > nginx-1.25.tar.gz   # save/load 针对镜像，保留分层（推荐）
gunzip -c nginx-1.25.tar.gz | docker load
docker export web-nginx > web-snap.tar              # export/import 针对容器快照，丢历史（应急用）
docker import web-snap.tar my-app:snapshot
# 加速器全失效时：用仓库代理形式拉，拉下来再 tag 改名；最终方案是公司统一 Harbor
docker pull docker.m.daocloud.io/library/nginx:1.25 && \
  docker tag docker.m.daocloud.io/library/nginx:1.25 nginx:1.25
```

> 生产规范：`latest` 是移动靶，升级不可控，所有镜像写死具体版本号。

### 3. docker run 生产模板

生产上 90% 的容器就是一条 run 带全参数（⚠️【必考】，实验里教了前五个，这里补齐）：

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
| `--restart=always` | 挂了自己爬 | 另两种：`on-failure:5`（异常退出最多重试 5 次）、`unless-stopped`（人工 stop 过的不自动拉） |
| `--memory` / `--memory-swap` | 内存限制 | 两者设同值 = 禁用 swap，防超卖拖垮宿主机 |
| `--cpus` | CPU 限额（核） | 如 `1`、`1.5` 表示 1.5 核 |
| `--health-cmd` 系列 | 健康检查 | `docker ps` 的 STATUS 可见 healthy/unhealthy，配合告警 |

容量规划经验值：JVM 类业务给堆内存的 1.5 倍做限额；所有容器限额之和不超过宿主机内存 80%。验证：`docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' 容器名` 应输出 always；`docker inspect -f '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}}' 容器名` 看限额。

### 4. 容器日常管理

```bash
docker start web-nginx                     # 启动
docker stop -t 30 web-nginx                # 停止：先给 30 秒优雅退出，超时再强杀
docker restart web-nginx                   # 重启
docker rm web-nginx                        # 删已停止的容器
docker rm -f web-nginx                     # 强删运行中的（先确认数据已挂载出来）
docker ps / docker ps -a                   # 看在跑的 / 看全部（含已退出）
docker container prune                      # 批量清理已停止的容器
docker exec -it web-nginx bash             # 进容器（精简镜像如 alpine 没有 bash，用 sh）
docker exec web-nginx nginx -t              # 不进容器直接派命令，排障常用
docker logs -f --tail 100 web-nginx        # 跟踪最后 100 行（同 tail -f）
docker logs --since 30m web-nginx          # 只看最近 30 分钟
docker logs --tail 500 db 2>&1 | grep -i error   # 过滤错误
docker stats                               # 动态刷新看资源（类似 top）
docker stats --no-stream                   # 输出一次即退出，适合脚本采集
docker cp web-nginx:/etc/nginx/nginx.conf /tmp/          # 容器 → 宿主机
docker cp /data/app.conf web-nginx:/etc/app/app.conf     # 宿主机 → 容器
```

- `stats` 盯 `MEM%`：长期 95% 以上 = 内存限额将被打满，是 OOM 前兆
- `docker cp` 是应急排障利器：改配置、取日志、抓数据都不用进容器
- `docker inspect -f` 常用模板：状态 `{{.State.Status}}`、退出码 `{{.State.ExitCode}}`、重启策略 `{{.HostConfig.RestartPolicy.Name}}`、内存限额 `{{.HostConfig.Memory}}`、日志文件位置 `{{.LogPath}}`

### 5. 数据卷与备份

| 方式 | 写法 | 特点 | 用途 |
|---|---|---|---|
| 绑定挂载 | `-v /宿主路径:/容器路径` | 直接映射宿主目录，路径明确 | 挂配置文件、日志目录（实验四教过） |
| 具名卷 | `-v 卷名:/容器路径` | Docker 统一管理，位于 `/var/lib/docker/volumes/卷名/_data` | 挂业务数据（数据库存储等） |
| 匿名卷 | `-v /容器路径` | 随机卷名，难辨认 | 尽量少用 |

```bash
docker volume create mysql-data     # 创建具名卷
docker volume ls                    # 列出所有卷
docker volume inspect mysql-data    # 看卷详情（实际挂载点）
docker volume rm mysql-data         # 删卷（先确认没容器在用）
docker volume prune                  # 清理未使用的卷（慎用，删了数据就没了）
# 数据库类容器挂具名卷的标准姿势
docker run -d --name app-db -v mysql-data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD='StrongPwd@2026' --restart=always mysql:5.7
# 挂配置文件 + 只读（改完配置需 docker restart 生效）
docker run -d --name web-nginx -p 80:80 --restart=always \
  -v /data/nginx/html:/usr/share/nginx/html:ro \
  -v /data/nginx/logs:/var/log/nginx \
  -v /data/nginx/conf/app.conf:/etc/nginx/conf.d/app.conf:ro \
  nginx:1.25
```

备份与恢复思路：起一个一次性容器把卷挂进去，打成 tar 落到宿主备份目录：

```bash
docker run --rm -v mysql-data:/data:ro -v /backup:/backup \
  alpine tar czf /backup/mysql-data-$(date +%F).tar.gz -C /data .
docker run --rm -v mysql-data:/data -v /backup:/backup:ro \
  alpine tar xzf /backup/mysql-data-2026-10-12.tar.gz -C /data
```

生产方案一句话：**容器无状态化 + 数据全落卷 + 卷定时备份（cron 打 tar，再同步 NFS/对象存储）**。

### 6. 容器网络

```bash
docker run -d -p 8080:80 nginx:1.25                # 宿主 8080 → 容器 80
docker run -d -p 127.0.0.1:8080:80 nginx:1.25      # 只绑本机回环，外部访问不到
docker port web-nginx                              # 查看容器端口映射
ss -tlnp | grep -E ':80\b'                         # 宿主机确认监听
docker network create --driver bridge app-net      # 建业务专用网络（自定义网络自带 DNS，容器名即域名）
docker network connect app-net 容器名               # 让已运行容器加入网络
docker run -d --name app-web --network app-net --restart=always nginx:1.25   # 新容器直接加入自定义网络
docker network ls                                  # 默认有 bridge/host/none 三个
docker exec -it app-web ping -c2 app-db             # 互通验证：容器名解析成功
```

要点：默认 bridge 走 `docker0` 网桥（172.17.0.0/16）NAT 上网，**容器重启后 IP 可能变化，容器间通信绝不要写 IP**（实验六用服务名就是这个原因）；**一个业务系统一个独立网络**，互不干扰、权限边界清晰；host 模式直接共用宿主机网络栈（性能敏感、要看真实客户端 IP 的场景，注意端口冲突）；none 模式无网络（离线沙箱）；容器内解析不了域名时 run 加 `--dns 114.114.114.114`，并检查自定义网段是否撞内网。

### 7. Dockerfile

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

构建命令变体：

```bash
docker build -t app-nginx:v1.0 .              # -t 名字:tag，最后的 . 是构建上下文目录
docker build -f /path/Dockerfile -t app-nginx:v1.0 /path    # 指定 Dockerfile 位置
docker build --no-cache -t app-nginx:v1.0 .   # 全新构建（排查缓存问题用）
docker history app-nginx:v1.0                 # 看每层大小
```

空目录里放好 `Dockerfile`、`index.html`、`app.conf`，外加 `.dockerignore`（构建时排除无关文件，加速并防泄密）：

```text
.git
*.log
upload/
```

生产完整模板（基于 CentOS 自装 nginx，比实验五的官方镜像版更"全自研"风格）：

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

多阶段构建：编译与运行分离，镜像瘦身利器（前端项目典型——node 只用来编译，运行只要 nginx）：

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

生产注意点：

- **瘦身**：基础镜像选 `alpine`/`slim` 变体（如 `openjdk:8-jre-alpine`、`python:3.11-slim`）；RUN 合并写并清缓存（apt 系是 `rm -rf /var/lib/apt/lists/*`）；能多阶段就多阶段；变化少的步骤写前面（先 `COPY package.json` 装依赖、再 COPY 源码），吃足构建缓存
- **非 root 运行**：镜像里 `USER nginx` 指定低权用户，运行时还可 `docker run --user 1000:1000` 兜底
- **最小权限**：不用 `--privileged`，确需能力用 `--cap-add` 精确加；根文件系统只读 `--read-only` + `--tmpfs /tmp`
- 固定 tag 版本、来源可信，上线前漏洞扫描（见第 10 节）

### 8. Docker Compose

老环境装独立二进制（插件版安装见实验六）：

```bash
curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose && chmod +x $_
```

生产完整模板（一套业务：web + mysql + redis，含网络、卷、资源限制、健康检查）：

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

要点：同项目服务自动同网络，`DB_HOST: db` 直接写服务名；`depends_on` 只保证启动顺序、不保证 mysql 已就绪，应用要自己做连接重试；密码不要明文进 git，放同目录 `.env` 文件引用。

在 yml 所在目录执行（老版独立二进制写法是 `docker-compose`，参数相同）：

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

### 9. 私有镜像仓库 Harbor

为什么需要：内网机器不能上公网、公司要统一镜像版本、权限要分部门管控、上线前要漏洞扫描——全靠私有仓库。Harbor 是 VMware 开源的企业级仓库（Web 管理、项目权限、镜像复制、Trivy 漏洞扫描、垃圾回收），本质是一套 compose 拉起的容器化服务，行业事实标准。部署要求一台 2C4G+ 专用机：

```bash
# 1. 离线安装包（内网提前在外网机器下载：github.com/goharbor/harbor/releases）
tar xf harbor-offline-installer-v2.9.0.tgz -C /opt/ && cd /opt/harbor
# 2. 复制模板并修改配置
cp harbor.yml.tmpl harbor.yml
vi harbor.yml     # 关键项见下
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

客户端推送/拉取：

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

### 10. 日志、清理与安全

单容器覆盖日志轮转（daemon.json 是全局，日志量大的容器单独覆盖）：

```bash
docker run -d --log-driver json-file --log-opt max-size=100m --log-opt max-file=5 \
  --name log-heavy-app my-image:v1
# 验证：输出 {json-file map[...] max-file:5 max-size:100m ...} 即生效
docker inspect -f '{{.HostConfig.LogConfig}}' app-web
```

定期清理写进 crontab：

```bash
# 每周日凌晨 2 点：清理创建超过 7 天且未被容器使用的镜像 + 构建缓存
0 2 * * 0 /usr/bin/docker image prune -af --filter "until=168h" >> /var/log/docker-prune.log 2>&1
30 2 * * 0 /usr/bin/docker builder prune -af >> /var/log/docker-prune.log 2>&1
# 每天凌晨 3 点：清理已退出的容器
0 3 * * * /usr/bin/docker container prune -f >> /var/log/docker-prune.log 2>&1
```

> 注意：`image prune -a` 会删掉所有"当前没容器在用"的镜像，**回滚镜像也会被清掉**；稳妥做法是 prune 前 `docker ps` 核对，或只清悬空镜像（不带 `-a`）。

安全要点：

- **不用 root 跑业务**：Dockerfile `USER` 指定低权用户，运行时 `--user 1000:1000` 兜底
- **不给业务容器挂 `/var/run/docker.sock`**：等于交出宿主机 root 权限
- **daemon 不裸奔**：不开 2375 无认证远程端口，远程管理走 TLS 或 SSH 隧道
- **镜像漏洞扫描**：Trivy 免费开源（Harbor 安装时已自带）：

```bash
rpm -ivh trivy-0.50.0.x86_64.rpm                     # 安装（内网提前下载）
trivy image --severity HIGH,CRITICAL app-nginx:v1.0  # 只输出高危以上
```

- 固定版本 tag + 只从公司 Harbor 拉镜像，供应链可信

### 11. 故障排查

容器起不来，标准四步：

```bash
docker ps -a                          # 1. 看状态和退出码：Exited (137) 2 minutes ago
docker logs --tail 200 app-web        # 2. 看应用日志（最重要，80% 的原因在这）
docker inspect app-web --format 'ExitCode={{.State.ExitCode}} OOM={{.State.OOMKilled}} Error={{.State.Error}}'
dmesg -T | grep -i -E "oom|killed process"    # 4. 确认是否被内核 OOM 杀掉
```

退出码对照表（背下来）：

| 退出码 | 含义 | 生产常见原因 |
|---|---|---|
| 0 | 正常退出 | 前台任务跑完结束（一次性脚本容器属正常，实验一 hello-world 就是） |
| 1 | 应用报错 | 配置错误、连不上数据库/依赖、代码异常 |
| 125 | daemon 自身错误 | run 参数写错、daemon.json 非法 |
| 126 | 命令不可执行 | 文件无执行权限 |
| 127 | 命令找不到 | 镜像里没这个命令/依赖没装全 |
| 137 | 被 SIGKILL (128+9) | **OOM 被内核杀**，或人工 kill -9 |
| 143 | 被 SIGTERM (128+15) | 正常 stop/restart 触发，一般是正常现象 |

高频场景：**秒退且退出码 0** = 服务用后台方式启动（如 `systemctl start`），Docker 认为"活干完了"，容器必须有**前台常驻进程**（如 `nginx -g "daemon off;"`）；**退出码 1 + 日志报配置错误** = 挂载的配置路径写错，exec 进去 cat 核对实际文件；**退出码 137 + OOMKilled=true** = 内存限额太小，调大 `--memory` 或查内存泄漏。

端口冲突（`bind: address already in use`）：`ss -tlnp | grep -E ':80\b'` 定位占用者，宿主老服务占了 80 就换 `-p 8080:80`；已映射成功但外部访问不通：firewalld 和云平台安全组**两层都要放行**（实验二教过）。

磁盘占满处理：

```bash
df -h                                                    # 确认哪个盘满（通常 /var/lib/docker 所在盘）
docker system df                                         # Docker 占用分布：镜像/容器/卷/缓存
du -sh /var/lib/docker/containers/* | sort -rh | head    # 定位超大容器目录

# 1. 容器日志失控（最常见根因）：紧急清空用 truncate，不要 rm（rm 后空间不释放）
ls -lh /var/lib/docker/containers/*/*-json.log | sort -k5 -h | tail
truncate -s 0 /var/lib/docker/containers/<容器ID>/<容器ID>-json.log
# 根治：daemon.json 配 max-size/max-file 并重建容器（见第 1 节）

# 2. 清理 Docker 垃圾
docker container prune && docker image prune -af --filter "until=168h" && docker builder prune -af
docker volume prune        # 删数据！逐个 docker volume inspect 确认再执行

# 3. 系统日志瘦身
journalctl --disk-usage && journalctl --vacuum-size=200M
```

其他高频踩坑：

| 症状 | 根因 | 处理 |
|---|---|---|
| firewalld 重启后容器全部没网 | firewalld reload 清掉了 Docker 的 iptables 规则 | `systemctl restart docker` 恢复；装 Docker 的机器避免频繁 reload firewalld |
| 服务器重启后容器没自动起 | 没配 `--restart=always` | 重建容器带上，或 `docker update --restart=always 容器名` |
| 容器内时间差 8 小时 | 默认 UTC 时区 | `-e TZ=Asia/Shanghai` 或 `-v /etc/localtime:/etc/localtime:ro` |
| 改 daemon.json 后 docker 起不来 | JSON 语法错误（逗号引号） | `journalctl -u docker -n 50` 看报错，修好再 restart（实验一教过） |
| 容器内解析不了域名 | DNS 问题 / 网段冲突 | run 加 `--dns 114.114.114.114`；检查自定义网段是否撞内网 |
| 镜像拉取超时 | 加速器失效 | 换可用加速器（第 1 节），或从 Harbor 拉 |

### 12. 生产上线 Checklist

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
