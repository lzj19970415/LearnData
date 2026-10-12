---
title: Kubernetes 从入门到生产实战
category: Linux进阶
tags:
  - Linux
  - Kubernetes
  - K8S
---

# Kubernetes 从入门到生产实战

> 面向电信行业云平台运维岗：从"会跑容器"到"能独立接管生产集群"。命令与 YAML 均可直接复用，把示例里的镜像、IP、域名换成自己的即可。

## 一、为什么需要 K8S

### 1.1 Docker 单机的局限

| 问题 | Docker 单机 | K8S 集群 |
| ---- | ---- | ---- |
| 容器挂了谁来拉起 | 依赖 `--restart`，进程级兜底 | 自动重建 Pod，自我修复 |
| 机器宕机 | 手工迁移 | Pod 自动漂移到健康节点 |
| 发布回滚 | 手工切镜像 | 滚动更新 + 一键回滚 |
| 服务发现/负载均衡 | 自配 Nginx | Service/Ingress 原生支持 |

一句话：Docker 解决"怎么打包运行"，K8S 解决"几百个容器在几十台机器上怎么活得好"。

### 1.2 核心架构

生产环境最低配：**3 台 Master（控制面）+ N 台 Worker（工作节点）**。Master 至少 3 台才能保证 etcd 多数派存活。

### 1.3 Master 控制面组件

- **kube-apiserver**：集群唯一入口，所有 kubectl/组件/Dashboard 的操作都经过它，认证、授权、写入 etcd。
- **etcd**：集群的"数据库"，存全部状态数据（Pod/Service/Secret/配置）。**最重要的组件，必须备份**。
- **kube-scheduler**：调度器，决定新 Pod 放到哪个节点（看资源够不够、亲和性、污点）。
- **kube-controller-manager**：控制器大脑，持续对比"期望状态 vs 实际状态"并纠偏（副本数少了就补 Pod）。

> 生产提示：Master 不跑业务 Pod（默认有污点隔离），资源建议 4C8G 起步，etcd 用 SSD 盘。

### 1.4 Node 工作节点组件

- **kubelet**：节点上的"代理"，接收 apiserver 指令，管理本节点 Pod 生命周期，上报健康状态。
- **kube-proxy**：维护 Service 的转发规则（iptables/ipvs 模式），实现 ClusterIP 负载均衡。
- **容器运行时**：真正拉镜像起容器，常用 containerd（Docker 从 1.24 起被移除）。

## 二、集群搭建：kubeadm 生产实践

### 2.1 环境准备（所有节点执行）

```bash
hostnamectl set-hostname k8s-master1    # 1. 主机名（每台不同：k8s-node1、k8s-node2...）
echo -e "192.168.10.10 k8s-master1\n192.168.10.11 k8s-node1\n192.168.10.12 k8s-node2" >> /etc/hosts

swapoff -a && sed -ri 's/.*swap.*/#&/' /etc/fstab   # 2. 关闭 swap（kubelet 硬性要求，注释 fstab 后重启也不打开）

# 3. 加载内核模块并持久化
modprobe overlay && modprobe br_netfilter
printf 'overlay\nbr_netfilter\n' > /etc/modules-load.d/k8s.conf

# 4. 内核参数（开启桥接转发）
cat > /etc/sysctl.d/k8s.conf <<'EOF'
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system

# 5. 安装 containerd 与 K8S 三件套（阿里云源，以 v1.29 为例）
yum install -y yum-utils && yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
printf '[kubernetes]\nname=Kubernetes\nbaseurl=https://mirrors.aliyun.com/kubernetes-new/core/stable/v1.29/rpm/\nenabled=1\ngpgcheck=0\n' > /etc/yum.repos.d/kubernetes.repo
yum install -y containerd.io kubeadm kubelet kubectl
systemctl enable --now containerd kubelet

# 6. containerd 两处关键配置：SystemdCgroup 与 pause 镜像国内化
containerd config default > /etc/containerd/config.toml
sed -i -e 's#SystemdCgroup = false#SystemdCgroup = true#' -e 's#registry.k8s.io/pause#registry.aliyuncs.com/google_containers/pause#' /etc/containerd/config.toml
systemctl restart containerd
```

