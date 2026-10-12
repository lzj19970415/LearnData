---
title: 华为IT云部署运维笔记
category: 华为IT云
tags:
  - FusionCompute
  - 虚拟化
  - 运维
---

> 本笔记由 xmind 思维导图《华为IT云》整理而来，涵盖华为 FusionCompute 云计算平台的部署、集群、存储、网络与运维要点。

# IT云

## OMC部署

### fusion computer安装配置
- 使用smartkit工具升级（ibmc，网卡，raid卡，rised卡、划分raid
- **安装fc教程**
  - **虚拟化部署：**
    - 找两台设备当管理节点，先安装CNA计算节点系统，安装的时候配置管理ip，绑定静态ip就可以（先不做bond，不然会提示安装失败等问题），安装好了使用自定义安装，选择安装vrm，导入vrm包，安装vrm
    - 备注：bond是把fc平台创建起来后进入web界面平台绑定
  - 备注：安装fc的时候，交换机的网络一定不做bond绑定，如果是主备绑定，网络跟静态网络是相通的，搭建的时候网络才不会有问题
  - **物理部署：**
    - 选择两台服务器充当管理节点，手动安装vrm系统，计算节点安装cna系统，平台创建起来后进入web界面配置bond
- **安装主机**
  - **使用fusion computer安装工具安装**
    - 使用工具要确定pxe起来，不起来可能是网络问题，网络排查：ping网关，两台电脑连接交换机ping网络是否通，登陆虚拟机查看地址
  - **填写参数注意点**
    - 使用工具安装时把主机和vrm尽量分开安装
    - DHCP起始地址就是要安装主机的第一个IP地址
    - 设置swap分区大小时，所填数字必须是大于等于30的整数。
  - 点击配置服务之后，等待进入扫描主机页面，然后手动重启主机服务器，等待主机都扫描出来然后修改参数，开始安装。
- **安装vrm**
  - 同上所述
- 主机安装完成后，修改密码（gandalf、bmc、root）修改命令：echo '新密码' | passwd --stdin 账号、使用配置好的IP地址通过crt登陆查询HBA卡信息。命令是：cat /sys/class/fc_host/host*/port_name
- **使用浮动IP登陆web进行管理**
  - 配置fusion computer NTP时钟源与时区
  - 添加集群
  - **添加主机**
    - 手动添加和批量添加
  - 添加vlan池
  - **配置主机管理域服务资源预留（也就是说配置预留内存和cpu）**
    - 注：部署好分布式存储后再开始配置这个步骤
  - **绑定网口**
    - 手动绑定和批量绑定
    - 在绑定网口这步骤，在不清楚存储平面个业务平面的情况下，可以在主机那里把一边的拔掉，再刷新页面就可以判断存储和业务平面
    - 网口绑定选择”基于源目的IP和端口负荷分担“这一选项
  - **添加存储接口**
    - vlan ID：lld表里的存储平面vlan
    - IP地址：管理平面中的存储IP
  - fc里面创建交换机，只添加服务链路，命名一般是根据服务网口名称来，例如：service
- **在和fs对接后，发放虚拟机，有的客户需要增加自己规划的vlan**
  - 添加端口组页面进行添加

### fusion storage安装配置
- **安装前检查**
  - 登陆iBMC管理页面安装操作系统（安装操作系统可查看分布式块存储指导书里面）
  - 安装前检查：确认安装的版本，再下载相关的配套版本固件进行升级
  - 关闭SMMU功能：进入bios单击“Advanced”页签，选择“MISC Config”。将“Support Smmu”选项置为“Disabled”的状态。（仅taishan 200服务器需要关闭）
  - JBOD功能看RAID类型决定开启或关闭
