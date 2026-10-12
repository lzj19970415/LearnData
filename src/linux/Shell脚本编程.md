---
title: Shell脚本编程从入门到实战
category: Linux进阶
tags:
  - Shell
  - Linux
  - 脚本编程
---

> 面向运维的 Shell 编程完整笔记，涵盖基础语法、变量、条件判断、循环、函数、调试及实战场景。

## 一、Shell 是什么

Shell 是一个**命令解释器**，位于操作系统外层，负责解释执行用户输入的命令，并把结果返回给用户。用户每输入一条命令，Shell 就解释执行一条，这种交互方式称为**交互式**。把一系列命令写进一个文件批量执行，就是 **Shell 脚本**。

**常见 Shell：**
- `bash`（Bourne Again Shell）：Linux 默认，功能最强，本教程以 bash 为准
- `sh`：最基础的 Bourne Shell，脚本兼容性最好
- `csh` / `zsh` / `ksh` 等

**第一个脚本：**

```bash
#!/bin/bash
echo "Hello World"
```

- `#!/bin/bash` 是"解释器声明"，告诉系统用 bash 执行
- 保存为 `hello.sh` 后，执行 `chmod +x hello.sh` 赋予执行权限，然后 `./hello.sh` 运行
- 也可直接 `bash hello.sh` 运行，无需执行权限

## 二、变量

### 1. 变量定义与引用

```bash
name="运维小张"        # 变量名=值，等号两边不能有空格
num=10
echo $name            # 引用变量，前面加 $ 
echo ${num}           # 推荐用 {} 包裹，避免歧义
```

**规则：** 变量名只能由字母、数字、下划线组成，不能以数字开头。

### 2. 变量类型

| 类型 | 说明 | 示例 |
|---|---|---|
| 普通变量 | 当前脚本内有效 | `name="xxx"` |
| 环境变量 | 全局有效，可被子进程继承 | `export PATH=/usr/bin` |
| 位置变量 | 脚本运行时传入的参数 | `$1` `$2` ... `$9` |
| 特殊变量 | 脚本自身的状态信息 | `$0` `$#` `$?` 等 |

**常用特殊变量：**

```bash
$0     # 脚本文件名
$1-$9  # 第1到第9个位置参数
$#     # 位置参数的个数
$*     # 所有参数（当成一个整体）
$@     # 所有参数（分别看待）
$?     # 上一条命令的返回值（0=成功，非0=失败）
$$     # 当前脚本的进程号 PID
```

**示例：**

```bash
#!/bin/bash
echo "脚本名: $0"
echo "参数个数: $#"
echo "第一个参数: $1"
echo "退出码: $?"
```

### 3. 算术运算

```bash
a=10
b=20
echo $((a + b))        # 30，推荐用 $(( ))
echo $((a * b))        # 200
let c=a+b              # let 命令也行
```

## 三、条件测试与判断

### 1. 条件测试语法

```bash
test 表达式
[ 表达式 ]          # 注意：[] 两边必须有空格
[[ 表达式 ]]        # 增强版，支持正则，推荐
```

### 2. 文件判断

```bash
[ -f 文件 ]   # 是否为普通文件
[ -d 目录 ]   # 是否为目录
[ -e 路径 ]   # 是否存在
[ -x 文件 ]   # 是否可执行
[ -r 文件 ]   # 是否可读
[ -w 文件 ]   # 是否可写
[ -s 文件 ]   # 是否非空
```

### 3. 数值比较

```bash
[ $a -eq $b ]   # 等于
[ $a -ne $b ]   # 不等于
[ $a -gt $b ]   # 大于
[ $a -ge $b ]   # 大于等于
[ $a -lt $b ]   # 小于
[ $a -le $b ]   # 小于等于
```

### 4. 字符串判断

```bash
[ "$s1" = "$s2" ]      # 相等
[ "$s1" != "$s2" ]     # 不相等
[ -z "$s" ]            # 字符串为空
[ -n "$s" ]            # 字符串非空
```

### 5. 逻辑运算