### 2.2 初始化 Master（只在第一台 Master 执行）

```bash
kubeadm init \
  --kubernetes-version=v1.29.4 \
  --image-repository registry.aliyuncs.com/google_containers \
  --apiserver-advertise-address=192.168.10.10 \
  --pod-network-cidr=10.244.0.0/16 \
  --service-cidr=10.96.0.0/12 --service-dns-domain=cluster.local
```

关键参数：

- `--pod-network-cidr`：Pod 网段，**必须与 CNI 插件网段一致**（flannel 固定 10.244.0.0/16）。
- `--service-cidr`：Service 网段，默认 10.96.0.0/12；`--service-dns-domain`：集群内域名后缀，默认 cluster.local。
- `--apiserver-advertise-address`：apiserver 对外通告地址，多网卡机器必须指定。
- `--control-plane-endpoint`：高可用集群加该参数，指向 LB 的 VIP + 6443 端口；`--image-repository`：国内拉不动 registry.k8s.io 时用阿里云镜像仓库。

初始化成功后按提示执行：

```bash
mkdir -p $HOME/.kube && cp -i /etc/kubernetes/admin.conf $HOME/.kube/config && chown $(id -u):$(id -g) $HOME/.kube/config

# Worker 加入（init 结尾输出的命令，24 小时有效；过期用 kubeadm token create --print-join-command 重新生成）
kubeadm join 192.168.10.10:6443 --token abcdef.0123456789abcdef --discovery-token-ca-cert-hash sha256:xxxxxxxxxxxxxxxx
```

### 2.3 部署 CNI 网络插件

| 对比项 | flannel | calico |
| ---- | ---- | ---- |
| 性能 | VXLAN 封装，性能一般 | 支持 BGP 直连路由，性能好 |
| 网络策略 | 不支持 NetworkPolicy | 支持 NetworkPolicy 网络隔离 |
| 生产建议 | 测试/小集群 | **生产首选**（有安全隔离需求） |

```bash
# 方案 A：flannel（配合 --pod-network-cidr=10.244.0.0/16）
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
# 方案 B：calico（记得把 yaml 里 CALICO_IPV4POOL_CIDR 改成与 pod-network-cidr 一致）
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.27.3/manifests/calico.yaml

kubectl get nodes && kubectl get pods -n kube-system   # 验证：节点 Ready、coredns/网络插件全部 Running
```

### 2.4 常见初始化报错处理

| 报错关键字 | 原因 | 处理 |
| ---- | ---- | ---- |
| `[ERROR Swap]` | swap 没关干净 | `swapoff -a` 并注释 fstab 对应行 |
| `[ERROR Port-10250]` 端口占用 | 旧进程残留 | `ss -lntp \| grep 10250`，`systemctl stop kubelet` 后重试 |
| `kubelet isn't running or healthy` | kubelet 起不来 | `journalctl -u kubelet -n 50`，多为 swap/containerd 未就绪 |
| `cgroup driver` 不一致 | kubelet 用 systemd，运行时用 cgroupfs | 按 2.1 步骤 6 设置 `SystemdCgroup = true` 后重启 containerd |
| `node not found`（join 报错） | token 过期 / ca-hash 不对 | `kubeadm token create --print-join-command` 重新生成 |

通用兜底：`kubeadm reset`，再手动 `rm -rf /etc/cni/net.d` 与 `$HOME/.kube/config`，然后重来。

## 三、kubectl 常用命令速查表

kubectl 是日常 90% 工作的入口。语法：`kubectl <动作> <资源类型> <名字> [参数]`。

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
| `kubectl top` | 看实时资源占用 | `kubectl top nodes`（需 metrics-server） |