- **安装操作系统及修改参数配置**
  - 网站下载相关系统包：https://support.huawei.com/enterprise/zh/intelligent-accelerator-components/es3000-v5-pid-22936194/software/251983097?idAbsPath=fixnode01%7C23710424%7C251364417%7C9856629%7C22936194
  - 升级bios、ibmc（使用smartkit工具可以升级）、安装加速卡驱动（执行rpm -ivh 驱动软件包名称，安装后查看：rpm -qa | grep hiodriver）、工具（执行rpm -ivh 工具包名称，安装后查看：rpm -qa | grep hioadm）fw固件也要升级
  - **绑定网口，先查看网口类型**
    - ifconfig |more
  - **确定已经连接的网口，使用命令查询后网口会快速闪现，即可判断是业务口还是存储口**
    - ethtool 网口名
  - **可以绑定临时IP然后使用远程登陆**
    - ifconfig 网口名称 ip地址/子网掩码 up（子网掩码例如：24，25）
    - 删除临时ip：ip addr del 10.200.153.142/25 dev SLOT3-1
  - **绑定网口配置文件**
    - cp 文件名 备份名（也可以放到别的路径）
    - **修改主管理平面网口**
      - cd /etc/sysconfig/network-scripts/
      - DEVICE=enp131s0
BOOTPROTO=none
ONBOOT=yes
MASTER=bondEth0
SLAVE=yes
USERCTL=no
NM_CONTROLLED=no
    - **修改备管理平面网口**
      - DEVICE=enp137s0
BOOTPROTO=none
ONBOOT=yes
MASTER=bondEth0
SLAVE=yes
USERCTL=no
NM_CONTROLLED=no
    - **添加存储管理地址**
      - cd /etc/sysconfig/network-scripts/
      - **vim bondEth0**
        - DEVICE=bondEth0
IPADDR=ip地址
NETMASK=网关
NETWORKING=yes
GATEWAY=子网掩码
DEFROUTE=yes
ONBOOT=yes
BOOTPROTO=static
USERCTL=no
TYPE=Bonding
MTU=1500
NM_CONTROLLED=no
BONDING_OPTS='mode=4 miimon=100 lacp_rate=fast
xmit_hash_policy=layer3+4'
    - 说明：以上是管理网口绑定流程，存储网口绑定流程也是一样，只不过多了要添加vlan这个文件，下面演示
    - **vlan**
      - IPADDR=IP地址
NETMASK=子网掩码
DEFROUTE=yes
BOOTPROTO=static
PHYSDEV=bondEth1
ONBOOT=yes
USERCTL=no
VLAN=yes
VID=vlan ID
NM_CONTROLLED=no
    - **推荐使用脚本配置**
      - #!/bin/bash


read -p "please input ip:" ip
read -p "please input mask:" mask
read -p "please input gw:" gw

#备份网卡
HOME='/etc/sysconfig/network-scripts'
cd $HOME
mv ifcfg-enahisic2i0 ifcfg-enahisic2i0.bak
mv ifcfg-enahisic2i1 ifcfg-enahisic2i1.bak

#设置管理网卡绑定--bond1

if [ ! -f ${HOME}/ifcfg-enahisic2i0 ]
then
cd $HOME
touch ifcfg-enahisic2i0
chmod 644 ifcfg-enahisic2i0
cat >>ifcfg-enahisic2i0<<EOF
DEVICE=enahisic2i0
BOOTPROTO=none
ONBOOT=yes
MASTER=bond1
SLAVE=yes
USERCTL=no
NM_CONTROLLED=no
EOF
fi

if [ ! -f ${HOME}/ifcfg-enahisic2i1 ]
then
cd $HOME
touch ifcfg-enahisic2i1
chmod 644 ifcfg-enahisic2i1
cat >>ifcfg-enahisic2i1<<EOF
DEVICE=enahisic2i1
BOOTPROTO=none
ONBOOT=yes
MASTER=bond1
SLAVE=yes
USERCTL=no
NM_CONTROLLED=no
EOF
fi

if [ ! -f ${HOME}/ifcfg-bond1 ]
then
cd $HOME
touch ifcfg-bond1
chmod 644 ifcfg-bond1
cat >>ifcfg-bond1<<EOF
DEVICE=bond1
ONBOOT=yes
BOOTPROTO=none
USERCTL=no
TYPE=Bonding
IPADDR=$ip
NETMASK=$mask
GATEWAY=$gw
DEFROUTE=yes
MTU=1500
NM_CONTROLLED=no
BONDING_OPTS='mode=4 miimon=100 lacp_rate=fast xmit_hash_policy=layer3+4'
EOF
fi


#重启网卡
service network restart
exit
      - 脚本已.sh后缀结尾
      - 配置临时IP地址：ifconfig eth0 192.168.2.100/24 up 配置哪个口就就将网线插入哪个网口
      - **使用远程工具连接然后给脚本权限**
        - 给文件夹权限：chown -R root:root 文件名称
