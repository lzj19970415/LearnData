---
title: Kubernetes 从入门到生产实战
category: Linux进阶
tags:
  - Linux
  - Kubernetes
  - K8S
---

# Kubernetes 从入门到生产实战

> 跟着这篇做完 7 个实验，你会亲手搞出一套能跑的 K8s 集群：发布 3 个副本的 nginx、亲手杀掉一个 Pod 看它"复活"、把服务挂上固定门牌让 curl 打通、体验一次滚动上线和"反悔药"回滚，最后学会运维吃饭的本事——排错三板斧。全程只要一台 CentOS 7 虚机。
>
> 诚实预告：K8s 是本系列里最吃资源、门槛最高的一篇。主线实验用最轻量的 minikube（把一套迷你 K8s 塞进你虚机里的一个容器），但对家用电脑仍有硬性门槛：虚机内存至少 4G（强烈建议 8G）、CPU 2 核起步、必须联网。开工前先到下面「实验环境准备」逐条对表——**家里电脑跑不动就先读懂流程，上班在测试环境练**，所有命令在生产里一模一样。

## 实验环境准备

| 项目 | 最低要求 | 建议 | 为什么卡这道门 |
| ---- | ---- | ---- | ---- |
| 虚机系统 | CentOS 7.9 | 同左 | 跟着本系列建的虚机就行 |
| 虚机内存 | 4G | **8G** | K8s 本体 + 你的业务容器全住在内存里，4G 只能"挤一挤" |
| CPU | 2 核 | 4 核 | 低于 2 核会卡到怀疑人生 |
| 磁盘 | 剩余 20G | 40G | K8s 组件镜像约 2G，还要给后面的实验留量 |
| 网络 | 必须能联网 | — | 装软件、拉镜像全靠网络 |
| Docker | 已安装且跑通 | — | minikube 在 Docker 容器里建 K8s；没装先看站内 Linux 分类的 16-Docker 篇 |

确认就绪（在虚机里依次敲，全过再往下走）：

```bash
free -h          # 看内存：Mem 行 total 要 ≥ 4G（8G 更稳）
nproc            # 看 CPU 核数：要 ≥ 2
df -h /          # 看根分区剩余空间：≥ 20G
docker --version # 看装没装 Docker
docker ps        # 看 Docker 活没活：能打出列表就行，哪怕一行没有
```

预期输出长这样（数字有差异没关系，看数量级）：

```
$ free -h
              total        used        free      shared  buff/cache   available
Mem:           7.6G        300M        6.8G        12M        512M        7.0G
$ nproc
4
$ docker --version
Docker version 24.0.9, build 2939816
$ docker ps
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

顺手关掉防火墙（学习环境图省事；生产是放行特定端口，不是关）：

```bash
systemctl stop firewalld && systemctl disable firewalld
```

两个提醒：

- CentOS 7 已停止官方维护，拿来学机能跑，但**别把这种虚机暴露在公网**。若 `yum` 报 404，先按前面篇章把 yum 源换成国内 Vault 镜像再来。
- 本篇全部操作都在虚机里以 root 用户执行，跟着敲就行。

## 实验一：起 K8s——把"总管家"搬进虚机

### 🎯 目标

- 人话说清干嘛：Docker 管"一台机器上的容器"，K8s 管"一群机器上的容器"。要用 K8s，第一步是让它上岗——**这不是测试，是装机**，后面 6 个实验全跑在这套集群上。
- 干成一件什么事：装上 kubectl（你下命令的"话筒"）和 minikube（一键安装器），启动一个单节点 K8s 集群，最后 `kubectl get nodes` 看到 Ready，集群就算活了——**这是本篇第一个正反馈时刻**。
- 有什么用：没有这一步，后面全部免谈。练会它，你到公司面对真集群时，第一件事也是敲这条命令确认"集群活着没"。
- 生产对应：生产是 3 台 Master + N 台 Worker 的真机集群，用 kubeadm 装（全套流程收在篇末速查 2），kubectl 命令与 minikube 环境 95% 相同；minikube 只是"把迷你集群塞进一台虚机"方便练手。

### 📍 在哪动手

CentOS 7 虚机的终端里（Xshell/SSH 都行），root 用户，全程联网。

### 🔧 动手做

```bash
# ① 配 kubectl 的 yum 源（阿里云镜像；国内直连官方源会失败）
cat > /etc/yum.repos.d/kubernetes.repo <<'EOF'
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/rpm/
enabled=1
gpgcheck=0
EOF

# ② 安装 kubectl（注意装的是 1.29 系列，与速查里生产 kubeadm 版本一致）
yum install -y kubectl

# ③ 下载 minikube 主程序（约 70MB 的单文件，无需安装）
#    下面两条 curl 二选一：官方地址拉不动/太慢，就换成第二条阿里云镜像
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
curl -LO https://kubernetes.oss-cn-hangzhou.aliyuncs.com/minikube/releases/latest/minikube-linux-amd64

# ④ 把它安装成系统命令，删掉安装包
install minikube-linux-amd64 /usr/local/bin/minikube
rm -f minikube-linux-amd64

# ⑤ 验收两个工具都活了
kubectl version --client
minikube version
```

预期输出应包含关键字 `Client Version: v1.29.x` 和 `minikube version: v1.x`。如果虚机里 curl 太慢，也可以在 Windows 上下载好文件，用共享文件夹/U 盘拷进虚机再执行第 ④ 步。

启动集群（本篇最重要的一条命令，逐行看注释）：

```bash
minikube start \
  --driver=docker \
  --cpus=2 \
  --memory=4096 \
  --kubernetes-version=v1.29.4 \
  --image-mirror-country=cn \
  --registry-mirror=https://docker.m.daocloud.io
```

- `--driver=docker`：K8s 整个装在一个 Docker 容器里——虚机已有 Docker，零额外依赖
- `--cpus=2`：分给这套迷你集群的 CPU
- `--memory=4096`：分给它的内存；**虚机总内存只有 4G 就改成 3072**，别把虚机自己挤死；8G 才给 4096
- `--kubernetes-version=v1.29.4`：固定 K8s 版本，和生产速查里 kubeadm 的版本号一致，将来命令无缝迁移
- `--image-mirror-country=cn`：K8s 自身组件镜像从国内仓库拉，**国内必加**，否则卡在下载
- `--registry-mirror`：拉业务镜像（如 nginx）的 Docker 加速器；这个地址失效就换成你公司/云厂商自己的加速地址，再 `minikube start` 重启

### ✅ 怎么算成功

启动过程要下载约 2G 镜像，5~20 分钟正常，别关虚机。成功时最后几行应包含关键字 `Done! kubectl is now configured`：

```
* minikube v1.33.2 on Centos 7.9 (amd64)
* Using the docker driver based on user configuration
* Starting control plane node minikube in cluster minikube
* Pulling base image ...
* Downloading Kubernetes v1.29.4 images ...
* Creating Kubernetes in docker container with (CPUs=2, Memory=4096MB) ...
* Verifying Kubernetes components...
* Enabled addons: default-storageclass, storage-provisioner
* Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

然后敲本篇最关键的一条验收命令：

```bash
kubectl get nodes
```

```
NAME       STATUS   ROLES           AGE     VERSION
minikube   Ready    control-plane   3m12s   v1.29.4
```

**STATUS 列是 Ready**——你人生第一个 K8s 集群上线了。可以再敲 `kubectl cluster-info`，应看到 `Kubernetes control plane is running at https://192.168.49.2:8443`。