```bash
# 高频组合（背下来能应付一半日常）
kubectl get pods -A -o wide                       # 全命名空间 + 所在节点 + Pod IP
kubectl get deploy,svc,ep -n prod                 # 一次看部署/服务/后端地址
kubectl get pod xxx -o yaml                       # 看完整定义（排查配置被改过什么）
kubectl logs xxx --previous                       # 上一次崩溃容器的日志（CrashLoop 必用）
kubectl logs xxx -c sidecar --since=10m           # 多容器 Pod 用 -c 指定
kubectl exec -it xxx -- /bin/sh                   # 进入容器；没有 sh 就换 /bin/bash
kubectl rollout restart deployment/web -n prod    # 滚动重启（不换镜像的重建）
kubectl explain deployment.spec.strategy          # 忘了字段含义就在线查
```

## 四、核心资源与生产 YAML

### 4.1 Pod：最小调度单元

一个 Pod 内的容器**共享网络与存储，一起被调度**，典型三种：**主容器**（业务本身）、**sidecar 边车**（伴生容器，如日志收集 agent）、**init 容器**（在主容器前按顺序执行完毕才启动，用于等依赖就绪，如下例先等数据库起来）。

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
  - name: log-sidecar                  # 边车容器：持续转发日志（多容器示例）
    image: registry.example.com/infra/fluent-bit:2.2
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  volumes:
  - name: logs
    emptyDir: {}
```

生命周期：Pending → ContainerCreating → Running →（探针通过后 Ready）→ Terminating。**生产中不要裸奔 Pod**（挂了不自动重建），用 Deployment 管理。

### 4.2 Deployment：副本管理与滚动更新（生产核心）

生产完整 YAML，资源限制、探针、滚动策略三项一个不少：

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

### 4.3 Service：稳定的访问入口

Pod 会死会漂，Service 提供固定 IP + 域名 + 负载均衡，通过 label selector 关联后端 Pod。三种类型：

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
    targetPort: 8080  # 容器实际端口（两处不同是新手段坑）
---
# NodePort：每个节点开一个 30000-32767 端口，集群外用 节点IP:30080 访问
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

**服务发现**：CoreDNS 为每个 Service 注册域名 `svc名.命名空间.svc.cluster.local`（同命名空间直接写 Service 名即可），验证：`kubectl exec -it web-xxxx -- curl -s http://web.prod.svc.cluster.local | head`

### 4.4 Ingress：七层路由入口

NodePort 端口难记、LoadBalancer 每个服务一个 LB 太贵。Ingress 用**一个入口按域名/路径分发到不同 Service**（类似集中式 Nginx）。部署思路（裸机/自建）：① 安装 ingress-nginx 控制器；② 控制器用 NodePort 或 hostNetwork 暴露 80/443；③ 业务写 Ingress 规则接入。

```bash
# 安装 ingress-nginx（自建集群用 baremetal 版；国内把 yaml 镜像改为 dyrnq/ingress-nginx-controller:v1.10.1）
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/baremetal/deploy.yaml
kubectl get pods,svc -n ingress-nginx   # 验证就绪，记下映射出的 30000+ 端口（DNS 解析到 节点IP:该端口）
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

## 五、配置与存储

### 5.1 ConfigMap：非敏感配置

```bash
kubectl create configmap app-conf -n prod --from-literal=LOG_LEVEL=info --from-file=app.properties   # -o yaml 检查内容
```

### 5.2 Secret：密码/密钥（仅 base64 编码，不是加密！）

```bash
kubectl create secret generic db-secret -n prod --from-literal=username=root --from-literal=password='P@ssw0rd'

# 私有镜像仓库认证 Secret（ImagePullBackOff 排障必备）
kubectl create secret docker-registry regcred -n prod --docker-server=registry.example.com \
  --docker-username=deploy --docker-password='xxxx'