给文件权限：chmod 777 laocheng-omc.sh
执行脚本：bash -x laocheng-omc.sh 
 cd /proc/net/bonding/  然后使用ls查看
      - 备注：以上脚本只是绑定管理ip，存储IP或者是前后端IP也可以通过以上脚本修改，不过要记得修改网口名称等
- **fusion storage 块存储安装（管理部署工具manager）**
  - **查看fusion storage 块存储安装指导书**
    - 创建控制集群需要注意的地方：元数据盘的类型是sata盘，一般是选择0盘作为元数据盘，选择几个看规划表
- **fusion storage块存储配置参数**
  - 创建存储池
  - **计算节点上创建VBS**
    - vbs里填写的账号密码是计算节点服务器的gandalf的
    - vbs添加存储ip时要添加一整个段
    - 配置文件只需要修改一台，
- **对接fusion computer**
  - 添加存储接口
  - 向站点添加存储资源
  - 添加数据存储

### fusion care安装配置
- 准备工作：在fusion computer任意的vrm管理节点上创建一台虚拟机，然后挂载挂载系统，选择本地硬盘方式，用欧拉或者cent os7操作系统安装，进行安装，然后安装tools工具
- 步骤1 创建普通帐号。
- **步骤2 执行如下命令添加用户组fusioncare。**
  - groupadd fusioncare
- **步骤3 执行如下命令添加用户fusioncare，并将其加入用户组fusioncare。**
  - useradd -g fusioncare fusioncare
- **步骤4 执行如下命令为fusioncare设置密码。**
  - passwd fusioncare
- **步骤5 以root帐户执行如下命令，新建一个“/opt/ServiceTool”目录。**
  - mkdir -p /opt/ServiceTool
- **步骤6 执行如下命令，赋予fusioncare帐户“/opt/ServiceTool”目录权限。**
  - chown fusioncare:fusioncare /opt/ServiceTool
- 步骤7 使用WinSCP工具，以fusioncare帐户，将FusionCare安装包FusionCare.tar.gz拷贝至新建的/opt/ServiceTool目录中。
- **步骤8 执行如下命令，切换到fusioncare帐户。**
  - su - fusioncare
- **步骤9 执行如下命令，进入“/opt/ServiceTool”目录下。**
  - TMOUT=0
  - cd /opt/ServiceTool
- **步骤10 在“/opt/ServiceTool”目录下，以fusioncare帐户，执行如下命令，解压FusionCare安装包。**
  - tar zxvf FusionCare.tar.gz
- 说明：执行完成后，在“/opt/ServiceTool”目录下将生成FusionCare文件夹。
- **步骤11 设置FusionCare绑定IP，进入FusionCare安装目录“/FusionCare/tomcat/conf”文件夹，打开server.xml文件，为Connector添加或修改address属性，值为要绑定的IP。以192.168.0.0为例，如下所示。**
- **步骤12 先创建ROOT文件夹**
  - mkdir ROOT
- **步骤13 执行如下命令，进入webapps目录，解压hct.war压缩包。**
  - cd /opt/ServiceTool/FusionCare/tomcat/webapps
  - unzip -o hct.war -d ROOT/
- **步骤14 以fusioncare帐户，执行如下命令，安装FusionCare工具。**
  - sh /opt/ServiceTool/FusionCare/install.sh
- **步骤14 安装完成后使用root账号登陆，然后关闭火防火墙**
  - systemctl stop firewalld.service&&systemctl disable firewalld.service
- **验证安装成功**
- 虚拟机不要重启，重启fusion care会掉线需要重新启动，启动先进入cd /opt/ServiceTool/ 再执行sh /opt/ServiceTool/FusionCare/hctd start
- **然后以我们之前配置的IP地址进入管理页面：https://IP地址:8803**
  - 具体操作步骤可查看FusionCare V100R005C00SPC611 用户指南 01
- **Web管理页面**
  - **系统管理**
    - 创建巡检单，添加IP地址（FC管理平面的浮动地址）
    - admin密码和root密码
  - **首页创建巡检单**
    - 巡检开始，结束，导出报告

