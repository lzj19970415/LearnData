# 虚拟专用网络-VPN

## 一、VPN基础介绍

### 1、VPN概念

Virtual Private Network，即虚拟专用网络，简称VPN，VPN是在互联网上建立专用网络，为了保证数据安全，VPN服务器和客户机之间数据通信都进行了加密处理，有了数据加密就可以认为数据是在一条安全链路上进行安全传输，如同架构了一个专用网络一样，但实际上VPN使用的依然是互联网上的公用链路，因此VPN称为虚拟专用网络，其实质上就是利用数据加密技术在公网上封装出一个数据通信遂道，VPN高密性与便捷性使其在企业中有非常方法的应用。vpn技术实质是vpn网关通过对数据包的加密和数据包目标地址的转换实现远程访问。

VPN属于远程访问技术，简单地说就是利用公用网络架设专用网络。

例如：某公司员工出差到外地，他想访问企业内网的服务器资源，这种访问就属于远程访问。在传统的企业网络配置中，要进行远程访问，传统的方法是租用DDN（数字数据网）专线或帧中继，这样的通讯方案必然导致高昂的网络通讯和维护费用。对于移动用户（移动办公人员）与远端个人用户而言，一般会通过拨号线路（Internet）进入企业的局域网，但这样必然带来安全上的隐患。
	   让外地员工访问到内网资源，利用VPN的解决方法就是在内网中架设一台VPN服务器。外地员工在当地连上互联网后，通过互联网连接VPN服务器，然后通过VPN服务器进入企业内网。为了保证数据安全，VPN服务器和客户机之间的通讯数据都进行了加密处理。有了数据加密，就可以认为数据是在一条专用的数据链路上进行安全传输，就如同专门架设了一个专用网络一样，但实际上VPN使用的是互联网上的公用链路，因此VPN称为虚拟专用网络，其实质上就是利用加密技术在公网上封装出一个数据通讯隧道。有了VPN技术，用户无论是在外地出差还是在家中办公，只要能上互联网就能利用VPN访问内网资源，这就是VPN在企业中应用得如此广泛的原因。

### 2、VPN作用

1)、在互联网通信链路上封装数据，对数据进行加密传输

2)、可对数据包目标地址转换实现远程访问

### 3、VPN实现方法

1. 通常情况下，VPN网关采取双网卡结构，外网卡使用公网IP接入Internet。

2. 网络一(假定为公网internet)的终端A访问网络二(假定为公司内网)的终端B，其发出的访问数据包的目标地址为终端B的内部IP地址。

3. 网络一的VPN网关在接收到终端A发出的访问数据包时对其目标地址进行检查，如果目标地址属于网络二的地址，则将该数据包进行封装，封装的方式根据所采用的VPN技术不同而不同，同时VPN网关会构造一个新VPN数据包，并将封装后的原数据包作为VPN数据包的负载，VPN数据包的目标地址为网络二的VPN网关的外部地址。

4. 网络一的VPN网关将VPN数据包发送到Internet，由于VPN数据包的目标地址是网络二的VPN网关的外部地址，所以该数据包将被Internet中的路由正确地发送到网络二的VPN网关。

5. 网络二的VPN网关对接收到的数据包进行检查，如果发现该数据包是从网络一的VPN网关发出的，即可判定该数据包为VPN数据包，并对该数据包进行解包处理。解包的过程主要是先将VPN数据包的包头剥离，再将数据包反向处理还原成原始的数据包。

6. 网络二的VPN网关将还原后的原始数据包发送至目标终端B，由于原始数据包的目标地址是终端B的IP，所以该数据包能够被正确地发送到终端B。在终端B看来，它收到的数据包就和从终端A直接发过来的一样。

7. 从终端B返回终端A的数据包处理过程和上述过程一样，这样两个网络内的终端就可以相互通讯了。

   

   通过上述说明可以发现，在VPN网关对数据包进行处理时，有两个参数对于VPN通讯十分重要：原始数据包的目标地址（VPN目标地址）和远程VPN网关地址。根据VPN目标地址，VPN网关能够判断对哪些数据包进行VPN处理，对于不需要处理的数据包通常情况下可直接转发到上级路由；远程VPN网关地址则指定了处理后的VPN数据包发送的目标地址，即VPN隧道的另一端VPN网关地址。由于网络通讯是双向的，在进行VPN通讯时，隧道两端的VPN网关都必须知道VPN目标地址和与此对应的远端VPN网关地址。


### 4、VPN分类

#### 4.1、按VPN协议分

VPN的隧道协议主要有PPTP、L2TP、IPSec、SSLVPN，其中PPTP和L2TP协议工作在OSI模型的第二层，又称为二层隧道协议；IPSec是第三层隧道协议。

#### 4.2、按VPN应用分

- Access VPN（远程接入VPN）：客户端到网关，使用公网作为骨干网在设备之间传输VPN数据流
- Intranet VPN（内联网VPN）：网关到网关，通过公司的网络架构连接来自同公司的资源
- Extranet VPN（外联网VPN）：与合作伙伴企业网构成Extranet，将一个公司与另一个公司的资源进行连接