顺带认认人（minikube 里一人分饰所有角色，生产里它们是不同机器上的进程）：**apiserver** = 前台窗口（你所有 kubectl 命令都递给它）、**etcd** = 档案库（集群的一切状态都记在这）、**scheduler** = 分房调度员（决定新 Pod 住哪台机器）、**controller-manager** = 查房管家（发现"说好 3 个副本只剩 2 个"就去补）、**kubelet** = 牢房管理员（每台节点都有，真正把容器拉起来的人）。

⚠️【必考】架构就是"Master 管事 + Node 干活"，生产最低配 3 台 Master（保证 etcd 多数派存活）。完整组件定义见篇末速查 1。

### 🩹 如果不对

1. 报 `X Exiting due to PROVIDER_DOCKER_ERROR: "docker: Cannot connect to the Docker daemon"` → Docker 没起来。执行 `systemctl start docker && systemctl enable docker`，`docker ps` 能出列表后再重跑 `minikube start`。
2. 卡在 `Downloading Kubernetes ... images` 十几分钟不动或超时退出 → 国外镜像仓库拉不动。确认 `--image-mirror-country=cn` 加了没；已下载的部分不会白下，重跑 `minikube start` 会续传。虚机直接卡死的话是内存不够，关机把虚机内存调到 8G。

## 实验二：第一个 Pod——给程序一间单人牢房

### 🎯 目标

- 干成什么事：让 K8s 帮你跑起来一个 nginx 容器，并用 kubectl 看着它从"排队"到"入住"。
- 为什么要它：**Pod 是 K8s 眼中最小的"工位"**——一个 Pod = 至少一个容器 + 自己的 IP + 自己的空间。类比 16-Docker 篇的"集装箱"：在 K8s 里集装箱被安排进"单人牢房"，牢房就是调度和管理的最小单位。后面的 Deployment、Service 全是围着 Pod 转的。
- 有什么用：练熟"起一个东西 → 看它状态"这个肌肉记忆；`kubectl run` 也能让你临时拉个容器进去干活，是运维手边的瑞士军刀。

### 📍 在哪动手

还在虚机终端里，接着实验一敲。不用写文件。

### 🔧 动手做

```bash
# ① 让 K8s 起一个名叫 my-nginx 的 Pod，里面装个 nginx 容器
kubectl run my-nginx --image=nginx:1.25

# ② 看 Pod 状态（过十几秒再看一次，状态会变）
kubectl get pods

# ③ 盯着看它"出生"（-w = 持续刷新，看完 Ctrl+C 退出）
kubectl get pods -w

# ④ 钻进牢房里，让容器自己报家门
kubectl exec -it my-nginx -- nginx -v
```

### ✅ 怎么算成功

第一次 `kubectl get pods` 大概率看到"正在盖牢房"，十几秒后变成"住进来了"：

```
NAME      READY   STATUS              RESTARTS   AGE
my-nginx  0/1     ContainerCreating   0          8s    ← 第一次看：拉镜像盖牢房中
my-nginx  1/1     Running             0          38s   ← 过一会儿看：入住了
```

`kubectl exec -it my-nginx -- nginx -v` 应包含关键字 `nginx version: nginx/1.25`。

逐列人话：NAME 是 Pod 名；READY `1/1` 是"共 1 个容器、就绪 1 个"；STATUS 是状态；RESTARTS 是重启次数；AGE 是活了多久。**Pod 的一生**：Pending（挂号排队）→ ContainerCreating（拉镜像盖牢房）→ Running（入住）。你刚才亲眼看着它走完了前半生。

⚠️【必考】Pod 是最小调度单位，**不是容器**——容器住在 Pod 里面。

❗【易错】`kubectl run` 起的是"裸 Pod"：挂了、删了都没人管。生产裸奔 Pod 是大忌，一律用实验三的 Deployment 管。今天裸跑一次，是为了让你先看清 Pod 本尊。现在就试试：`kubectl delete pod my-nginx`，再 `kubectl get pods`——**空了，没人补**。这个"没人补"，正是下一个实验要解决的问题。

### 🩹 如果不对

1. STATUS 长时间停在 `ImagePullBackOff` → 镜像拉不动（K8s 头号网络问题）。先 `kubectl describe pod my-nginx` 看最下面 Events 里的报错原因；实验七会专门练它，这里先混个脸熟。
2. 一直 `Pending` 或虚机越来越卡 → 资源不够。`docker ps` 确认 Docker 还活着；虚机只有 4G 内存的话，检查实验一的 `--memory` 是否改成了 3072。

## 实验三：Deployment——雇 3 个克隆人，死一个自动补

### 🎯 目标

- 干成什么事：发布一个 Deployment，让 K8s **永远替你保住 3 个一模一样的 nginx 副本**；然后亲手杀掉其中一个，看它原地复活。
- 为什么要它：实验二结尾你亲手删掉裸 Pod，名单空了、没人补。Deployment 就是那个"监工"：你递一张"我要 3 个 nginx"的图纸（YAML），它负责少一个补一个、多一个杀一个。
- 有什么用：**这是 K8s 的灵魂时刻**——你只声明"期望结果"，K8s 负责达成。凌晨三点容器挂了，替你爬起来重建的就是它。生产环境没有 Deployment 的自愈，就没有敢睡觉的运维。
- ⚠️【必考】这套思想叫"声明式"：说"我要 3 个"，不说"怎么做到"。

### 📍 在哪动手

虚机里建实验目录，写第一个 YAML 文件：`/root/k8s-lab/nginx-deployment.yaml`（全路径，别只看文件名）。

### 🔧 动手做

```bash
mkdir -p /root/k8s-lab    # 建个专门放实验文件的目录，后面文件全放这

# 用 heredoc 直接把 YAML 写进文件（对新手比 vi 稳，回车原样落盘）
cat > /root/k8s-lab/nginx-deployment.yaml <<'EOF'
apiVersion: apps/v1        # Deployment 属于 apps 组、大版本 v1
kind: Deployment           # 资源类型：监工
metadata:
  name: nginx-deploy       # 监工的名字
spec:                      # 下面全是"你要的期望结果"
  replicas: 3              # 灵魂一行：时刻保持 3 个副本
  selector:                # 监工靠标签认领自己的 Pod
    matchLabels:
      app: nginx-web       # 认领规则：带 app=nginx-web 标签的就是我的人
  template:                # Pod 模板：照这个模子造每个副本
    metadata:
      labels:
        app: nginx-web     # 给造出来的 Pod 贴同款标签（❗必须和 selector 一字不差）
    spec:
      containers:
      - name: nginx        # 容器名：实验六滚动更新要指定它
        image: nginx:1.25  # 用哪个镜像造（生产禁用 latest，写死版本才可追溯）
        ports:
        - containerPort: 80  # 容器里 nginx 监听 80 端口
EOF

# 交给 K8s 去干（apply = "照着这张图纸给我办"）
kubectl apply -f /root/k8s-lab/nginx-deployment.yaml
```

### ✅ 怎么算成功

```bash
kubectl get deployment     # 看监工
kubectl get pods          # 看它管着的 3 个 Pod
```

```
NAME          READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deploy  3/3     3            3           40s

NAME                          READY   STATUS    RESTARTS   AGE
nginx-deploy-6d4b7f9c-2pl8c   1/1     Running   0          40s
nginx-deploy-6d4b7f9c-8xk4q   1/1     Running   0          40s
nginx-deploy-6d4b7f9c-v9m2t   1/1     Running   0          40s
```

监工 READY `3/3`，Pod 名字是"监工名-随机码"的格式，共 3 行 Running。

接下来是本篇的灵魂时刻——**亲手杀掉一个，看它复活**：

```bash
# 挑一个 Pod 杀掉（名字换成你屏幕上的任意一行）
kubectl delete pod nginx-deploy-6d4b7f9c-2pl8c

# 盯着名单
kubectl get pods -w
```