### 虚拟化部署细节：
交换机配置先配置不带标签，不做聚合，做主备或者是能让静态ip网络通的配置
确定管理口，配置ip先配置静态管理ip（安装fc好后会在页面上进行绑定）
记得把密码配置成永久chage -M 9999 账号名

## 问题

### 注意：曙光服务器进入pxe模式需要进入bmc界面手动更改启动顺序、进入bmc需要tftp64软件，配置随机地址

### 系统解压tools工具时提示解压错误时解决方法，安装其中的三个文件，命令：rpm -ivh 安装包名
- bzip2-1.0.6-13.el7.x86_64.rpm
- bzip2-devel-1.0.6-13.el7.x86_64.rpm
- bzip2-libs-1.0.6-13.el7.x86_64.rpm
- zlib-1.2.7-17.el7.x86_64.rpm
- zlib-devel-1.2.7-17.el7.x86_64.rpm

### 安装tools提示已有进程占用解决方法

### 如何判断虚拟机是否已经安装VMTools
- **命令**
  - cat /etc/.vmtools/version.ini
  - ps -ef | grep vm-agent

### 华三服务器

### fc内置账号是gandalf、分布式存储内置账号fsadmin

### 验证tftp是否开启成功
- export configuration_data ip=192.168.11.30 user=HP password=jie db_file=conf01.dat protocol=FTP
- export running_data ip=192.168.11.30 user=HP password=jie running_data_file=conf02.txt port=21 protocol=FTP
- 备注 其中的IP是本机地址，user是本机名，password是本机密码

### 网卡重启失败问题
- 网卡重启失败提示存在错误代码，可能是其他网卡配置导致，可以把其他网卡配置作备份然后修改名字再重启网卡试下

### 创建vbs提示安装cloud组件失败问题
- vim /etc/ssh/sshd_config
- ssh配置文件把这条语句前面的#号去掉，然后重启#Subsystem sftp /usr/libexec/openssh/sftp-server -l INFO -f AUTH'
- 重启语句：service sshd restart

### 仲裁服务器添加不成功问题
- 有可能是浏览器存在兼容性问题，Google浏览器换至86版本以下，或是用火狐浏览器

### 双活开启ha策略问题
- 安装utravr软件，在里面添加fs，fc节点，创建保护组（存储侧双活pair不能手动创建，不然会导致保护组创建失败），在fc平面把集群ha和主机ha开启

### 存储侧提示计算节点丢包，网络延迟等问题
- fc平台管理存储平面把接口从ovs改为Linux的子接口

### 仲裁服务器网络配置命名规则
- 两个网络配置文件中的device名字不能一样

### 时钟源提示问题
- 解决是时钟源问题，把浮动IP替换成两个管理节点ip

### 主备或是聚合绑定有错误
- cd /opt/galax/root/vrm/tomcat/script/nrm/
sh bondNic.sh "bond0" "eth0 eth1" -m绑定
sh unbondNic.sh "bond0" -m 解绑
cat /proc/net/bonding/bond4

### 修改密码策略
- 更改密码策略
vim /etc/pam.d/system-auth
vim /etc/pam.d/password-auth-local 
remember=5 改为remember=0
修改完再改回来

### fc添加主机提示发送消息到主机失败

### 存储平面不需要配置网关，不需要配置vlan id（标签），fc上面创建分布式交换机后记得把主机的管理口也都加进去

### 存储版本查询
- cat /etc/dfv/product.ini

### fc版本查询
- cat /opt/galax/version/GalaxVersion.cfg

### fc更新时出现浮动ip与站点不一致是因为主或者备节点IP出现错误引起，fc更新时提示时钟源未配置导致升级前检查失败，可以忽略

### 主机名修改
- vim /etc/hostname

### 网卡名称错误问题
- 使用命令查询网卡名称为eth1，进入网卡配置文件查询到的文件名称为eth2，可以cd /etc/udev/rules.d/70-persistent-net.rules/配置文件
- 删除70-persist配置文件然后重启虚机

### 资源统计计算方法
- Cpu=所有虚拟机实际分配的cpu大小总和/所有主机逻辑CPU总和
内分配率=所有虚拟机实际分配的内存大小总和/所有主机内存总和
磁盘分配率=所有虚拟机实际分配的磁盘大小总和/存储总容量

