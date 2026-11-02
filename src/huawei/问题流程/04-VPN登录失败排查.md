---
title: VPN登录失败排查流程
category: 工作流程与问题处理
tags:
  - 运维
  - VPN
  - 排查
order: 4
redirectFrom: /huawei/问题流程/03-VPN登录失败排查.html
---

## 举例：回复话术

> 我们查了一下，该 VPN 账户是有访问 https://10.100.7.251:8443 的权限

## VPN打不开处理流程（以 https://10.100.7.251:8443 账户：yzw-xcnw_znyw 举例）

1、登录 inode 客户端后打开 cmd ping 客户说的不通网址，先查看 ping 结果再进行下一步

2、登录 https://10.100.7.251:8443，然后用户-用户管理-搜索 yzw-xcnw_znyw 这个用户。查看用户的状态是否启用，启用则说明这里没问题

3、登录 M9000 防火墙（https://10.240.3.1/web/frame/login.html），点击对象-用户-用户管理-本地用户，搜索 yzw-xcnw_znyw 查看用户的状态是否生效还是失效状态。

4、还是不通可以让客户发一下账号密码自行登录测试

> AI生成