#### 4.3、按所用设备类型分

- 路由器式VPN：路由器上添加VPN服务
- 交换机式VPN：交换机上添加VPN服务
- 防火墙式VPN：硬件防火墙或软件防火墙上添加VPN服务，常见的一种

#### 4.4、按实现原理

- 对等VPN 网络运营商提供
- 覆盖VPN 企业借住于网络运营商网络实现企业VPN



### 5、VPN协议

#### 5.1、PPTP

点对点隧道协议 (PPTP) 是由包括微软和3Com等公司组成的PPTP论坛开发的一种点对点隧道协，基于拨号使用的PPP协议使用PAP或CHAP之类的加密算法，或者使用Microsoft的点对点加密算法MPPE。其通过跨越基于 TCP/IP 的数据网络创建 VPN 实现了从远程客户端到专用企业服务器之间数据的安全传输。PPTP 支持通过公共网络(例如 Internet)建立按需的、多协议的、虚拟专用网络。PPTP 允许加密 IP 通讯，然后在要跨越公司 IP 网络或公共 IP 网络(如 Internet)发送的 IP 头中对其进行封装。




#### 5.2、L2TP

第 2 层隧道协议 (L2TP) 是IETF基于L2F (Cisco的第二层转发协议)开发的PPTP的后续版本。是一种工业标准 Internet 隧道协议，其可以为跨越面向数据包的媒体发送点到点协议 (PPP) 框架提供封装。PPTP和L2TP都使用PPP协议对数据进行封装，然后添加附加包头用于数据在互联网络上的传输。PPTP只能在两端点间建立单一隧道。 L2TP支持在两端点间使用多隧道，用户可以针对不同的服务质量创建不同的隧道。L2TP可以提供隧道验证，而PPTP则不支持隧道验证。但是当L2TP 或PPTP与IPSEC共同使用时，可以由IPSEC提供隧道验证，不需要在第2层协议上验证隧道使用L2TP。 PPTP要求互联网络为IP网络。L2TP只要求隧道媒介提供面向数据包的点对点的连接，L2TP可以在IP(使用UDP)，桢中继永久虚拟电路 (PVCs),X.25虚拟电路(VCs)或ATM VCs网络上使用。








#### 5.3、IPSec

IPSec 的隧道是封装、路由与解封装的整个过程。隧道将原始数据包隐藏(或封装)在新的数据包内部。该新的数据包可能会有新的寻址与路由信息，从而使其能够通过网络传输。隧道与数据保密性结合使用时，在网络上窃听通讯的人将无法获取原始数据包数据(以及原始的源和目标)。封装的数据包到达目的地后，会删除封装，原始数据包头用于将数据包路由到最终目的地。

隧道本身是封装数据经过的逻辑数据路径，对原始的源和目的端，隧道是不可见的，而只能看到网络路径中的点对点连接。连接双方并不关心隧道起点和终点之间的任何路由器、交换机、代理服务器或其他安全网关。将隧道和数据保密性结合使用时，可用于提供VPN。

封装的数据包在网络中的隧道内部传输。在此示例中，该网络是 Internet。网关可以是外部 Internet 与专用网络间的周界网关。周界网关可以是路由器、防火墙、代理服务器或其他安全网关。另外，在专用网络内部可使用两个网关来保护网络中不信任的通讯。

当以隧道模式使用 IPSec 时，其只为 IP 通讯提供封装。使用 IPSec 隧道模式主要是为了与其他不支持 IPSec 上的 L2TP 或 PPTP VPN 隧道技术的路由器、网关或终端系统之间的相互操作。


#### 5.5、SSLVPN

SSL协议提供了数据私密性、端点验证、信息完整性等特性。SSL协议由许多子协议组成，其中两个主要的子协议是握手协议和记录协议。握手协议允许服务器 和客户端在应用协议传输第一个数据字节以前，彼此确认，协商一种加密算法和密码钥匙。在数据传输期间，记录协议利用握手协议生成的密钥加密和解密后来交换 的数据。

SSL独立于应用，因此任何一个应用程序都可以享受它的安全性而不必理会执行细节。SSL置身于网络结构体系的传输层和应用层之间。此外，SSL本身就被几乎所有的Web浏览器支持。这意味着客户端不需要为了支持SSL连接安装额外的软件。这两个特征就是SSL能 应用于VPN的关键点。








典型的SSL VPN应用如OpenVPN，是一个比较好的开源软件。PPTP主要为那些经常外出移动或家庭办公的用户考虑；而OpenVPN主要是针对企业异地两地总分公司之间的VPN不间断按需连接，例如ERP在企业中的应用。

## 二、OpenVPN 介绍