### 判断机器是exp类型还是直通型
- 查看是否含有RAID卡，若含有RAID卡则为EXP机型，否则为直通机型

### 配置路由
- 在Linux系统中，需要互通的设备但是存在不同的网段，则需要在系统层配置明细路由
- **举例：KVM项目中存储平面计算节点的和存储节点的存储平面不在同一个网段上，则需要配置明细路由，计算节点采用10.0.7.X段的地址，掩码是24位的，存储节点采用10.0.11.X段的地址，掩码是24位的。**
  - **计算节点配置路由**
    - **方法二**
      - 如果/etc/sysconfig/路径下存在这个static-route文件，也可以直接在这个配置文件下直接配置路由
      - **举例：系统给ip是10.0.7.0段，现在需要添加10.0.11.0段的ip以能够互通，10.0.7.48是10.0.7.X段的网关**
        - any net 10.0.11.0/24 via 10.0.7.48
    - **方法一**
      - **在/etc/sysconfig/network-sripts/route-eth0**
        - 说明，如果/etc/sysconfig/路径下存在这个static-route文件，也可以直接在这个配置文件下直接配置路由
        - 添加路由10.0.7.0/24 via 10.0.7.48 dev eth0
    - **重启网卡**
      - service network restart
  - 存储节点配置路由如计算节点侧配置即可

### 彻底删除网卡绑定成bond后删除不干净的方法
- 客户现场Linux操作系统需要删除bond配置，在down掉bond网口，删除/etc/sysconfig/network-scripts/ifcfg-bond4后，继续删除/proc/net/bonding/bond4文件，提示没有权限。

其实删除bond网络设备只需要执行如下命令即可。

举例：删除bond4

echo -bond4 >/sys/class/net/bonding_masters

### Fusioncompute对接块存储提示存储存在错误或异常，这是证书不一致导致的，vrm和fs管理节点的证书md5值不一致而对接失败，可以查看fusioncompute指导书更换证书

### 案例2：存储升级部署自服务传包时提示内存内存不足报错
- 登录管理节点执行numactl -H 查看是否有node free内存少于3G，少于3G则会提示内存不足，
可以评估看内存是否足够传包，如果足够传包，则可以规避
分别登录到主备管理节点切换到root
依次执行以下两条命令：
line=$(grep -n 'Start check numa memory' /opt/fusionstorage/deploymanager/clouda/script/agent_handle_inner.sh);
sed -i "${line}a\return 0" /opt/fusionstorage/deploymanager/clouda/script/agent_handle_inner.sh
规避后重新执行传包或者热补丁自升级

### 案例3：升级存储时升级到一半时界面上总进度显示暂停
- 登录失败的节点，查看omm_c升级部署日志
cat /var/log/oam/oam-u/omm_c/script/omm_c.deploy.script.log | grep "omm_cuninstall for upgrade failed"
cat /var/log/dfv/dfv_info/dfv-ssh.log | grep "coonfig allowuser failed"
这里有问题会有回显报错，则执行下面的操作
查看sshd_config配置文件是否配置了AllowUser或者AllowGroups
有回显则说明是受这两个影响，需要先注释掉，然后重启sshd服务再重试

### 案例1：在界面上不能一键同步证书，在升级工具中不能提交工程
- 查看日志：
需要手动执行提交工程命令：python /opt/galax/patch/FusionCompute/FusionCompute_8.2.0.SPC6_CNA_Aarch_Upgrade/patchfile/bin/upgradecmd.py -c /opt/galax/patch/FusionCompute/STATE_V100R005C00_8.2.0.SPC6.xml
然后查看包是否有没有被清除：ll /opt/galax/patch/FusionCompute/

### 案例3：升级过程中，刷新DM界面或重启主管理节点ssh服务导致DM界面登录不上
- 登录到主管理节点，找到基础服务软件包，进入action目录，执行upgrade.sh脚本，执行完毕后再重新登录即可

## 4A账号申请流程

### 找客户拿模板申请账号

### 在系统添加申请的账号
- 4a账户系统底层创建步骤：useradd 账户
passwd 账户
账户密码
cp /etc/ssh/sshd_config sshd_config.bak
vim /etc/ssh/sshd_config
账户
service sshd restart
usermod -G wheel 账户