```
NAME                          READY   STATUS              RESTARTS   AGE
nginx-deploy-6d4b7f9c-2pl8c   1/1     Terminating         0          5m    ← 你杀的，正在咽气
nginx-deploy-6d4b7f9c-8xk4q   1/1     Running             0          5m
nginx-deploy-6d4b7f9c-v9m2t   1/1     Running             0          5m
nginx-deploy-6d4b7f9c-w7q5z   0/1     ContainerCreating   0          3s    ← 新面孔，马上顶上
```

你亲手杀掉的那个进了 Terminating，几乎同时名单里冒出一个新名字开始 ContainerCreating——**你没做任何补救操作，总数自己回到了 3**。再 `kubectl get pods` 确认新名字变成 Running。记住这个瞬间，它就是公司买了 K8s 的第一理由。

### 🩹 如果不对

1. `error: error parsing /root/k8s-lab/nginx-deployment.yaml: yaml: line 10: ...` → YAML 缩进错了。YAML 只认空格不认 Tab，层级全靠缩进；报错信息里有行号，去那行附近对着上面的代码块核对。
2. `The Deployment "nginx-deploy" is invalid: ... spec.template.metadata.labels: Invalid value: ... must be equal to selector` → template 里的 labels 和 selector 里的 matchLabels 写得不一致，两处必须完全相同。

## 实验四：扩缩容——一键调整编制

### 🎯 目标

- 干成什么事：把 3 个副本一口气扩到 5 个，再缩回 2 个，实时看到名单变化。
- 为什么要它：白天业务量大要加人，夜里没人访问要减人省钱。生产里"加机器/减机器"是 K8s 里最像"运维日常操作"的一条命令，一分钟内完成，不用改 YAML、不用重启服务。
- 有什么用：练熟 `scale`；面试和软考常考"Deployment 副本数怎么调"。生产里更进一步是 HPA 自动扩缩容（按 CPU 自动加人减人），模板见速查 4.7——手动 scale 是它的地基。

### 📍 在哪动手

还是虚机终端，一条命令的事，不用写文件。

### 🔧 动手做

```bash
# 编制 3 → 5
kubectl scale deployment/nginx-deploy --replicas=5
kubectl get pods

# 编制 5 → 2
kubectl scale deployment/nginx-deploy --replicas=2
kubectl get pods -w     # 实时看着它减员
```

### ✅ 怎么算成功

每次 scale 都会先回一句 `deployment.apps/nginx-deploy scaled`。扩到 5 后 `kubectl get pods` 应显示 **5 行 Running**：

```
NAME                          READY   STATUS    RESTARTS   AGE
nginx-deploy-6d4b7f9c-2pl8c   1/1     Running   0          18m
nginx-deploy-6d4b7f9c-8xk4q   1/1     Running   0          18m
nginx-deploy-6d4b7f9c-9dz6k   1/1     Running   0          20s
... 共 5 行（多出 2 个 AGE 几秒的新面孔）
```

缩到 2 后只剩 **2 行**（K8s 优先裁掉最年轻的），另开窗口 `kubectl get pods -w` 能看到 3 个 Pod 排队进 Terminating。生产里同样场景下，缩容由负载低谷时的 HPA 自动做（速查 4.7），你今天先手动感受一遍。

### 🩹 如果不对

1. `Error from server (NotFound): deployments.apps "nginx-deploy" not found` → 名字打错了，`kubectl get deployment` 核对后重敲；注意斜杠后是 Deployment 名不是 Pod 名。
2. 扩到 5 后新 Pod 一直 `Pending` → 虚机资源不够了（minikube 分的内存小）。`kubectl describe pod 卡住的那个Pod名` 看 Events，有 `Insufficient memory` 就把 replicas 缩回来，或给虚机加内存——生产里同样这条报错，解法就是"调小 requests 或加节点"。

## 实验五：Service——Pod 会死会换 IP，所以要有个固定门牌

### 🎯 目标

- 干成什么事：给实验三那批 nginx 挂一个**固定门牌**（NodePort 服务），从虚机用 curl 打通它。
- 为什么要它：实验三你亲眼看见了 Pod 一死一回就换名字换 IP。总不能让客户记着"今天访问 172.17.0.4，明天访问 172.17.0.9"吧？**Service = 门口的招牌 + 前台**：客人只认招牌，前台负责把客人领到还活着的 Pod——人换了门牌不变。
- 有什么用：这是你的服务第一次能被"外面"访问到，也是验收业务通不通的标准动作：`curl` 一下看状态码。生产里 kubectl 命令要加 `-n 命名空间`，格式一模一样。
- ⚠️【必考】Service 三种类型：ClusterIP（集群内互访）、NodePort（节点上开 30000+ 端口对外）、LoadBalancer（云厂商发 VIP）。今天练 NodePort，另两种模板见速查 4.3。

### 📍 在哪动手

虚机，写第二个 YAML：`/root/k8s-lab/nginx-service.yaml`。

### 🔧 动手做

```bash
cat > /root/k8s-lab/nginx-service.yaml <<'EOF'
apiVersion: v1            # Service 是基础资源，属于 v1
kind: Service             # 资源类型：服务（固定门牌 + 前台）
metadata:
  name: nginx-svc         # 招牌名字
spec:
  type: NodePort          # 关键一行：在"节点"上开一个真实端口对外（范围固定 30000-32767）
  selector:
    app: nginx-web        # 前台按这个标签找人：正好认领实验三那批 Pod
  ports:
  - port: 80              # Service 自己的端口（集群内部用它访问）
    targetPort: 80        # 实际转发进容器的 80 端口（❗要和 containerPort 对齐）
    nodePort: 30100       # 在节点上开的对外端口（不写就随机挑一个 30000+）
EOF

kubectl apply -f /root/k8s-lab/nginx-service.yaml
kubectl get svc
```

selector 认人的原理：实验三的模板给每个 Pod 贴了 `app: nginx-web` 标签，Service 靠标签找后端，**不靠 IP**——这就是它扛得住 Pod 换血的原因。

### ✅ 怎么算成功

```
NAME        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
nginx-svc   NodePort    10.96.123.45    <none>        80:30100/TCP   20s
```

PORT(S) 列 `80:30100` = 内部 80 映射对外 30100。然后打通它：

```bash
minikube ip                                          # 打出 minikube 这台"节点"的 IP，形如 192.168.49.2
curl -sI http://$(minikube ip):30100 | head -4
```

```
HTTP/1.1 200 OK
Server: nginx/1.25.5
Content-Type: text/html
Connection: keep-alive
```

**看到 `HTTP/1.1 200 OK` 就算打通**：请求从"门牌"一路打进了"牢房"。想看完整欢迎页再敲 `curl -s http://$(minikube ip):30100 | grep -i title`，应包含关键字 `Welcome to nginx!`。

再补一发"人换了门牌不变"的实证：

```bash
kubectl scale deployment/nginx-deploy --replicas=4   # 换一批人
kubectl get pods -o wide                            # 新旧 Pod 的 IP 各不相同
curl -sI http://$(minikube ip):30100 | head -1       # 门牌照样通：HTTP/1.1 200 OK
```

❗【易错】`port` 是 Service 自己的端口，`targetPort` 才是容器里的端口，两个"80"各管各的，写反就不通。
说明：minikube 的"节点"其实是虚机里一个 Docker 容器，所以用 `minikube ip` 的地址 curl（虚机内直通）。生产里节点 IP 就是服务器 IP，直接 `curl 节点IP:30100`，命令里连 `$( )` 都不用换。

### 🩹 如果不对

