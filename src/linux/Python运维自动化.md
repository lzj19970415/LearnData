---
title: Python运维自动化入门
category: Linux进阶
tags:
  - Python
  - 运维
  - 自动化
---

# Python 运维自动化入门

面向运维方向的 Python 入门笔记，涵盖环境、基本语法、正则、文件操作、数据库与自动化脚本。

## 一、环境准备

```bash
# 检查版本
python3 --version

# 安装 pip
yum install python3-pip
apt install python3-pip

# 安装常用库
pip3 install requests pymysql paramiko
```

## 二、基本语法

### 1. 变量与数据类型

```python
name = "运维"        # 字符串
num = 100           # 整数
rate = 3.14         # 浮点数
is_ok = True        # 布尔值
list1 = [1, 2, 3]   # 列表
dict1 = {"host": "10.0.0.1", "port": 3306}  # 字典
```

### 2. 输入输出

```python
name = input("请输入主机名: ")
print("主机名是:", name)
print(f"端口号是: {dict1['port']}")   # f-string 格式化
```

### 3. 条件判断

```python
load = 0.85
if load > 0.8:
    print("负载过高，告警！")
elif load > 0.5:
    print("负载偏高")
else:
    print("负载正常")
```

### 4. 循环

```python
# for 遍历列表
hosts = ["web1", "web2", "web3"]
for h in hosts:
    print(f"检查主机 {h}")

# while
i = 0
while i < 5:
    print(i)
    i += 1
```

## 三、函数

```python
def check_cpu(threshold=0.8):
    """检查 CPU 负载"""
    cpu = get_cpu_usage()   # 假设有获取函数
    if cpu > threshold:
        print(f"CPU 超限: {cpu}%")
        return False
    return True

# 调用
check_cpu(0.9)
```

## 四、正则表达式（运维常用）

正则用于匹配、查找、替换文本，处理日志和配置文件非常高效。

```python
import re

# 匹配 IP 地址
log = "访问来源 192.168.1.100 端口 80"
ip = re.findall(r"\d+\.\d+\.\d+\.\d+", log)
print(ip)   # ['192.168.1.100']

# 匹配邮箱
email = "联系: ops@example.com"
m = re.search(r'[\w.]+@[\w.]+', email)
print(m.group())   # ops@example.com

# 替换
new = re.sub(r"\d+\.\d+\.\d+\.\d+", "***.***.***.***", log)
print(new)
```

**常用正则符号：**

| 符号 | 含义 |
|---|---|
| `.` | 匹配任意字符 |
| `*` | 匹配前一个字符 0 次或多次 |
| `+` | 匹配前一个字符 1 次或多次 |
| `\d` | 匹配数字 |
| `\w` | 匹配字母数字下划线 |
| `^` / `$` | 行首 / 行尾 |
| `[]` | 字符集合，如 `[0-9]` |

## 五、文件操作（服务器信息清洗）

```python
# 读取文件
with open("/var/log/nginx/access.log", "r") as f:
    lines = f.readlines()

# 统计访问次数最多的 IP
ip_count = {}
for line in lines:
    parts = line.split()
    if parts:
        ip = parts[0]
        ip_count[ip] = ip_count.get(ip, 0) + 1

# 排序输出 Top5
top = sorted(ip_count.items(), key=lambda x: x[1], reverse=True)[:5]
for ip, count in top:
    print(f"{ip}: {count} 次")
```

## 六、操作数据库

```python
import pymysql

# 连接 MySQL
conn = pymysql.connect(
    host="localhost",
    user="root",
    password="123456",
    database="mydb",
    charset="utf8mb4"
)
cur = conn.cursor()

# 查询
cur.execute("SELECT id, name FROM users")
for row in cur.fetchall():
    print(row)

# 插入
cur.execute("INSERT INTO users (name) VALUES (%s)", ("xiaowang",))
conn.commit()

cur.close()
conn.close()
```

## 七、运维自动化实战

### 1. 批量 ping 检查主机

```python
import subprocess

hosts = ["192.168.1.1", "192.168.1.2", "192.168.1.3"]
for ip in hosts:
    result = subprocess.run(
        ["ping", "-c", "1", "-W", "1", ip],
        capture_output=True
    )
    status = "在线" if result.returncode == 0 else "离线"
    print(f"{ip}: {status}")
```

### 2. 远程执行命令（SSH）

```python
import paramiko

def ssh_cmd(host, user, cmd, password=""):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=5)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode()

# 示例
print(ssh_cmd("192.168.1.10", "root", "uptime"))
```

> 生产环境 SSH 密码不应硬编码在脚本中，建议使用密钥认证或配置管理工具（如 Ansible）。

### 3. 巡检脚本（记录到文件）

```python
import datetime
import subprocess

now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
report = f"==== 巡检报告 {now} ====\n"

# 磁盘
df = subprocess.run(["df", "-h"], capture_output=True, text=True)
report += df.stdout + "\n"

# 写入
with open("/tmp/report.txt", "w") as f:
    f.write(report)
print("报告已生成 /tmp/report.txt")
```

## 小结

Python 让运维从"手动敲命令"升级为"写脚本自动化"。重点掌握：**基本语法、正则（提取信息）、文件操作、数据库、paramiko/requests**。结合你已有的 Shell 基础，两者配合能覆盖绝大多数运维自动化场景。

> AI生成