## 抓包命令

### tcpdump -i any src 10.197.11.246 and dst 10.197.10.206 -vvv -n（本机地址到服务器地址）

## 全闪存储学习

### 4U控制框后端可划分为A、B、C、D共4个象限

### 硬盘框级联方案
- **智能硬盘框**
  - 4U控制框级联3个2U智能硬盘框（非内双活组网）
- **SAS硬盘框**
  - **例子**
    - 4U控制框级联3个2U SAS硬盘框（正向冗余连接）
    - 4U控制框级联3个2U SAS硬盘框（正反向冗余连接）

### 控制框至应用服务器连接方案
- **组网方式**
  - iSCSI组网、NVMe over RoCE组网和FC组网

### 何如避免单点故网络故障问题
- 为保证组网的可靠性，级联时，采用冗余连接的方式，使同一级联环路中的硬盘框应形成两个相互独立、互为冗余的链路。图3，图4，图5和图6的级联环路中，橙色和蓝色线缆分别代表两个相互独立、互为冗余的链路。任意一个控制器故障都不会导致所有环路失效。

### 华为 OceanStor Dorado 全闪存系列支持的 RAID 类型有几种?
- RAID5,RAID6,RAID-TP

### 存储基础业务配置流程
- **LUN组和主机组创建的用法**
  - 举例：一个客户用到多个LUN，可以把属于同一个客户的LUN的加到LUN组，即主机也是一样的做法

### 关于Ultrapart安装完成后后面的做法
- **配置主机与存储系统的连通性的准备**
  - **在主机上查询HBA上相应端口的WWN**
  - **查询HBA属性**
    - **如何查看Qlogic和Emulex厂商的HBA卡属性**
- **配置主机与存储系统的连通性**
  - 首先要确定好使用什么协议连接
  - **建立FC连接**
    - **主机上查询WWN号**
      - cat /sys/class/fc_host/host*/port_name
    - **配置存储系统**
      - 完成交换机上Zone的配置后，登录存储DeviceManager，在主机界面选择要添加启动器的主机，点击右侧的，并选择增加启动器。
      - 观察能否发现对应主机的启动器。
      - 勾选启动器，点击将启动器分配给主机
  - **建立iSCSI连接**
    - 配置主机IP
    - **检查并安装iSCSI软件包**
      - 使用rpm -qa |grep iscsi查询是否安装了启动器软件包。
    - **主机启动器配置（使用iscsiadm）**
    - **配置存储系统**
      - 配置存储端口IP
      - **为以太端口配置IP的操作步骤举例如下**
        - 在系统菜单中选择硬件，进入设备硬件界面。
        - 选中设备，点击查看设备后视图。
        - 选择要配置ip的以太端口，点击修改。
        - 在弹出的界面编辑端口的名称、ip、子网掩码信息
      - **为主机添加启动器**
        - 登录存储系统DeviceManager。在主机界面选择要添加启动器的主机，点击右侧的，并选择增加启动器。
        - 观察能否发现对应主机的启动器。
        - 勾选启动器，点击将启动器分配给主机。
  - **主机系统扫描LUN**
    - **针对FC连接，采用下述方法进行扫Lun：**
      - **进入/sys/class/fc_host目录，查看HBA端口对应的设备符**

### 上述步骤完成后，在主机上使用命令查询到新的卷（上述已经映射到主机的），
- **备注：如何确定一个盘没有挂载**
- **使用n命令新建分区**
- **使用w命令将分区数据写入磁盘**
- **使用mkfs命令创建文件系统**
  - **挂载文件系统**

## 裸金属镜像制作

### 获取系统链接、驱动链接、raid卡驱动链接

### 安装qemu、下载替换UEFI（BIOS的替代方案）的文件
- https://qemu.weilnetz.de/w64/2021/qemu-w64-setup-20210505.exe
- http://releases.linaro.org/components/kernel/uefi-linaro/16.02/release/qemu64/QEMU_EFI.fd
- **安装qemu**
  - 在D:\vm\arm64目录下新建文件夹qemu，将qemu安装到D:\vm\arm64\qemu目录下；
  - **安装好之后，利用qemu生成一个硬盘文件：**
    - 进入qemu目录下运行cmd命令，调出命令行界面，运行命令：
    - **qemu-img create -f qcow2 D:\vm\arm64\kylindisk.qcow2 40G**
      - 创建的大小为40G
    - 最终得到一个命名为kylindisk.qcow2的磁盘文件，以后我们利用此文件进行安装虚拟机；