1. `curl: (7) Failed to connect` → 先 `kubectl get endpoints nginx-svc`：ENDPOINTS 若是 `<none>`，说明 selector 和 Pod 标签对不上（回实验三核对 `app: nginx-web`）；ENDPOINTS 有 IP 还不通，八成是防火墙：`systemctl stop firewalld` 再试。
2. 能连上但 503/超时 → targetPort 写错了（容器实际监听 80，你写成了别的），或者后端 Pod 根本没到 Running。

## 实验六：滚动更新与回滚——上线和它的"反悔药"

### 🎯 目标

- 干成什么事：把 nginx 从 1.25 **不停机**升级到 1.26，全程 curl 不掉线；升完立刻反悔，一条命令退回 1.25。
- 为什么要它：公司发版不能停服。K8s 的办法是"滚着换"——先起一个新版本，确认能用，再逐步替换旧的，坏了就地刹车。万一新版本有 bug？`rollout undo` 就是生产救场第一神药：**30 秒回滚，不用回滚脚本、不用救火会**。
- 有什么用：练会"发布三连"（set image → rollout status → rollout undo），这是生产上线日的标准动作，也是故障复盘时保住绩效的动作。

### 📍 在哪动手

虚机终端；这次不写新文件，改的还是实验三那个 Deployment。

### 🔧 动手做

```bash
# ① 换镜像：格式是 容器名=新镜像。nginx 是实验三 yaml 里写的容器名，别写成 Deployment 名
kubectl set image deployment/nginx-deploy nginx=nginx:1.26

# ② 盯着滚动更新的全过程（跑完自动退出）
kubectl rollout status deployment/nginx-deploy

# ③ 看 K8s 自动记的版本历史
kubectl rollout history deployment/nginx-deploy

# ④ 期间可以另开一个窗口盯着新旧交替
kubectl get pods -w
```

### ✅ 怎么算成功

```
$ kubectl rollout status deployment/nginx-deploy
Waiting for deployment "nginx-deploy" rollout to finish: 1 of 4 updated replicas are available...
deployment "nginx-deploy" successfully rolled out     ← 关键字

$ kubectl rollout history deployment/nginx-deploy
REVISION  CHANGE-CAUSE
1         <none>       ← REVISION 1 是 1.25
2         <none>       ← REVISION 2 是刚升的 1.26
```

验证新版本真的在服役（两路都查）：

```bash
kubectl get deployment nginx-deploy -o wide          # IMAGES 列变成 1.26
curl -sI http://$(minikube ip):30100 | grep -i server  # 应包含关键字 Server: nginx/1.26
```

然后吃下反悔药：

```bash
kubectl rollout undo deployment/nginx-deploy        # 退回上一版
kubectl rollout status deployment/nginx-deploy
curl -sI http://$(minikube ip):30100 | grep -i server  # 又变回 Server: nginx/1.25
```

```
$ kubectl rollout undo deployment/nginx-deploy
deployment.apps/nginx-deploy rolled back
$ curl -sI http://$(minikube ip):30100 | grep -i server
Server: nginx/1.25.5
```

生产规矩：正式发版推荐直接改实验三 YAML 里的 `image` 再 `kubectl apply -f`（改在哪谁都能查到，有留痕）；`set image` 是临时快速通道。滚动节奏由 `maxSurge`/`maxUnavailable` 控制，回滚指定老版本用 `--to-revision=2`，见速查 4.2。

### 🩹 如果不对

1. `rollout status` 卡住不走 → 十有八九新镜像拉不动或起不来。Ctrl+C 退出，`kubectl get pods` 看有没有 ErrImagePull/Pending，用实验七的三板斧。此时旧版本 Pod 不退场、服务不受影响——这就是滚动更新自带的刹车。
2. `Error from server (BadRequest): unable to find container "nginx"` → set image 时容器名写错了。回实验三的 YAML 看你写的 `name: nginx`，格式必须是 `容器名=镜像:tag`。

## 实验七：排错三板斧演练——故意搞坏一次

### 🎯 目标

- 干成什么事：**故意**把镜像名写错，亲手制造一次 ImagePullBackOff，再用三板斧把它查出来、修好。
- 为什么要它：运维的日常不是建东西，是"出事了找到为什么"。K8s 排错三板斧：`describe` 看病房记录（事件）、`logs` 看程序遗言（日志）、`events` 看全集群大事记。练完这个，你在生产排障就入了门。
- 有什么用：把"看到红色状态心里发毛"变成"看到红色状态条件反射敲 describe"。

### 📍 在哪动手

虚机终端。这次敲的每条都是排障武器，建议练到不用翻笔记。

### 🔧 动手做

```bash
# ① 埋雷：故意把 nginx 拼成 ngixn
kubectl run bad-pod --image=ngixn:1.25

# ② 看它怎么死（过一分钟再看，状态会"恶化"）
kubectl get pods
kubectl get pods -w    # 过程大约是：Pending → ContainerCreating → ErrImagePull → ImagePullBackOff
```

### ✅ 怎么算成功

最终状态应包含关键字 `ImagePullBackOff`：

```
NAME      READY   STATUS             RESTARTS   AGE
bad-pod   0/1     ImagePullBackOff   0          96s
```

三板斧逐个上：

```bash
# 斧一：describe——病房记录。重点盯最下面的 Events 事件区
kubectl describe pod bad-pod
```

```
Events:
  Type     Reason     Age                 From               Message
  ----     ------     ----                ----               -------
  Normal   Scheduled  3m                  default-scheduler  Successfully assigned default/bad-pod to minikube
  Warning  Failed     2m (x3 over 2m30s)  kubelet            Failed to pull image "ngixn:1.25": Error response from daemon: pull access denied for ngixn, repository does not exist or may require authorization: repository does not exist
  Warning  Failed     2m (x3 over 2m30s)  kubelet            Error: ErrImagePull
  Warning  Failed     108s (x6 over 3m)   kubelet            Back-off pulling image "ngixn:1.25"
```

一句话破案：`Failed to pull image "ngixn:1.25"`——镜像名不对，仓库里根本没这个东西。（先报 ErrImagePull 是"第一次拉失败"，反复失败后退避成 ImagePullBackOff，名字里就写着病名。）

```bash
# 斧二：logs——程序遗言。注意：容器压根没跑起来时，logs 没有内容，只会告诉你原因
kubectl logs bad-pod
```

```
Error from server (BadRequest): container "bad-pod" in pod "bad-pod" is waiting to start: trying and failing to pull image
```

记住规律：**容器没跑起来，别死等 logs，去看 describe。**

```bash
# 斧三：events——全集群大事记，最近的事件排最后
kubectl get events --sort-by=.lastTimestamp | tail -5
```

收案——修复并验证：

```bash
kubectl set image pod bad-pod bad-pod=nginx:1.25   # 单个 Pod 也能改镜像（容器名默认同 Pod 名）
kubectl get pods                                    # 状态转 Running
```

```
NAME      READY   STATUS    RESTARTS   AGE
bad-pod   1/1     Running   1          8m
```

（RESTARTS 变 1 是正常现象：换镜像时容器原地重建了一次。）

⚠️【必考】三大异常状态一句话定性（排错先背这张表）：

| STATUS 显示 | 人话定性 | 第一斧看哪 |
| ---- | ---- | ---- |
| `ImagePullBackOff` | 饭拉不来：镜像名写错/私有仓没认证/节点网络不通 | describe 的 Events |
| `Pending` | 没地儿坐：节点资源不够/PVC 没绑上/标签不匹配 | describe 的 Events |
| `CrashLoopBackOff` | 站不稳就倒：程序起了又崩（配置错、内存爆 OOM、探针误杀） | `logs --previous` 看崩溃前遗言 |

排错口诀：**一 describe 看事件，二 logs 看遗言，三进容器问现场**（现场 = `kubectl exec -it xxx -- /bin/sh`）。