OpenVPN 允许参与建立VPN的单点使用预设的私钥，第三方证书，或者用户名/密码来进行身份验证。它大量使用了OpenSSL加密库，以及SSLv3/TLSv1 协议。OpenVPN能在Linux、xBSD、Mac OS X与Windows 2008上运行。它并不是一个基于Web的VPN软件，也不与IPsec及其他VPN软件包兼容。

1、隧道加密
OpenVPN使用OpenSSL库加密数据与控制信息：它使用了OpesSSL的加密以及验证功能，意味着，它能够使用任何OpenSSL支持的算法。它提供了可选的数据包HMAC功能以提高连接的安全性。此外，OpenSSL的硬件加速也能提高它的性能。

2、验证
OpenVPN提供了多种身份验证方式，用以确认参与连接双方的身份，包括：预享私钥，第三方证书以及用户名/密码组合。预享密钥最为简单，但同时它 只能用于建立点对点的VPN;基于PKI的第三方证书提供了最完善的功能，但是需要额外的精力去维护一个PKI证书体系。OpenVPN2.0后引入了用 户名/口令组合的身份验证方式，它可以省略客户端证书，但是仍有一份服务器证书需要被用作加密.

3、网络
OpenVPN所有的通信都基于一个单一的IP端口，默认且推荐使用UDP协议通讯，同时TCP也被支持。OpenVPN连接能通过大多数的代理服务 器，并且能够在NAT的环境中很好地工作。服务端具有向客户端“推送”某些网络配置信息的功能，这些信息包括：IP地址、路由设置等。OpenVPN提供 了两种虚拟网络接口：通用Tun/Tap驱动，通过它们，可以建立三层IP隧道，或者虚拟二层以太网，后者可以传送任何类型的二层以太网络数据。传送的数 据可通过LZO算法压缩。IANA(Internet Assigned Numbers Authority)指定给OpenVPN的官方端口为1194。OpenVPN 2.0以后版本每个进程可以同时管理数个并发的隧道。

OpenVPN使用通用网络协议(TCP与UDP)的特点使它成为IPsec等协议的理想替代，尤其是在ISP(Internet service provider)过滤某些特定VPN协议的情况下。在选择协议时候，需要注意2个加密隧道之间的网络状况，如有高延迟或者丢包较多的情况下，请选择 TCP协议作为底层协议，UDP协议由于存在无连接和重传机制，导致要隧道上层的协议进行重传，效率非常低下。

4、安全
OpenVPN与生俱来便具备了许多安全特性：它在用户空间运行，无须对内核及网络协议栈作修改; 初始完毕后以chroot方式运行，放弃root权限;使用mlockall以防止敏感数据交换到磁盘。

## 三、VPN案例

#### 1、实验拓扑



#### 2、配置

##### 2.1、内网web服务器配置

1）下载httpd服务，用于验证

~~~shell
[root@web ~]# yum -y install httpd
[root@web ~]# echo "internal test" >> /var/www/html/index.html
[root@web ~]# systemctl enable httpd;systemctl start httpd
~~~

2)修改IP地址

~~~shell

[root@web ~]# cat /etc/sysconfig/network-scripts/ifcfg-ens33
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=ens33
UUID=486d5c6d-17ed-4a3f-baab-92d56d042796
DEVICE=ens33
ONBOOT=yes
IPADDR=192.168.1.2
PREFIX=24
GATEWAY=192.168.1.1
~~~

##### 2.2、VPN网关服务器配置

1）下载应用

```shell
#安装额外源
[root@vpnserver ~]# yum -y install epel-release
```

```shell
#OpenVPN Server Install
[root@vpnserver ~]# yum -y install openvpn easy-rsa
#openvpn用于实现vpn
#easy-rsa用于生成证书
```

2）配置网卡

~~~shell
网卡一：
[root@vpnserver ~]# cat /etc/sysconfig/network-scripts/ifcfg-ens33
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=ens33
UUID=4ac0aefc-628f-4461-ab59-636aae59965f
DEVICE=ens33
ONBOOT=yes
IPADDR=192.168.1.1
PREFIX=24

网卡二：
[root@vpnserver ~]# cat /etc/sysconfig/network-scripts/ifcfg-ens37
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=ens37
DEVICE=ens37
ONBOOT=yes
IPADDR=1.1.1.1
PREFIX=24
~~~

3)、配置证书密钥信息

~~~shell
[root@vpnserver openvpn]#pwd
/etc/openvpn

#生成密钥
[root@vpnserver openvpn]# cp -r /usr/share/easy-rsa/3.0.7/ /etc/openvpn/easy-rsa
[root@vpnserver openvpn]# cp /usr/share/doc/easy-rsa-3.0.7/vars.example /etc/openvpn/easy-rsa/vars         #vars用于生成证书的配置文件
#修改用于生成证书的配置文件vars，此为修改后
[root@vpnserver easy-rsa]# grep ^set /etc/openvpn/easy-rsa/vars
#84-89 line
set_var EASYRSA_REQ_COUNTRY     "CN"  #国家
set_var EASYRSA_REQ_PROVINCE    "Beijing" #省
set_var EASYRSA_REQ_CITY        "Beijing" #市
set_var EASYRSA_REQ_ORG "aiops" #公司
set_var EASYRSA_REQ_EMAIL       "smartgo@aiops.net.cn" #邮箱
set_var EASYRSA_REQ_OU          "IT" #部门