### 安装虚拟机
- 进入到qemu目录，使用cmd命令调出命令行界面，执行以下命令：
- **qemu-system-aarch64.exe -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\vm\arm64\QEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\vm\arm64\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=D:\vm\arm64\Kylin-Server-10-SP2-aarch64-Release-Build09-20210524.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom  -net nic -net user,hostfwd=tcp::2222-:22**
  - 内存是8192，CPU是4核2线程，路径是D:\vm\arm64\QEMU_EFI.fd。file=D:\vm\arm64\kylindisk.qcow2
引用的系统文件：file=D:\vm\arm64\Kylin-Server-10-SP2-aarch64-Release-Build09-20210524.iso
- note：命令中的路径要与文件目录对应上，否则可能会报错
- **之后在自动弹出的QEMU虚拟机中安装系统：**

### 启动虚拟机
- 安装好后，我们需要再次启动（无需指定iso文件启动）;
进入到qemu所在目录，使用cmd命令行，执行以下命令：
- qemu-system-aarch64.exe -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\vm\arm64\QEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\vm\arm64\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net user,hostfwd=tcp::2222-:22

### 安装驱动
- 通过挂载ISO的形式把要安装的驱动固件软件都打包好，使用UltraISO工具进行打包，打包的内容包括snmp包以及snmp的配置文件，raid卡的驱动固件、系统的驱动、agent客户端的安装包
- **命令**
  - qemu-system-aarch64.exe -m 8192 -cpu cortex-a72 -smp 8,sockets=4,cores=2 -M virt -bios D:\vm\arm64\QEMU_EFI.fd -device VGA -device nec-usb-xhci -device usb-mouse -device usb-kbd -drive if=none,file=D:\vm\arm64\kylindisk.qcow2,id=hd0 -device virtio-blk-device,drive=hd0 -drive if=none,file=D:\vm\arm64\snmp_conf.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -net nic -net user,hostfwd=tcp::2222-:22
  - **备注**
    - **挂载的路径以及文件**
      - file=D:\vm\arm64\snmp_conf.iso

### 安装agent
- **查看相关指导书**
  - FusionSphere SIA 8.2.0.3 裸金属服务器镜像制作指导书 03

### 安装snmp
- 登陆操作系统，进入/etc/snmp/ 目录下，执行
mv /etc/snmp/snmpd.conf /etc/snmp/snmpd.conf.bk
- 然后检查/etc/snmp下的snmpd.conf配置文件是否已被修改为snmpd.conf.bk
- **然后将pass文件夹里面的配置文件替换系统里面原来有的**
  - 将挂载的pass文件替换到/etc/snmp
- **重启snmp服务**
  - 执行systemctl restart snmpd.service
  - 执行完成后，通过执行systemctl status snmpd.service 检查服务启动情况

## 扩容

### tftp开启验证方法
- **连接交换机**
  - export configuration_data ip=192.168.11.86 user=HP password=*** db_file=conf01.dat protocol=FTP
  - export configuration_data ip=本机配置的地址 user=电脑用户名 password=电脑密码 db_file=conf01.dat protocol=FTP

## 日常使用的命令

### 修改密码命令：
- echo '新密码' | passwd --stdin 账号

### 查询wwm号
- cat /sys/class/fc_host/host*/port_name

### 1、sed 使用 s 命令来进行文本替换操作
- **sed 's/srcStr/dstStr/' file**
  - 其中，srcStr 为想要替换的文本，dstStr 为将要替换成的文本。使用 s 命令时，sed 编辑器会在一
行一行地读取文件 file，并在每行查找文本 srcStr，如果找到了，则将该处的 srcStr 替换为
dstStr。
- **将第3行中所有的 5 替 换成 6**
  - sed '27 s/5/6/g' /etc/login.defs

### sed 命令删除行
- **sed '3d' /etc/passwd**
  - 指定删除第三行

### ethtool -p 端口名称

### 开启端口
- ifconfig eth0 up

