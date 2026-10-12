---
title: 信创外网创建云主机流程
category: 工作流程与问题处理
tags:
  - 云主机
  - 信创
  - 运维
---

> 本文整理自《信创外网创建云主机流程》文档，含操作步骤与截图。

外网1跟外网2主机的堡垒机是开在绿盟堡垒机上

信创外网创建云主机流程：

![图0](/cloudhost/image1.png)

网络就是选择VPC网络，根据合同项目选择网络

![图1](/cloudhost/image2.png)

![图2](/cloudhost/image3.png)

添加安全组

![图3](/cloudhost/image4.png)

填写安全组规则

这两条是堡垒机和扫描器的ip，端口一个是22、另外一个all

![图4](/cloudhost/image5.png)

查看管理者对不对，不对需要修改管理者，管理者可以看审批流程有没有经过这个人（管理局的），没有就选择其他的，有就选择yzw_xc_glj

![图5](/cloudhost/image6.png)

更改所有者后绑定网卡

![图6](/cloudhost/image7.png)

可选：要加公网的情况

创建弹性IP

![图7](/cloudhost/image8.png)

选择公有网络

![图8](/cloudhost/image9.png)

选择公网地址

![图9](/cloudhost/image10.png)

虚拟ip 搜索

![图10](/cloudhost/image11.png)

添加QoS

根据需求工单来选择填写

![图11](/cloudhost/image12.png)

第二部分：

![图12](/cloudhost/image13.png)

![图13](/cloudhost/image14.png)

加完记得要测试网络是否正常

> AI生成