### 🩹 如果不对

1. describe 里 Events 一片空白 → 事件默认只保留约 1 小时，过期就清了；补刀用 `kubectl get events --sort-by=.lastTimestamp`。
2. Events 明明写着 `repository does not exist` 但你确认名字没错 → 国内网络拉 Docker Hub 失败也会报类似错误：确认实验一的 `--registry-mirror` 加了没、地址还活着没，换个可用的加速地址后 `minikube stop && minikube start` 重启再试。

## 收尾：你现在会了什么

回头看，你这几个小时干完了一个运维从"听说过 K8s"到"上手过 K8s"的全过程：

- **装了一套能跑的 K8s 集群**（minikube），并知道生产上它叫 kubeadm 集群、由 3 台 Master + N 台 Worker 组成
- **kubectl 基本功**：get / run / apply / scale / set image / delete
- **Pod**：最小工位，看得懂它从 ContainerCreating 到 Running 的一生
- **Deployment**：声明式监工，`replicas: 3` 一行保住 3 条命——你亲手杀过它一个副本又看着它复活
- **扩缩容**：一条命令改编制
- **Service**：Pod 会死会换 IP，门牌永远不变；NodePort 打通了人生第一个 K8s 服务
- **滚动更新 + 回滚**：不停机发版，外加"反悔药"
- **排错三板斧**：describe / logs / events，加三大异常状态定性

口诀带走：**Pod 是工位，Deployment 是监工，Service 是门牌；挂了它补，忙了它加，坏了它滚，错了我回头。**

练习作业（不看笔记做）：① 把副本扩到 10 再缩回 2；② 把 nodePort 删掉让它随机挑端口，curl 通；③ 故意把实验五的 targetPort 改成 8080，预测会发生什么，再用 `kubectl get endpoints` 验证你的猜想。

收拾战场（可选）：

```bash
minikube stop     # 停集群（下次 minikube start 秒起，东西都在）
minikube delete   # 彻底删除（想从头再练一遍时用）
```

接下来去哪：把 7 个实验连起来从头再做一遍，做到不翻笔记；然后带着实验建立的直觉读下面的「生产速查」——那是你上班接手真集群时的工作手册。

## 生产速查（收藏区）

> 面向电信行业云平台运维岗的收藏区：kubeadm 部署、生产 YAML 模板、调度/探针/存储、排障与日常运维，命令可直接复用，把示例里的镜像、IP、域名换成自己的即可。实验里跑熟的 kubectl 命令在生产全部通用，只是**生产要加命名空间**（如 `-n prod`）。

### 速查 0：为什么需要 K8S

| 问题 | Docker 单机 | K8S 集群 |
| ---- | ---- | ---- |
| 容器挂了谁来拉起 | 依赖 `--restart`，进程级兜底 | 自动重建 Pod，自我修复 |
| 机器宕机 | 手工迁移 | Pod 自动漂移到健康节点 |
| 发布回滚 | 手工切镜像 | 滚动更新 + 一键回滚 |
| 服务发现/负载均衡 | 自配 Nginx | Service/Ingress 原生支持 |

一句话：Docker 解决"怎么打包运行"，K8S 解决"几百个容器在几十台机器上怎么活得好"。

### 速查 1：生产架构与组件

生产最低配：**3 台 Master（控制面）+ N 台 Worker（工作节点）**，Master 至少 3 台保证 etcd 多数派存活；Master 不跑业务 Pod（默认有污点隔离），资源 4C8G 起步，etcd 用 SSD 盘。

| 层 | 组件 | 人话 |
| ---- | ---- | ---- |
| Master | kube-apiserver | 集群唯一入口，所有 kubectl/Dashboard 的操作经它认证、授权、写入 etcd |
| Master | etcd | 集群的"数据库"，存全部状态数据，**最重要的组件，必须备份** |
| Master | kube-scheduler | 调度器，决定新 Pod 放哪个节点（看资源、亲和性、污点） |
| Master | kube-controller-manager | 控制器大脑，持续对比"期望 vs 实际"并纠偏（副本少了就补） |
| Node | kubelet | 节点代理，接 apiserver 指令管理本节点 Pod，上报健康状态 |
| Node | kube-proxy | 维护 Service 转发规则（iptables/ipvs 模式），实现 ClusterIP 负载均衡 |
| Node | 容器运行时 | 真正拉镜像起容器，常用 containerd（**Docker 从 K8S 1.24 起被移除**） |

### 速查 2：kubeadm 生产部署（对照实验：minikube 替你自动干的就是这些）

所有节点执行（主机名每台不同；关 swap 是 kubelet 硬性要求）：

```bash
hostnamectl set-hostname k8s-master1    # 每台不同：k8s-node1、k8s-node2...
echo -e "192.168.10.10 k8s-master1\n192.168.10.11 k8s-node1\n192.168.10.12 k8s-node2" >> /etc/hosts

swapoff -a && sed -ri 's/.*swap.*/#&/' /etc/fstab   # 关 swap 并注释 fstab，重启也不打开

# 加载内核模块并持久化
modprobe overlay && modprobe br_netfilter
printf 'overlay\nbr_netfilter\n' > /etc/modules-load.d/k8s.conf

# 内核参数（开桥接转发）
cat > /etc/sysctl.d/k8s.conf <<'EOF'
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system

# 装 containerd 与三件套（阿里云源，v1.29 为例）
yum install -y yum-utils && yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
printf '[kubernetes]\nname=Kubernetes\nbaseurl=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/rpm/\nenabled=1\ngpgcheck=0\n' > /etc/yum.repos.d/kubernetes.repo
yum install -y containerd.io kubeadm kubelet kubectl
systemctl enable --now containerd kubelet

# containerd 两处关键配置：SystemdCgroup 与 pause 镜像国内化
containerd config default > /etc/containerd/config.toml
sed -i -e 's#SystemdCgroup = false#SystemdCgroup = true#' -e 's#registry.k8s.io/pause#registry.aliyuncs.com/google_containers/pause#' /etc/containerd/config.toml
systemctl restart containerd
```

初始化 Master（只在第一台执行）：

```bash
kubeadm init \
  --kubernetes-version=v1.29.4 \
  --image-repository registry.aliyuncs.com/google_containers \
  --apiserver-advertise-address=192.168.10.10 \
  --pod-network-cidr=10.244.0.0/16 \
  --service-cidr=10.96.0.0/12 --service-dns-domain=cluster.local
```

- `--pod-network-cidr`：Pod 网段，**必须与 CNI 插件一致**（flannel 固定 10.244.0.0/16）
- `--service-cidr`：Service 网段，默认 10.96.0.0/12；`--service-dns-domain`：集群域名后缀，默认 cluster.local
- `--apiserver-advertise-address`：apiserver 通告地址，多网卡机器必指定
- `--control-plane-endpoint`：高可用集群加它，指向 LB 的 VIP + 6443；`--image-repository`：国内拉不动 registry.k8s.io 时用阿里云仓库

成功后按提示执行（Worker 用 init 结尾输出的 join 命令，token 24 小时有效，过期用 `kubeadm token create --print-join-command` 重生成）：

```bash
mkdir -p $HOME/.kube && cp -i /etc/kubernetes/admin.conf $HOME/.kube/config && chown $(id -u):$(id -g) $HOME/.kube/config

kubeadm join 192.168.10.10:6443 --token abcdef.0123456789abcdef --discovery-token-ca-cert-hash sha256:xxxxxxxxxxxxxxxx
```

CNI 网络插件（flannel 性能一般不支持网络隔离；**生产首选 calico**，支持 NetworkPolicy、BGP 直连路由性能好）：