### 赋予账号永久权限
- chage -M 9999 账号名

### 网卡重启
- service network restart

### 磁盘挂载查看
- fdisk -l

### 普通账号如何增加ssh权限
- 4a账户系统底层创建步骤：useradd 账户
passwd 账户
账户密码
cp /etc/ssh/sshd_config sshd_config.bak
vim /etc/ssh/sshd_config
账户
service sshd restart
usermod -G wheel 账户

### 清除外raid卡部配置文件
- **安装MegaCli和storcli软件**
  - rpm -ivh 软件包名
- **配置变量环境**
  - ln -s /opt/MegaRAID/storcli/storcli64 /usr/bin/storcli64
- **执行命令扫描raid卡上的Foreign信息**
  - 说明：以下两条命令其中任一条都可以
  - /opt/MegaRAID/MegaCli/MegaCli64 -CfgForeign -Scan -a0
  - /opt/MegaRAID/storcli/storcli64 /c0/fall show  或者是storcli64 /c0/fall  show
- **执行如下命令清除 RIAD 上的 Foreign 信息。**
  - 说明：以下两条命令其中任一条都可以
  - /opt/MegaRAID/storcli/storcli64 /c0/fall del  或者是storcli64 /c0/fall del
  - /opt/MegaRAID/MegaCli/MegaCli64 -CfgForeign -Clear
- **查看是否已清除外部配置**
  - 执行如下命令查看 RIAD 上的 Foreign 信息是否被清除，Foreign State 信息均为none”时表示已全部清除。

### 版本查询命令
- **fusioncomputer版本查询**
  - cat /opt/galax/version/GalaxVersion.cfg

### 修改系统时间
- 举例：date -s "2023-2-21 17:34"

### 查询系统内存储漏洞的命令
- **rpm -qa --changelog | grep +加漏洞名称**
  - rpm -qa --changelog | grep CVE-2020-14145

### 配置和删除临时网关
- **增加**
  - route add default gw 10.200.153.254
- **删除**
  - route del default gw 10.200.153.254

### 版本查询
- cat /opt/huawei/deploy/package/version

### ssh命令
- ssh 账号@ip 举例：ssh gandalf@10.200.214.86

### 关闭历史命令
- **vim /etc/profile**
  - HISTSIZE=1000

### 查询wwm号
- cat /sys/class/fc_host/host*/port_name  （验证wwm号方法，一个IP地址对应两个wwm，一台主机中 查询出来有两个wwm号就好 然后做记录，发邮件）

## 性能可靠性等测试

### 安装jdk插件，安装vdbench，进入vdbench文件夹使用./vdbench -t 测试安装是否成功

## 存储挂载到系统（划分lun挂载到服务器上面，本记录是光纤交换机链路挂载方法）

### 首先查看进入主机查看wwn号，cat /sys/class/fc host/host*/port name

### 注：创建lun，然后把lun加到lun组（多个lun要加到一个组里面），创建主机然后把主机加到主机组（多个主机要加到一个组里面）

### fc类型，网络是8，16，32光纤
在主机上面查询wwn号（cat /sys/class/fc host/host*/port name），然后查询存储上上面端口的wwn号，记录下来，发给交换机的人，让他们在交换机上面划zone，好了之后安装多路径软件（可以借鉴OceanStor UltraPath for Linux 31.0.1 用户指南），安装方式选择boot from Local方式安装，安装好了之后扫盘（登录进去Utratpart软件（登录命令：upadmin）里面扫描，命令是show vlan或者是show vlan type=all），然后分区挂载

### 具体挂载方法可以查询文档：华为SAN存储在Red Hat系统下的主机连通性指南

### 如果是走ip（也就是iSCSI链路）具体可查看文档

## 文件存储

### 对接测试
- **对接虚拟机测试要求**
  - **不同的vlan之间要互通需要在交换机上配置路由，配置完成后主机上ping网络，如果默认路由不通则需要在系统上配置路由**
    - **主机上配置路由方法
通过cls登录admin，使用普通账户切换
cli_start -u admin，然后输入密码
配置命令create route config <dest_ip> <network_type> [prefer]**
      - 举例：admin:/>create route config 192.168.100.10/16 Management 1777
      - **删除路由**
        - delete route config <dest_ip>

> AI生成