#创建PKI公钥认证体系基础设施
初始化pki
[root@vpnserver easy-rsa]# ./easyrsa init-pki

Note: using Easy-RSA configuration from: ./vars

init-pki complete; you may now create a CA or requests.
Your newly created PKI dir is: /etc/openvpn/easy-rsa/pki #生成此文件夹


#生成CA证书
[root@vpnserver easy-rsa]# ./easyrsa build-ca

Note: using Easy-RSA configuration from: ./vars
Generating a 2048 bit RSA private key
...........+++
.............................................................+++
writing new private key to '/etc/openvpn/easy-rsa/pki/private/ca.key.Yp03HcUCDB'
Enter PEM pass phrase: #输入密码
Verifying - Enter PEM pass phrase: #输入与上述相同的密码
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Common Name (eg: your user, host, or server name) [Easy-RSA CA]:#定义CA证书名称，默认即可，直接回车

CA creation complete and you may now import and sign cert requests.
Your new CA certificate file for publishing is at:
/etc/openvpn/easy-rsa/pki/ca.crt #这就是CA证书

[root@vpnserevr easy-rsa]# ls pki #查看pki目录
ca.crt  certs_by_serial  index.txt  issued  private  reqs  serial

~~~



4）制作VPN网关服务器证书请求文件，证书签发

~~~shell
#制作服务器证书请求文件、证书签发


#生成请求文件(req)，生成私钥
[root@vpnserver easy-rsa]# ./easyrsa gen-req server nopass

Note: using Easy-RSA configuration from: ./vars
Generating a 2048 bit RSA private key
........................+++
..................................+++
writing new private key to '/etc/openvpn/easy-rsa/pki/private/server.key.UnXtU2DdPN'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Common Name (eg: your user, host, or server name) [server]: #回车，确定通用名

Keypair and certificate request completed. Your files are:
req: /etc/openvpn/easy-rsa/pki/reqs/server.req
key: /etc/openvpn/easy-rsa/pki/private/server.key


#生成证书
[root@vpnserver easy-rsa]# ./easyrsa sign server server
#第一个server不能变，就是server,是命令
#第二个server是通用名

Note: using Easy-RSA configuration from: ./vars


You are about to sign the following certificate.
Please check over the details shown below for accuracy. Note that this request
has not been cryptographically verified. Please be sure it came from a trusted
source or that you have verified the request checksum with the sender.

Request subject, to be signed as a server certificate for 3650 days:

subject=
    commonName                = server


Type the word 'yes' to continue, or any other input to abort.
  Confirm request details: yes #输入yes
Using configuration from ./openssl-1.0.cnf
Enter pass phrase for /etc/openvpn/easy-rsa/pki/private/ca.key:
Check that the request matches the signature
Signature ok
The Subject's Distinguished Name is as follows
commonName            :ASN.1 12:'server'
Certificate is to be certified until Feb 20 23:28:42 2029 GMT (3650 days)

Write out database with 1 new entries
Data Base Updated

Certificate created at: /etc/openvpn/easy-rsa/pki/issued/server.crt #证书已生成



#制作dh证书，用于密钥协商，能够确保key穿越不安全网络   称为：迪菲赫尔曼密钥交换协议
[root@vpnserver easy-rsa]# ./easyrsa gen-dh

Note: using Easy-RSA configuration from: ./vars
Generating DH parameters, 2048 bit long safe prime, generator 2
This is going to take a long time
....................................................................................................................................................................................................................................................................................................................................................................+...........................................
DH parameters of size 2048 created at /etc/openvpn/easy-rsa/pki/dh.pem #生成了文件



#制作ta证书，可以不需要创建，但需要注释server.conf中tls-auth ta.key 0
[root@localhost easy-rsa]# openvpn --genkey --secret /etc/openvpn/easy-rsa/ta.key
[root@localhost easy-rsa]# ls
easyrsa  openssl-1.0.cnf  pki  ta.key  vars  x509-types
~~~

5)制作客户端证书

~~~shell
#制作客户端证书
[root@vpnserver openvpn]# pwd #确认工作目录
/etc/openvpn
[root@vpnserver openvpn]# ls #确认当前目录下的子目录及文件
client  easy-rsa  server  server.conf

[root@vpnserver openvpn]# cp -r /usr/share/easy-rsa/3.0.3/ /etc/openvpn/client/

[root@vpnserver openvpn]# cp /usr/share/doc/easy-rsa-3.0.3/vars.example /etc/openvpn/client/3.0.3/vars

[root@vpnserver 3.0.3]# pwd

/etc/openvpn/client/3.0.3

