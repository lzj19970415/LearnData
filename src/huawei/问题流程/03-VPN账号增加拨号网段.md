---
title: VPN账号增加拨号网段
category: 工作流程与问题处理
tags:
  - 运维
  - VPN
  - 防火墙
order: 3
---

给已有 SSL VPN 账号增加新的拨号网段（放通新网段访问）的标准流程。

## 举例

- 以账号 zw_Ncc_cwxtXXX 为例，给该账号增加新的拨号网段（如 10.190.1.0）

## 步骤

### 1、查账号属于哪个 SSL 组

```
dis cu | include zw_Ncc_cwxtXXX
```

- 从输出里看这个账号挂在哪个组，假设是 111 组

### 2、进 SSL 视图和策略组，查分流到哪个 ACL

```
sslvpn context ssl
policy-group 111
dis th
```

- 从输出里看该组分流到哪个 ACL，假设是 3222

### 3、退出策略组，查看 ACL 里有没有要放通的网段

```
q
dis acl 3222
```

- 已有目标网段就不用再加，没有就进下一步

### 4、进 ACL 组添加放通规则（沿用现有规则的写法）

```
acl ad 3222
rule xx permit ip destination xx.xx.xx.xx 0
q
```

### 5、添加完成，让账号重新登录 VPN 即可生效

- 验证：重连后 ping 目标网段，业务端口用 tcping 验证

## 注意

- rule 编号必须排在兜底拒绝规则（如 `rule 100 deny ip`）之前，否则放通不生效
- 如果该策略组没有引用 ACL（`dis th` 看不到 filter ACL、隧道内全放行），不适用本流程，需要去放通安全策略

> AI生成