```bash
# 方案 A：flannel（配合 --pod-network-cidr=10.244.0.0/16）
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
# 方案 B：calico（记得把 yaml 里 CALICO_IPV4POOL_CIDR 改成与 pod-network-cidr 一致）
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.3/manifests/calico.yaml

kubectl get nodes && kubectl get pods -n kube-system   # 验证：节点 Ready、coredns/网络插件全部 Running
```

init 报错速查：

| 报错关键字 | 原因 | 处理 |
| ---- | ---- | ---- |
| `[ERROR Swap]` | swap 没关干净 | `swapoff -a` 并注释 fstab 对应行 |
| `[ERROR Port-10250]` 端口占用 | 旧进程残留 | `ss -lntp \| grep 10250`，`systemctl stop kubelet` 后重试 |
| `kubelet isn't running or healthy` | kubelet 起不来 | `journalctl -u kubelet -n 50`，多为 swap/containerd 未就绪 |
| `cgroup driver` 不一致 | kubelet 用 systemd，运行时用 cgroupfs | 按上一步设 `SystemdCgroup = true` 后重启 containerd |
| `node not found`（join 报错） | token 过期 / ca-hash 不对 | `kubeadm token create --print-join-command` 重新生成 |

通用兜底：`kubeadm reset`，再手动 `rm -rf /etc/cni/net.d` 与 `$HOME/.kube/config`，重来。

### 速查 3：kubectl 命令速查表

语法：`kubectl <动作> <资源类型> <名字> [参数]`——和实验里敲的一模一样。

| 命令 | 作用 | 生产典型用法 |
| ---- | ---- | ---- |
| `kubectl get` | 查列表 | `kubectl get pods -A -o wide` |
| `kubectl describe` | 查详情（排障第一入口） | `kubectl describe pod xxx -n prod` |
| `kubectl logs` | 看容器日志 | `kubectl logs -f xxx --tail=200` |
| `kubectl exec` | 进容器执行命令 | `kubectl exec -it xxx -- /bin/sh` |
| `kubectl edit` | 在线修改资源 | `kubectl edit deployment web -n prod` |
| `kubectl apply` | 声明式发布（YAML 入口） | `kubectl apply -f deploy.yaml` |
| `kubectl delete` | 删除资源 | `kubectl delete -f deploy.yaml` |
| `kubectl cp` | 与容器互拷文件 | `kubectl cp xxx:/etc/nginx/nginx.conf ./` |
| `kubectl top` | 实时资源占用 | `kubectl top nodes`（需 metrics-server） |

```bash
# 高频组合（背下来能应付一半日常）
kubectl get pods -A -o wide                       # 全命名空间 + 所在节点 + Pod IP
kubectl get deploy,svc,ep -n prod                 # 一次看部署/服务/后端地址
kubectl get pod xxx -o yaml                       # 看完整定义（排查配置被改过什么）
kubectl logs xxx --previous                       # 上一次崩溃容器的日志（CrashLoop 必用）
kubectl logs xxx -c sidecar --since=10m           # 多容器 Pod 用 -c 指定
kubectl exec -it xxx -- /bin/sh                   # 进容器；没有 sh 就换 /bin/bash
kubectl rollout restart deployment/web -n prod    # 滚动重启（不换镜像的重建）
kubectl explain deployment.spec.strategy          # 忘了字段含义在线查
```

### 速查 4：生产 YAML 模板大全

#### 4.1 Pod：最小调度单元（生产不裸奔 Pod，用 Deployment 管）

一个 Pod 内的容器**共享网络与存储，一起被调度**。三种容器：主容器（业务）、sidecar 边车（伴生，如日志收集）、init 容器（在主容器前按顺序跑完才启动，用于等依赖就绪）。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-init
  namespace: prod
spec:
  initContainers:
  - name: wait-db                      # init 容器：等数据库端口通
    image: busybox:1.36
    command: ['sh', '-c', 'until nc -z mysql 3306; do echo waiting db; sleep 2; done']
  containers:
  - name: web
    image: registry.example.com/app/web:1.2.0
    ports:
    - containerPort: 8080
  - name: log-sidecar                  # 边车容器：持续转发日志
    image: registry.example.com/infra/fluent-bit:2.2
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  volumes:
  - name: logs
    emptyDir: {}
```

生命周期：Pending → ContainerCreating → Running →（探针通过后 Ready）→ Terminating。

#### 4.2 Deployment：实验三的生产完全体

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: prod
spec:
  replicas: 3
  revisionHistoryLimit: 10            # 保留 10 个历史版本，供回滚
  selector:
    matchLabels:
      app: web
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                      # 滚动时最多临时多起 1 个新 Pod
      maxUnavailable: 0                # 滚动期间不允许 Pod 不可用（平滑发布）
  template:
    metadata:
      labels:
        app: web
    spec:
      terminationGracePeriodSeconds: 30
      containers:
      - name: web
        image: registry.example.com/app/web:1.2.0   # 生产固定 tag，禁用 latest
        resources:
          requests:                    # 调度依据：至少保证这么多资源
            cpu: 250m                   # 250m = 0.25 核
            memory: 256Mi
          limits:                      # 上限：超内存直接被 OOMKill
            cpu: "1"
            memory: 512Mi
        startupProbe:   { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 5, failureThreshold: 30 }  # 启动探针：容忍 150s
        readinessProbe: { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10, failureThreshold: 3 }  # 就绪探针：不过就摘流量
        livenessProbe:  { httpGet: { path: /healthz, port: 8080 }, periodSeconds: 10, failureThreshold: 3 }  # 存活探针：失败重启容器
```

发布、扩缩容与回滚三板斧：

```bash
kubectl apply -f web-deploy.yaml                       # 发布/更新
kubectl set image deployment/web web=.../web:1.3.0 -n prod   # 只换镜像的快速发布
kubectl rollout status deployment/web -n prod          # 盯滚动进度
kubectl scale deployment/web --replicas=6 -n prod      # 手动扩容
kubectl rollout undo deployment/web -n prod            # 回滚上一版（历史用 rollout history 查）
kubectl rollout undo deployment/web --to-revision=2 -n prod   # 回滚指定版本
```

#### 4.3 Service：稳定访问入口（三型全收）

```yaml
# ClusterIP（默认）：集群内访问
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: prod
spec:
  selector:
    app: web
  ports:
  - port: 80          # Service 端口
    targetPort: 8080  # 容器实际端口（两处不同是新手大坑）
---
# NodePort：每个节点开 30000-32767 端口，集群外用 节点IP:30080 访问
apiVersion: v1
kind: Service
metadata:
  name: web-np
  namespace: prod
spec:
  type: NodePort
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080
---
# LoadBalancer：云厂商自动分配公网/内网 VIP（天翼云等云平台场景）
apiVersion: v1
kind: Service
metadata:
  name: web-lb
  namespace: prod
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
  externalTrafficPolicy: Local   # 保留客户端源 IP（排障看真实来源）
```

服务发现：CoreDNS 为每个 Service 注册域名 `svc名.命名空间.svc.cluster.local`（同命名空间直接写 Service 名即可）。验证：`kubectl exec -it web-xxxx -- curl -s http://web.prod.svc.cluster.local | head`

#### 4.4 Ingress：七层路由入口

NodePort 端口难记、LoadBalancer 一个服务一个 LB 太贵。Ingress 用**一个入口按域名/路径分发到不同 Service**（类似集中式 Nginx）。思路：① 装 ingress-nginx 控制器；② 控制器用 NodePort 或 hostNetwork 暴露 80/443；③ 业务写 Ingress 规则接入。