[root@vpnserver 3.0.3]# grep ^set vars
#84-89
set_var EASYRSA_REQ_COUNTRY     "CN"
set_var EASYRSA_REQ_PROVINCE    "Beijing"
set_var EASYRSA_REQ_CITY        "Beijing"
set_var EASYRSA_REQ_ORG "aiops"
set_var EASYRSA_REQ_EMAIL       "tom@aiops.net.cn"
set_var EASYRSA_REQ_OU          "IT"

[root@vpnserver 3.0.3]# ./easyrsa init-pki

Note: using Easy-RSA configuration from: ./vars

init-pki complete; you may now create a CA or requests.
Your newly created PKI dir is: /etc/openvpn/client/3.0.3/pki

[root@vpnserver 3.0.3]# ./easyrsa gen-req client nopass

Note: using Easy-RSA configuration from: ./vars
Generating a 2048 bit RSA private key
......................................................................+++
...........................+++
writing new private key to '/etc/openvpn/client/3.0.3/pki/private/client.key.cxDpmR5fxc'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Common Name (eg: your user, host, or server name) [client]: #回车即可

Keypair and certificate request completed. Your files are:
req: /etc/openvpn/client/3.0.3/pki/reqs/client.req #生成请求文件
key: /etc/openvpn/client/3.0.3/pki/private/client.key


#为客户端签发证书

#注意下面目录切换
[root@vpnserver 3.0.3]# cd /etc/openvpn/easy-rsa/   #切换至原CA证书生成目录

[root@vpnserver easy-rsa]# ./easyrsa import-req /etc/openvpn/client/3.0.3/pki/reqs/client.req client

Note: using Easy-RSA configuration from: ./vars

The request has been successfully imported with a short name of: client
You may now use this name to perform signing operations on this request.

[root@localhost easy-rsa]# ./easyrsa sign client client

Note: using Easy-RSA configuration from: ./vars


You are about to sign the following certificate.
Please check over the details shown below for accuracy. Note that this request
has not been cryptographically verified. Please be sure it came from a trusted
source or that you have verified the request checksum with the sender.

Request subject, to be signed as a client certificate for 3650 days:

subject=
    commonName                = client


Type the word 'yes' to continue, or any other input to abort.
  Confirm request details: yes #输入yes
Using configuration from ./openssl-1.0.cnf
Enter pass phrase for /etc/openvpn/easy-rsa/pki/private/ca.key: #输入CA密码
Check that the request matches the signature
Signature ok
The Subject's Distinguished Name is as follows
commonName            :ASN.1 12:'client'
Certificate is to be certified until Feb 20 23:54:43 2029 GMT (3650 days)

Write out database with 1 new entries
Data Base Updated

Certificate created at: /etc/openvpn/easy-rsa/pki/issued/client.crt

~~~

~~~shell
#server复制证书
[root@vpnserver easy-rsa]# cp pki/ca.crt pki/dh.pem /etc/openvpn/

[root@vpnserver easy-rsa]# cp pki/private/server.key pki/issued/server.crt /etc/openvpn/

[root@vpnserver easy-rsa]# ls /etc/openvpn/
ca.crt  client  dh.pem  easy-rsa  server  server.conf  server.crt  server.key

[root@vpnserver easy-rsa]# cp ta.key /etc/openvpn/

~~~

6）在VPN服务器上进行vpnserver配置文件

~~~shell
#OpenVPN配置
#OpenVPN在其文档目录中有示例配置文件，拷贝该示例配置文件到配置目录
[root@vpnserver ~]# cp /usr/share/doc/openvpn-2.4.6/sample/sample-config-files/server.conf /etc/openvpn/

#修改
[root@vpnserver openvpn]# pwd
/etc/openvpn

[root@localhost openvpn]# cat server.conf
#################################################
# Sample OpenVPN 2.0 config file for            #
# multi-client server.                          #
#                                               #
# This file is for the server side              #
# of a many-clients <-> one-server              #
# OpenVPN configuration.                        #
#                                               #
# OpenVPN also supports                         #
# single-machine <-> single-machine             #
# configurations (See the Examples page         #
# on the web site for more info).               #
#                                               #
# This config should work on Windows            #
# or Linux/BSD systems.  Remember on            #
# Windows to quote pathnames and use            #
# double backslashes, e.g.:                     #
# "C:\\Program Files\\OpenVPN\\config\\foo.key" #
#                                               #
# Comments are preceded with '#' or ';'         #
#################################################

# Which local IP address should OpenVPN
# listen on? (optional)
local 1.1.1.1
#VPN服务器外网接口IP地址

# Which TCP/UDP port should OpenVPN listen on?
# If you want to run multiple OpenVPN instances
# on the same machine, use a different port
# number for each one.  You will need to
# open up this port on your firewall.
port 1194
#侦听端口

# TCP or UDP server?
;proto tcp
proto udp
#选择原因速度快