```

### 5.3 两种挂载方式：环境变量 vs 文件

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

> 生产区别：env 方式**改了不生效**（要重启 Pod）；volume 方式改了会自动更新（约 1 分钟内）。需要热更新的配置一律走文件挂载，并加 `subPath` 防止覆盖目录里已有文件。

### 5.4 PV / PVC：NFS 静态供给示例

- **PV**：集群的存储资源（运维创建，代表一块真实存储）；**PVC**：应用的"申请单"，按大小和访问模式自动匹配 PV。
- 回收策略：`Retain`（删 PVC 后数据保留，生产默认）、`Delete`（自动清理）。

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

验证：`kubectl get pv,pvc -n prod`，PVC 状态必须为 Bound，否则 Pod 一直 Pending。

### 5.5 StorageClass：动态供给思路

静态 PV 要手工一块块建，StorageClass + provisioner 实现"建 PVC 自动造 PV"。常用 NFS provisioner（`nfs-subdir-external-provisioner`）或 Ceph RBD，云上直接用云盘 StorageClass。PVC 里指定 `storageClassName: nfs-client` 即可，删 PVC 自动清理对应目录（可配置归档）。生产选型：**数据库等高性能需求用云盘/Ceph，共享文件用 NFS**。

## 六、探针：健康检查三件套

| 探针 | 作用 | 失败后果 |
| ---- | ---- | ---- |
| **livenessProbe** 存活 | 进程还活着吗 | 重启容器 |
| **readinessProbe** 就绪 | 能接流量了吗 | 从 Service 后端摘除（不重启） |
| **startupProbe** 启动 | 应用启动完了吗 | 通过之前屏蔽前两种探针 |

生产参数建议：

1. **慢启动应用必配 startupProbe**，替代 `initialDelaySeconds` 猜启动时间。原则：`periodSeconds × failureThreshold ≥ 应用最慢启动时间`。
2. **liveness 检查点不要依赖外部服务**（数据库一抖动就全集群重启，雪崩），检查 `/healthz` 这类进程自身健康接口。
3. **readiness 做真实可用性检查**（能处理请求才 Ready），保证滚动发布零流量损失；连续失败 3 次（约 30 秒）再摘流量，防误伤。HTTP 探针优于 exec 探针（开销小、日志干扰少）；接口慢就加 `timeoutSeconds`（默认 1s）。

完整 HTTP 探针写法（三探针共用同一 `/healthz` 接口）见 4.2 Deployment 生产 YAML，一般只需按启动时间调 `periodSeconds` 与 `failureThreshold`。

## 七、调度基础

### 7.1 label 与 nodeSelector：把 Pod 钉到特定节点

```bash
kubectl label nodes k8s-node1 disktype=ssd     # 给节点打标签
```

```yaml
spec:
  nodeSelector: { disktype: ssd }    # 只调度到有该标签的节点
```

### 7.2 污点与容忍：把节点从调度池隔离

污点（taint）让节点**拒绝**没带容忍的 Pod，典型用途：Master 专用、GPU/监控专用、故障维护。

```bash
kubectl taint nodes k8s-node1 dedicated=monitor:NoSchedule    # 打污点
kubectl taint nodes k8s-node1 dedicated=monitor:NoSchedule-   # 删除污点（末尾减号）
```

| 效果 | 含义 |
| ---- | ---- |
| `NoSchedule` | 新 Pod 不再调度上来（已有的不动） |
| `PreferNoSchedule` | 尽量不调度，实在没地方也可以来 |
| `NoExecute` | 新的不来，**已有的也驱逐** |

让特定 Pod 忍受污点（toleration）：

```yaml
spec:
  tolerations:
  - { key: dedicated, value: monitor, effect: NoSchedule }