```bash
# 自建集群用 baremetal 版；国内把 yaml 里镜像改为 dyrnq/ingress-nginx-controller:v1.10.1
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/baremetal/deploy.yaml
kubectl get pods,svc -n ingress-nginx   # 验证就绪，记下映射出的 30000+ 端口
```

路由规则：`shop.example.com` 整站走 web 服务，`/api` 前缀走 api 服务：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  namespace: prod
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"    # 上传大文件必加（默认 1m 会 413）；HTTPS 证书配在 spec.tls 段
spec:
  ingressClassName: nginx
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service: { name: web, port: { number: 80 } }
      - path: /api
        pathType: Prefix
        backend:
          service: { name: api, port: { number: 80 } }
```

#### 4.5 ConfigMap / Secret 与三种挂载方式

```bash
kubectl create configmap app-conf -n prod --from-literal=LOG_LEVEL=info --from-file=app.properties   # -o yaml 检查内容
kubectl create secret generic db-secret -n prod --from-literal=username=root --from-literal=password='P@ssw0rd'   # 仅 base64 编码，不是加密！

# 私有镜像仓库认证 Secret（ImagePullBackOff 排障必备）
kubectl create secret docker-registry regcred -n prod --docker-server=registry.example.com \
  --docker-username=deploy --docker-password='xxxx'
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: config-demo
  namespace: prod
spec:
  containers:
  - name: web
    image: registry.example.com/app/web:1.2.0
    env:
    - name: LOG_LEVEL                   # 方式一：单值注入环境变量
      valueFrom:
        configMapKeyRef:
          name: app-conf
          key: LOG_LEVEL
    envFrom:                            # 方式二：整个 Secret 展开为环境变量
    - secretRef:
        name: db-secret
    volumeMounts:                       # 方式三：挂载为文件（应用读文件）
    - name: conf
      mountPath: /etc/app
  volumes:
  - name: conf
    configMap:
      name: app-conf
```

> 生产区别：env 方式**改了不生效**（要重启 Pod）；volume 方式改了约 1 分钟内自动更新。需要热更新的配置一律走文件挂载，并加 `subPath` 防止覆盖目录里已有文件。

#### 4.6 PV / PVC / StorageClass：存储三连

- **PV**：集群的存储资源（运维创建，代表一块真实存储）；**PVC**：应用的"申请单"，按大小和访问模式自动匹配 PV。回收策略：`Retain`（删 PVC 数据保留，生产默认）、`Delete`（自动清理）。PVC 必须状态 Bound，否则 Pod 一直 Pending。

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-nfs-web
spec:
  capacity:
    storage: 20Gi
  accessModes:
  - ReadWriteMany                # NFS 支持多节点同时读写
  persistentVolumeReclaimPolicy: Retain
  nfs:
    server: 192.168.10.100       # NFS 服务器地址
    path: /data/k8s/web          # NFS 导出目录
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-web
  namespace: prod
spec:
  accessModes:
  - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
```

Pod 挂载 PVC：

```yaml
  containers:
  - name: web
    volumeMounts:
    - name: data
      mountPath: /usr/share/nginx/html
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: pvc-web
```

StorageClass 动态供给：静态 PV 要手工一块块建，StorageClass + provisioner 实现"建 PVC 自动造 PV"。常用 NFS provisioner（`nfs-subdir-external-provisioner`）或 Ceph RBD，云上直接用云盘 StorageClass，PVC 里指定 `storageClassName: nfs-client` 即可，删 PVC 自动清理（可配归档）。选型：**数据库等高性能需求用云盘/Ceph，共享文件用 NFS**。验证：`kubectl get pv,pvc -n prod`。

#### 4.7 HPA 自动扩缩容（实验四的自动化版）

前提一：部署 metrics-server（`kubectl top` 和 HPA 都依赖它），国内改造：镜像改 `dyrnq/metrics-server:v0.7.1`，args 加 `--kubelet-insecure-tls`（自签证书集群必加，否则 x509）：

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl top nodes && kubectl top pods -n prod   # 能出数据即就绪
```

前提二：目标 Deployment **必须配 requests**——HPA 利用率以 requests 为分母，没有 requests 就没有指标。

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web
  namespace: prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # 平均 CPU 超 70% 就扩容
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300   # 缩容冷静期 5 分钟，防抖动
```

```bash
kubectl apply -f web-hpa.yaml
kubectl get hpa -n prod -w     # watch 观察 TARGETS
# 压测验证：busybox 死循环打请求
kubectl run load-test --rm -it --image=busybox:1.36 -- /bin/sh -c "while true; do wget -q -O- http://web.prod.svc.cluster.local >/dev/null; done"
```

### 速查 5：探针三件套（实验七 CrashLoop 排错的背后机制）

| 探针 | 人话 | 失败后果 |
| ---- | ---- | ---- |
| **livenessProbe** 存活 | 摸额头：进程还活着吗 | 重启容器 |
| **readinessProbe** 就绪 | 问状态：能接客了吗 | 从 Service 后端摘除（不重启） |
| **startupProbe** 启动 | 等起床：应用起完了吗 | 通过之前屏蔽前两种探针 |

生产参数三条铁律：

1. **慢启动应用必配 startupProbe**，替代 `initialDelaySeconds` 瞎猜启动时间。原则：`periodSeconds × failureThreshold ≥ 应用最慢启动时间`（写法见速查 4.2）。
2. **liveness 检查点不要依赖外部服务**（数据库一抖动就全集群重启，雪崩），查 `/healthz` 这类进程自身健康接口。
3. **readiness 做真实可用性检查**（能处理请求才 Ready），保证滚动发布零流量损失；连续失败 3 次（约 30 秒）再摘流量，防误伤；HTTP 探针优于 exec 探针（开销小、日志干扰少），接口慢就加 `timeoutSeconds`（默认 1s）。

### 速查 6：调度速查——把 Pod 钉到特定节点

```bash
kubectl label nodes k8s-node1 disktype=ssd     # 给节点打标签
```

```yaml
spec:
  nodeSelector: { disktype: ssd }    # 只调度到有该标签的节点
```

污点（taint）让节点**拒绝**没带容忍的 Pod，用途：Master 专用、GPU/监控专用、故障维护。

```bash
kubectl taint nodes k8s-node1 dedicated=monitor:NoSchedule    # 打污点
kubectl taint nodes k8s-node1 dedicated=monitor:NoSchedule-   # 删污点（末尾减号）
```

| 效果 | 含义 |
| ---- | ---- |
| `NoSchedule` | 新 Pod 不再调度上来（已有的不动） |
| `PreferNoSchedule` | 尽量不调度，实在没地方也可以来 |
| `NoExecute` | 新的不来，**已有的也驱逐** |

```yaml
spec:
  tolerations:
  - { key: dedicated, value: monitor, effect: NoSchedule }   # 让特定 Pod 忍受污点
```

> 记忆：**Master 默认带 `node-role.kubernetes.io/control-plane:NoSchedule` 污点**，这就是业务 Pod 不上 Master 的原因。

### 速查 7：排障工具箱（三板斧的生产全量版）

第一铁律：**先 `describe` 看 Events 事件区，再看 logs，最后 exec 进去**。

**Pending（根本没起）**——`kubectl describe pod xxx -n prod` 盯 Events：

| Events 关键字 | 原因 | 处理 |
| ---- | ---- | ---- |
| `Insufficient cpu/memory` | 节点资源不够或 requests 太大 | 调小 requests 或加节点 |
| `no nodes available to schedule pods` | 污点/标签不匹配 | 检查 nodeSelector、tolerations |
| `persistentvolumeclaim ... not found / unbound` | PVC 没绑定 | 检查 PV/PVC（速查 4.6） |

**CrashLoopBackOff（起来就崩，反复重启）**：