# "dev tun" will create a routed IP tunnel,
# "dev tap" will create an ethernet tunnel.
# Use "dev tap0" if you are ethernet bridging
# and have precreated a tap0 virtual interface
# and bridged it with your ethernet interface.
# If you want to control access policies
# over the VPN, you must create firewall
# rules for the the TUN/TAP interface.
# On non-Windows systems, you can give
# an explicit unit number, such as tun0.
# On Windows, use "dev-node" for this.
# On most systems, the VPN will not function
# unless you partially or fully disable
# the firewall for the TUN/TAP interface.
;dev tap
dev tun

# Windows needs the TAP-Win32 adapter name
# from the Network Connections panel if you
# have more than one.  On XP SP2 or higher,
# you may need to selectively disable the
# Windows firewall for the TAP adapter.
# Non-Windows systems usually don't need this.
;dev-node MyTap

# SSL/TLS root certificate (ca), certificate
# (cert), and private key (key).  Each client
# and the server must have their own cert and
# key file.  The server and all clients will
# use the same ca file.
#
# See the "easy-rsa" directory for a series
# of scripts for generating RSA certificates
# and private keys.  Remember to use
# a unique Common Name for the server
# and each of the client certificates.
#
# Any X509 key management system can be used.
# OpenVPN can also use a PKCS #12 formatted key file
# (see "pkcs12" directive in man page).
ca /etc/openvpn/ca.crt
cert /etc/openvpn/server.crt
key /etc/openvpn/server.key  # This file should be kept secret

# Diffie hellman parameters.
# Generate your own with:
#   openssl dhparam -out dh2048.pem 2048
dh /etc/openvpn/dh.pem

# Network topology
# Should be subnet (addressing via IP)
# unless Windows clients v2.0.9 and lower have to
# be supported (then net30, i.e. a /30 per client)
# Defaults to net30 (not recommended)
;topology subnet

# Configure server mode and supply a VPN subnet
# for OpenVPN to draw client addresses from.
# The server will take 10.8.0.1 for itself,
# the rest will be made available to clients.
# Each client will be able to reach the server
# on 10.8.0.1. Comment this line out if you are
# ethernet bridging. See the man page for more info.
server 10.8.0.0 255.255.255.0
#为VPN提供一段地址，10.8.0.1被openvpn网关自己使用。

# Maintain a record of client <-> virtual IP address
# associations in this file.  If OpenVPN goes down or
# is restarted, reconnecting clients can be assigned
# the same virtual IP address from the pool that was
# previously assigned.
ifconfig-pool-persist ipp.txt

# Configure server mode for ethernet bridging.
# You must first use your OS's bridging capability
# to bridge the TAP interface with the ethernet
# NIC interface.  Then you must manually set the
# IP/netmask on the bridge interface, here we
# assume 10.8.0.4/255.255.255.0.  Finally we
# must set aside an IP range in this subnet
# (start=10.8.0.50 end=10.8.0.100) to allocate
# to connecting clients.  Leave this line commented
# out unless you are ethernet bridging.
;server-bridge 10.8.0.4 255.255.255.0 10.8.0.50 10.8.0.100

# Configure server mode for ethernet bridging
# using a DHCP-proxy, where clients talk
# to the OpenVPN server-side DHCP server
# to receive their IP address allocation
# and DNS server addresses.  You must first use
# your OS's bridging capability to bridge the TAP
# interface with the ethernet NIC interface.
# Note: this mode only works on clients (such as
# Windows), where the client-side TAP adapter is
# bound to a DHCP client.
;server-bridge

# Push routes to the client to allow it
# to reach other private subnets behind
# the server.  Remember that these
# private subnets will also need
# to know to route the OpenVPN client
# address pool (10.8.0.0/255.255.255.0)
# back to the OpenVPN server.
push "route 192.168.1.0 255.255.255.0"
;push "route 192.168.10.0 255.255.255.0"
;push "route 192.168.20.0 255.255.255.0"

# To assign specific IP addresses to specific
# clients or if a connecting client has a private
# subnet behind it that should also have VPN access,
# use the subdirectory "ccd" for client-specific
# configuration files (see man page for more info).

# EXAMPLE: Suppose the client
# having the certificate common name "Thelonious"
# also has a small subnet behind his connecting
# machine, such as 192.168.40.128/255.255.255.248.
# First, uncomment out these lines:
;client-config-dir ccd
;route 192.168.40.128 255.255.255.248
# Then create a file ccd/Thelonious with this line:
#   iroute 192.168.40.128 255.255.255.248
# This will allow Thelonious' private subnet to
# access the VPN.  This example will only work
# if you are routing, not bridging, i.e. you are
# using "dev tun" and "server" directives.

# EXAMPLE: Suppose you want to give
# Thelonious a fixed VPN IP address of 10.9.0.1.
# First uncomment out these lines:
;client-config-dir ccd
;route 10.9.0.0 255.255.255.252
# Then add this line to ccd/Thelonious:
#   ifconfig-push 10.9.0.1 10.9.0.2