```bash
[ 条件1 -a 条件2 ]    # 与 and
[ 条件1 -o 条件2 ]    # 或 or
[ ! 条件 ]            # 非 not
# [[ ]] 中可用 && || !
```

## 五、流程控制

### 1. if 判断

```bash
#!/bin/bash
num=15
if [ $num -gt 10 ]; then
    echo "数字大于10"
elif [ $num -eq 10 ]; then
    echo "数字等于10"
else
    echo "数字小于10"
fi
```

### 2. case 多分支

```bash
#!/bin/bash
case "$1" in
  start)
    echo "启动服务"
    ;;
  stop)
    echo "停止服务"
    ;;
  restart)
    echo "重启服务"
    ;;
  *)
    echo "用法: $0 {start|stop|restart}"
    ;;
esac
```

## 七、循环

### 1. for 循环

```bash
# 遍历数字
for i in 1 2 3 4 5; do
    echo "数字: $i"
done

# 遍历文件
for f in /etc/*.conf; do
    echo "配置文件: $f"
done

# C 风格
for ((i=1; i<=10; i++)); do
    echo $i
done
```

### 2. while 循环

```bash
i=1
while [ $i -le 5 ]; do
    echo "第 $i 次"
    i=$((i + 1))
done
```

### 3. break 与 continue

```bash
break      # 跳出整个循环
continue   # 跳过本次，继续下一次
```

## 八、函数

```bash
#!/bin/bash
# 定义函数
function log_info() {
    echo "[INFO] $1"
}

log_warn() {
    echo "[WARN] $1"
}

# 调用
log_info "系统启动正常"
log_warn "磁盘空间不足"
```

**函数要点：**
- 函数要先定义后调用
- 用 `$1` `$2` 接收参数
- 用 `return` 返回状态码，用 `echo` 返回输出值
- `local` 声明局部变量，避免污染全局

## 九、运维实战脚本示例

### 1. 一键检查系统状态

```bash
#!/bin/bash
echo "=== 系统信息 ==="
uname -a
echo "=== 磁盘使用 ==="
df -h | grep -v tmpfs
echo "=== 内存使用 ==="
free -h
echo "=== 负载 ==="
uptime
```

### 2. 检查端口是否在监听

```bash
#!/bin/bash
PORT=3306
if ss -tlnp | grep -q ":$PORT "; then
    echo "端口 $PORT 正在监听"
else
    echo "警告：端口 $PORT 未监听！"
fi
```

### 3. 批量 ping 主机

```bash
#!/bin/bash
for ip in 192.168.1.1 192.168.1.2 192.168.1.3; do
    if ping -c 1 -W 1 $ip >/dev/null 2>&1; then
        echo "$ip 在线"
    else
        echo "$ip 离线"
    fi
done
```

### 4. 自动备份脚本

```bash
#!/bin/bash
# 备份 MySQL 数据库
DB_USER="root"
DB_PASS="password"
DB_NAME="mydb"
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.sql
if [ $? -eq 0 ]; then
    echo "备份成功: $BACKUP_DIR/${DB_NAME}_${DATE}.sql"
else
    echo "备份失败！"
    exit 1
fi
```

### 5. 定时巡检日志关键字

```bash
#!/bin/bash
# 检查错误日志
LOG="/var/log/nginx/error.log"
if [ -f "$LOG" ]; then
    count=$(grep -c "ERROR\|FATAL" $LOG)
    echo "错误日志数量: $count"
    if [ $count -gt 50 ]; then
        echo "告警：错误日志过多！"
    fi
fi
```

## 十、脚本调试技巧

```bash
bash -x script.sh      # 逐条显示执行过程（最常用）
bash -n script.sh      # 只检查语法，不执行
```

- `-x` 能看到每一行命令的实际执行，排错神器
- 脚本开头加 `set -e`，遇到错误立即退出
- 变量加引号 `"$var"` 防止空格导致的问题

## 小结

Shell 是运维的核心技能。掌握变量、条件判断、循环、函数这四大块，加上管道和重定向，就能把日常重复的命令变成可复用的脚本。多看、多写、多用 `-x` 调试，进步最快。

> AI生成