```bash
kubectl logs xxx -n prod --previous              # 上一次崩溃的日志（最关键）
kubectl describe pod xxx | grep -A3 "Last State" # 看 Exit Code
```

- Exit Code **137** → OOMKilled：limits 内存太小，调大
- Exit Code **1** 且日志有报错 → 应用问题：配置错、依赖连不上、`command`/`entrypoint` 写错（exec 不进去时用 `kubectl debug` 排查）
- 日志正常但反复重启 → livenessProbe 误杀（检查探针路径端口是否真通）

**ImagePullBackOff**——`kubectl describe pod xxx | grep -A5 "Failed"`：

| 报错 | 原因 | 处理 |
| ---- | ---- | ---- |
| `manifest unknown` / `not found` | 镜像名或 tag 写错 | 核对镜像全名，严禁裸 latest |
| `authorization required` / `401` | 私有仓库没认证 | 配 imagePullSecrets（Secret 见 4.5，挂 `spec.imagePullSecrets`） |
| `i/o timeout` | 节点访问不了仓库 | 节点配内网仓库地址/代理，或预拉镜像 |

**节点 NotReady**：

```bash
kubectl describe node k8s-node1 | tail -20    # 看节点事件
ssh k8s-node1
journalctl -u kubelet -n 50 --no-pager        # 十有八九答案在这
systemctl restart containerd kubelet          # 常规恢复
```

高频原因：kubelet 挂了（直接重启）、**swap 被重启后自动打开**（K8S 最经典坑，`swapoff -a`）、containerd 挂了、节点磁盘打满、网络不通导致心跳超时。

**资源不足摸底**：

```bash
kubectl top nodes                             # 摸底各节点负载
kubectl get pods -A --field-selector=status.phase=Pending    # 全局 Pending 一览
kubectl get events -A --sort-by=.lastTimestamp | tail -30    # 最近的 FailedScheduling
```

### 速查 8：运维日常四件事

**证书**：kubeadm 默认证书**有效期 1 年**，到期整个集群瘫（apiserver 拒绝连接），必须列入巡检（规范做法：Prometheus 证书剩余天数告警，提前一个月开工单）：

```bash
kubeadm certs check-expiration                # 看所有证书剩余天数
# 到期前 30 天内续期（控制面服务需逐个重启静态 Pod 生效）
kubeadm certs renew all
mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/ && sleep 20 && mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/
```

**etcd 备份与恢复**（灾保底牌；备份 crontab 每天凌晨执行，如 `0 2 * * *`）：

```bash
ETCDCTL_API=3 etcdctl snapshot save /data/backup/etcd-$(date +\%F).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
ETCDCTL_API=3 etcdctl snapshot status /data/backup/etcd-2026-10-12.db --write-out=table   # 校验，能出 HASH 行才算成功

# 恢复（在 etcd 所在 master 上）：
mv /etc/kubernetes/manifests /etc/kubernetes/manifests.bak            # 1. 停控制面静态 Pod
etcdutl snapshot restore /data/backup/etcd-2026-10-12.db --data-dir /var/lib/etcd-restore   # 2. etcd 3.5+ 用 etcdutl
# 3. 改 manifests.bak/etcd.yaml 里 --data-dir 与 hostPath 指向 /var/lib/etcd-restore，移回拉起控制面
mv /etc/kubernetes/manifests.bak /etc/kubernetes/manifests
```

**版本升级**：一次只升一个小版本（1.28→1.29，禁止跳版本），先测试环境演练并确认 CNI/ingress-nginx/metrics-server 兼容；顺序：先第一个 Master、再其余 Master、最后逐台 Worker；升级前**必须先做 etcd 备份**。

```bash
# Master 升级
kubeadm upgrade plan && kubeadm upgrade apply v1.29.5
yum install -y kubeadm-1.29.5-0 kubelet-1.29.5-0 kubectl-1.29.5-0
systemctl daemon-reload && systemctl restart kubelet
# Worker 升级（逐台：先驱逐业务，升完确认 Ready 再升下一台）
kubectl drain k8s-node1 --ignore-daemonsets --delete-emptydir-data
kubeadm upgrade node                     # 在 node1 上执行
yum install -y kubeadm-1.29.5-0 kubelet-1.29.5-0 kubectl-1.29.5-0 && systemctl daemon-reload && systemctl restart kubelet
kubectl uncordon k8s-node1
```

**节点维护 drain / uncordon**：

```bash
kubectl cordon k8s-node1    # 标记不可调度（防止维护期间又调度新 Pod 上来）
kubectl drain k8s-node1 --ignore-daemonsets --delete-emptydir-data   # 驱逐业务 Pod 到其他节点
kubectl uncordon k8s-node1  # 维护（内核/磁盘/重启）完成，恢复调度
```

> `drain` 会因 DaemonSet（不能驱逐）和 emptyDir（数据会丢）报错，生产按上面两个参数跳过；有状态服务记得确认副本/PDB 足够。

### 速查 9：生产上线 Checklist

| # | 检查项 | 核对点 |
| -- | ---- | ---- |
| 1 | 镜像规范 | 固定版本 tag（禁 latest），已推私有仓库，imagePullSecrets 就绪 |
| 2 | 资源限制 | requests/limits 双双配置，requests 按实测利用率 +30% 余量 |
| 3 | 健康探针 | 三种探针齐全，startupProbe 覆盖最慢启动时间 |
| 4 | 发布策略 | maxUnavailable=0 + revisionHistoryLimit≥5，验证过 rollback |
| 5 | 高可用 | 副本≥2，`podAntiAffinity` 分散到不同节点，Master≥3 台 |
| 6 | 敏感配置 | 密码/密钥全部用 Secret，未硬编码在镜像或 env |
| 7 | 存储 | PVC 已 Bound，数据库用块存储而非 NFS，回收策略 Retain |
| 8 | 自动伸缩 | 已部署 metrics-server，HPA 与缩容冷静期配置 |
| 9 | 可观测性 | 日志采集（EFK/Loki）+ 监控告警（Prometheus + 告警规则） |
| 10 | 灾备与证书 | etcd 每日备份已落异地且演练过恢复，证书剩余天数告警已接入；Ingress 域名/证书/限流明确且压测过 |

### 速查 10：常见故障速查表（现象 → 原因 → 处理）

| 现象 | 高频原因 | 处理 |
| ---- | ---- | ---- |
| Pod 一直 Pending | 资源不足/PVC 未绑定/污点不匹配 | `describe` 看 Events，对号速查 7 |
| CrashLoopBackOff | OOM、配置错、探针误杀 | `logs --previous` + Exit Code 对号速查 7 |
| ImagePullBackOff | 镜像名错/仓库未认证/网络不通 | 对号速查 7，配置 imagePullSecrets |
| Service 访问 502/无后端 | label selector 不匹配、targetPort 写错、Pod 不 Ready | `kubectl get ep` 看后端是否为空，核对 label 和端口 |
| 节点 NotReady | kubelet 挂、swap 被打开、containerd 挂、磁盘满 | 对号速查 7，`journalctl -u kubelet` |
| `kubectl top` 无数据 | metrics-server 未部署或 x509 报错 | 部署并加 `--kubelet-insecure-tls` |
| Ingress 404 / 413 | 路由规则没匹配、上传超 1m | 核对 host/path 与 Service；加 proxy-body-size |
| HPA 不扩容 | 无 requests、指标没采集到 | 补 requests，查 metrics-server |
| 配置改了不生效 | 用 env 方式挂载 ConfigMap | 改成 volume 挂载并重启；或 rollout restart |
| 节点重启后异常 | swap 被重新打开 | `swapoff -a` + 注释 fstab（对号速查 7） |

> AI生成