# Suppose that you want to enable different
# firewall access policies for different groups
# of clients.  There are two methods:
# (1) Run multiple OpenVPN daemons, one for each
#     group, and firewall the TUN/TAP interface
#     for each group/daemon appropriately.
# (2) (Advanced) Create a script to dynamically
#     modify the firewall in response to access
#     from different clients.  See man
#     page for more info on learn-address script.
;learn-address ./script

# If enabled, this directive will configure
# all clients to redirect their default
# network gateway through the VPN, causing
# all IP traffic such as web browsing and
# and DNS lookups to go through the VPN
# (The OpenVPN server machine may need to NAT
# or bridge the TUN/TAP interface to the internet
# in order for this to work properly).

push "redirect-gateway def1 bypass-dhcp"

# Certain Windows-specific network settings
# can be pushed to clients, such as DNS
# or WINS server addresses.  CAVEAT:
# http://openvpn.net/faq.html#dhcpcaveats
# The addresses below refer to the public
# DNS servers provided by opendns.com.
；push "dhcp-option DNS 119.29.29.29"
;push "dhcp-option DNS 208.67.220.220"

# Uncomment this directive to allow different
# clients to be able to "see" each other.
# By default, clients will only see the server.
# To force clients to only see the server, you
# will also need to appropriately firewall the
# server's TUN/TAP interface.
client-to-client   ##开启可以使1.1.1.0/24段内网服务器访问到192.168.1.0/24web服务器

# Uncomment this directive if multiple clients
# might connect with the same certificate/key
# files or common names.  This is recommended
# only for testing purposes.  For production use,
# each client should have its own certificate/key
# pair.
#
# IF YOU HAVE NOT GENERATED INDIVIDUAL
# CERTIFICATE/KEY PAIRS FOR EACH CLIENT,
# EACH HAVING ITS OWN UNIQUE "COMMON NAME",
# UNCOMMENT THIS LINE OUT.
；duplicate-cn

# The keepalive directive causes ping-like
# messages to be sent back and forth over
# the link so that each side knows when
# the other side has gone down.
# Ping every 10 seconds, assume that remote
# peer is down if no ping received during
# a 120 second time period.
keepalive 10 120

# For extra security beyond that provided
# by SSL/TLS, create an "HMAC firewall"
# to help block DoS attacks and UDP port flooding.
#
# Generate with:
#   openvpn --genkey --secret ta.key
#
# The server and each client must have
# a copy of this key.
# The second parameter should be '0'
# on the server and '1' on the clients.
tls-auth /etc/openvpn/ta.key 0 # This file is secret

# Select a cryptographic cipher.
# This config item must be copied to
# the client config file as well.
# Note that v2.4 client/server will automatically
# negotiate AES-256-GCM in TLS mode.
# See also the ncp-cipher option in the manpage
cipher AES-256-CBC

# Enable compression on the VPN link and push the
# option to the client (v2.4+ only, for earlier
# versions see below)
;compress lz4-v2
;push "compress lz4-v2"

# For compression compatible with older clients use comp-lzo
# If you enable it here, you must also
# enable it in the client config file.
comp-lzo

# The maximum number of concurrently connected
# clients we want to allow.
;max-clients 100

# It's a good idea to reduce the OpenVPN
# daemon's privileges after initialization.
#
# You can uncomment this out on
# non-Windows systems.
;user nobody
;group nobody

# The persist options will try to avoid
# accessing certain resources on restart
# that may no longer be accessible because
# of the privilege downgrade.
persist-key
persist-tun

# Output a short status file showing
# current connections, truncated
# and rewritten every minute.
status openvpn-status.log

# By default, log messages will go to the syslog (or
# on Windows, if running as a service, they will go to
# the "\Program Files\OpenVPN\log" directory).
# Use log or log-append to override this default.
# "log" will truncate the log file on OpenVPN startup,
# while "log-append" will append to it.  Use one
# or the other (but not both).
;log         openvpn.log
;log-append  openvpn.log

# Set the appropriate level of log
# file verbosity.
#
# 0 is silent, except for fatal errors
# 4 is reasonable for general usage
# 5 and 6 can help to debug connection problems
# 9 is extremely verbose
verb 3

# Silence repeating messages.  At most 20
# sequential messages of the same message
# category will be output to the log.
;mute 20

# Notify the client that when the server restarts so it
# can automatically reconnect.
explicit-exit-notify 1
~~~

7)、开启路由转发

~~~shell
#开启路由转发
[root@vpnserver ~]# cat /etc/sysctl.conf
# sysctl settings are defined through files in
# /usr/lib/sysctl.d/, /run/sysctl.d/, and /etc/sysctl.d/.
#
# Vendors settings live in /usr/lib/sysctl.d/.
# To override a whole file, create a new file with the same in
# /etc/sysctl.d/ and put new settings there. To override
# only specific settings, add a file with a lexically later
# name in /etc/sysctl.d/ and put new settings there.
#
# For more information, see sysctl.conf(5) and sysctl.d(5).
net.ipv4.ip_forward = 1
[root@localhost ~]# sysctl -p
net.ipv4.ip_forward = 1
~~~