```

> 记忆：**Master 默认带 `node-role.kubernetes.io/control-plane:NoSchedule` 污点**，这就是业务 Pod 不上 Master 的原因。

## 八、HPA 自动扩缩容

### 8.1 前提：部署 metrics-server

`kubectl top` 和 HPA 都依赖它，国内环境先改镜像再部署：

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# 国内改造：image 改为 dyrnq/metrics-server:v0.7.1；args 加 --kubelet-insecure-tls（自签证书集群必加，否则 x509）
kubectl top nodes && kubectl top pods -n prod   # 能出数据即就绪
```

> 前提二：目标 Deployment **必须配置 requests**，HPA 利用率以 requests 为分母，没有 requests 就没有指标。

### 8.2 HPA YAML 示例

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
kubectl get hpa -n prod -w     # watch 观察 TARGETS；压测验证：busybox 死循环打请求
kubectl run load-test --rm -it --image=busybox:1.36 -- /bin/sh -c "while true; do wget -q -O- http://web.prod.svc.cluster.local >/dev/null; done"
```

## 九、日常排障工具箱

排障第一铁律：**先 `describe` 看 Events 事件区，再看日志，最后 exec 进去**。

### 9.1 Pod 一直 Pending（根本没起）

```bash
kubectl describe pod xxx -n prod    # 盯住底部 Events
```

| Events 关键字 | 原因 | 处理 |
| ---- | ---- | ---- |
| `Insufficient cpu/memory` | 节点资源不够或 requests 太大 | 调小 requests 或加节点 |
| `no nodes available to schedule pods` | 污点/标签不匹配 | 检查 nodeSelector、tolerations |
| `persistentvolumeclaim ... not found / unbound` | PVC 没绑定 | 检查 PV/PVC（见 5.4） |

### 9.2 CrashLoopBackOff（起来就崩，反复重启）

```bash
kubectl logs xxx -n prod --previous              # 上一次崩溃的日志（最关键）
kubectl describe pod xxx | grep -A3 "Last State" # 看 Exit Code
```

- Exit Code **137** → OOMKilled：limits 内存太小，调大。
- Exit Code **1** 且日志有报错 → 应用问题：配置错、依赖数据库连不上、`command`/`entrypoint` 写错（exec 不进去时用 `kubectl debug` 排查）。
- 日志正常但反复重启 → livenessProbe 误杀（检查探针路径端口是否真通）。

### 9.3 ImagePullBackOff（镜像拉不下来）

```bash
kubectl describe pod xxx -n prod | grep -A5 "Failed"
```

| 报错 | 原因 | 处理 |
| ---- | ---- | ---- |
| `manifest unknown` / `not found` | 镜像名或 tag 写错 | 核对镜像全名，严禁裸 latest |
| `authorization required` / `401` | 私有仓库没认证 | 配 imagePullSecrets（Secret 创建见 5.2，挂 spec.imagePullSecrets） |
| `i/o timeout` | 节点访问不了仓库 | 节点配内网仓库地址/代理，或预拉镜像 |

### 9.4 节点 NotReady

```bash
kubectl describe node k8s-node1 | tail -20    # 看节点事件
ssh k8s-node1
journalctl -u kubelet -n 50 --no-pager        # 十有八九答案在这
systemctl restart containerd kubelet          # 常规恢复
```

高频原因：kubelet 挂了（直接重启）、**swap 被重启后自动打开**（K8S 最经典坑，`swapoff -a`）、containerd 挂了、节点磁盘打满、网络不通导致心跳超时。

### 9.5 资源不足排查

```bash
kubectl top nodes                             # 摸底各节点负载；长期低利用率的超配额应用高峰前先回收
kubectl get pods -A --field-selector=status.phase=Pending           # 全局 Pending 一览
kubectl get events -A --sort-by=.lastTimestamp | tail -30           # 最近的 FailedScheduling
```

## 十、运维日常

### 10.1 证书到期检查

kubeadm 默认证书**有效期 1 年**，到期整个集群瘫（apiserver 拒绝连接），必须列入巡检（更规范：接入 Prometheus 证书剩余天数告警，提前一个月发工单）：

```bash
kubeadm certs check-expiration                # 看所有证书剩余天数
# 到期前 30 天内续期（控制面服务需逐个重启静态 Pod 生效）
kubeadm certs renew all
mv /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/ && sleep 20 && mv /tmp/kube-apiserver.yaml /etc/kubernetes/manifests/
```

### 10.2 etcd 备份与恢复（灾保底牌）

**备份**（crontab 每天凌晨执行，如 `0 2 * * *`）：

```bash
ETCDCTL_API=3 etcdctl snapshot save /data/backup/etcd-$(date +\%F).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
ETCDCTL_API=3 etcdctl snapshot status /data/backup/etcd-2026-10-12.db --write-out=table   # 校验，能出 HASH 行才算备份成功
```

**恢复**（在 etcd 所在 master 上操作）：

```bash
# 1. 停掉控制面静态 Pod（etcd 随之停止）
mv /etc/kubernetes/manifests /etc/kubernetes/manifests.bak
etcdutl snapshot restore /data/backup/etcd-2026-10-12.db --data-dir /var/lib/etcd-restore   # 2. etcd 3.5+ 用 etcdutl
# 3. 修改 manifests.bak/etcd.yaml 里 --data-dir 与 hostPath 指向 /var/lib/etcd-restore，移回拉起控制面
mv /etc/kubernetes/manifests.bak /etc/kubernetes/manifests
```

### 10.3 集群版本升级要点

1. **一次只升一个小版本**（1.28→1.29，禁止跳版本），先在测试环境演练，并确认 CNI/ingress-nginx/metrics-server 插件兼容。
2. 顺序：先升第一个 Master，再其余 Master，最后逐台 Worker。
3. 升级前**必须先做 etcd 备份**。

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

### 10.4 节点维护：drain / uncordon

```bash
kubectl cordon k8s-node1    # 先标记不可调度（防止维护期间又调度新 Pod 上来）
kubectl drain k8s-node1 --ignore-daemonsets --delete-emptydir-data   # 驱逐业务 Pod 到其他节点
kubectl uncordon k8s-node1  # 维护（内核/磁盘/重启）完成，恢复调度
```

> `drain` 会因 DaemonSet（不能驱逐）和 emptyDir（数据会丢）报错，生产按上面两个参数跳过；有状态服务记得确认副本/PDB 足够。

## 十一、生产上线 Checklist 与故障速查

### 11.1 生产上线 Checklist

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

### 11.2 常见故障速查表（现象 → 原因 → 处理）

| 现象 | 高频原因 | 处理 |
| ---- | ---- | ---- |
| Pod 一直 Pending | 资源不足/PVC 未绑定/污点不匹配 | `describe` 看 Events，对号 9.1 |
| CrashLoopBackOff | OOM、配置错、探针误杀 | `logs --previous` + Exit Code 对号 9.2 |
| ImagePullBackOff | 镜像名错/仓库未认证/网络不通 | 对号 9.3，配置 imagePullSecrets |
| Service 访问 502/无后端 | label selector 不匹配、targetPort 写错、Pod 不 Ready | `kubectl get ep` 看后端是否为空，核对 label 和端口 |
| 节点 NotReady | kubelet 挂、swap 被打开、containerd 挂、磁盘满 | 对号 9.4，`journalctl -u kubelet` |
| `kubectl top` 无数据 | metrics-server 未部署或 x509 报错 | 部署并加 `--kubelet-insecure-tls` |
| Ingress 404 / 413 | 路由规则没匹配、上传超 1m | 核对 host/path 与 Service；加 proxy-body-size |
| HPA 不扩容 | 无 requests、指标没采集到 | 补 requests，查 metrics-server |
| 配置改了不生效 | 用 env 方式挂载 ConfigMap | 改成 volume 挂载并重启；或 rollout restart |
| 节点重启后异常 | swap 被重新打开 | `swapoff -a` + 注释 fstab（对号 9.4） |

> AI生成