8) 启动服务

~~~shell
[root@vpnserver ~]# systemctl -f enable openvpn@server.service
[root@vpnserver ~]# systemctl start openvpn@server.service
~~~

##### 2.3、客户端配置

1)、下载opnevpn服务

~~~shell
[root@client ~]# yum -y install epel-release
[root@client ~]# yum -y install openvpn
~~~

2）、复制client.conf配置文件

~~~shell
[root@client ~]# cp /usr/share/doc/openvpn-2.4.6/sample/sample-config-files/client.conf /etc/openvpn/
~~~

~~~shell
[root@client ~]# ls /etc/openvpn/
ca.crt  client  client.conf  client.crt  client.key  server  ta.key

~~~

3）、修改配置文件

~~~shell
[root@localhost ~]# cat /etc/openvpn/client.conf
##############################################
# Sample client-side OpenVPN 2.0 config file #
# for connecting to multi-client server.     #
#                                            #
# This configuration can be used by multiple #
# clients, however each client should have   #
# its own cert and key files.                #
#                                            #
# On Windows, you might want to rename this  #
# file so it has a .ovpn extension           #
##############################################

# Specify that we are a client and that we
# will be pulling certain config file directives
# from the server.
client

# Use the same setting as you are using on
# the server.
# On most systems, the VPN will not function
# unless you partially or fully disable
# the firewall for the TUN/TAP interface.
;dev tap
dev tun

# Windows needs the TAP-Win32 adapter name
# from the Network Connections panel
# if you have more than one.  On XP SP2,
# you may need to disable the firewall
# for the TAP adapter.
;dev-node MyTap

# Are we connecting to a TCP or
# UDP server?  Use the same setting as
# on the server.
;proto tcp
proto udp

# The hostname/IP and port of the server.
# You can have multiple remote entries
# to load balance between the servers.
remote 1.1.1.1 1194
;remote my-server-2 1194

# Choose a random host from the remote
# list for load-balancing.  Otherwise
# try hosts in the order specified.
;remote-random

# Keep trying indefinitely to resolve the
# host name of the OpenVPN server.  Very useful
# on machines which are not permanently connected
# to the internet such as laptops.
resolv-retry infinite

# Most clients don't need to bind to
# a specific local port number.
nobind

# Downgrade privileges after initialization (non-Windows only)
;user nobody
;group nobody

# Try to preserve some state across restarts.
persist-key
persist-tun

# If you are connecting through an
# HTTP proxy to reach the actual OpenVPN
# server, put the proxy server/IP and
# port number here.  See the man page
# if your proxy server requires
# authentication.
;http-proxy-retry # retry on connection failures
;http-proxy [proxy server] [proxy port #]

# Wireless networks often produce a lot
# of duplicate packets.  Set this flag
# to silence duplicate packet warnings.
;mute-replay-warnings

# SSL/TLS parms.
# See the server config file for more
# description.  It's best to use
# a separate .crt/.key file pair
# for each client.  A single ca
# file can be used for all clients.
ca /etc/openvpn/ca.crt
cert /etc/openvpn/client.crt
key /etc/openvpn/client.key

# Verify server certificate by checking that the
# certicate has the correct key usage set.
# This is an important precaution to protect against
# a potential attack discussed here:
#  http://openvpn.net/howto.html#mitm
#
# To use this feature, you will need to generate
# your server certificates with the keyUsage set to
#   digitalSignature, keyEncipherment
# and the extendedKeyUsage to
#   serverAuth
# EasyRSA can do this for you.
remote-cert-tls server

# If a tls-auth key is used on the server
# then every client must also have the key.
tls-auth /etc/openvpn/ta.key 1

# Select a cryptographic cipher.
# If the cipher option is used on the server
# then you must also specify it here.
# Note that v2.4 client/server will automatically
# negotiate AES-256-GCM in TLS mode.
# See also the ncp-cipher option in the manpage
cipher AES-256-CBC

# Enable compression on the VPN link.
# Don't enable this unless it is also
# enabled in the server config file.
#comp-lzo

# Set log file verbosity.
verb 3

# Silence repeating messages
;mute 20
~~~

4）、修改网卡IP地址

~~~shell
[root@localhost ~]# cat /etc/sysconfig/network-scripts/ifcfg-ens33
TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=ens33
UUID=bb300759-8c34-4e8a-b708-089b105425c3
DEVICE=ens33
ONBOOT=yes
IPADDR=1.1.1.2
PREFIX=24
GATEWAY=1.1.1.1
~~~

~~~shell
[root@client ~]# systemctl start openvpn@client.service
[root@client ~]# systemctl enable openvpn@client.service
~~~

2.5、测试访问

1）、client测试访问

```
[root@client ~]# curl  192.168.1.2
internal test
```

2）、1.1.1.0/24段内服务器测试访问

```
[root@client2 ~]# curl  192.168.1.2
internal test
```

测试成功















