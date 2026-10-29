---
title: Shell脚本编程从入门到实战
category: Linux进阶
tags:
  - Shell
  - Linux
  - 脚本编程
---

# Shell 脚本编程：小白跟着做，一篇就上手

> 做完这篇，你会亲手拥有 **7 个自己敲出来、逐行验证过的脚本**：从最简单的 Hello World，到批量 ping 巡检、多服务体检工具，最后是一个**能直接上生产的备份脚本**（带日期命名、大小校验、超 7 天自动清理、写日志，再用 crontab 让它每天凌晨 2 点自动跑）。路上顺带练会运维吃饭的家伙什：chmod 执行权限、三种引号、if/for/函数、`bash -x` 调试排错。全程在 CentOS 7 虚拟机里动手，边看边敲就能全做出来。

## 实验环境准备

**第 1 步：登录 CentOS 7 虚拟机，确认 bash 在岗。**

```bash
cat /etc/redhat-release
bash --version
echo $SHELL
```

预期输出（版本号略有差别不要紧，关键是能看到 CentOS 7 和 bash 4.2）：

```text
CentOS Linux release 7.9.2009 (Core)
GNU bash, version 4.2.46(2)-release (x86_64-redhat-linux-gnu)
/bin/bash
```

**人话扫盲：Shell 是啥？** 你敲命令，真正干活的是操作系统，中间得有个"翻译官"——这个翻译官就是 Shell。bash 是 Linux 默认、功能最强的那个 Shell（同门还有更简朴的 sh 和 csh/zsh/ksh 等流派）。两种用法：**交互式**（敲一条看一条）和**脚本式**（把一串命令写进文件让系统一口气跑完）——后者就是 **Shell 脚本**，运维的自动化全靠它。

**第 2 步：建个练习目录**，本篇所有脚本都住这里：

```bash
mkdir -p ~/shell-learn
cd ~/shell-learn
pwd
```

预期打印 `/root/shell-learn`。❗【易错】`~` 代表"当前用户家目录"，本篇默认你是 root；若 `echo $HOME` 打印的不是 `/root`，下文所有 `/root` 一律换成它。

**第 3 步：学会用 vi 新建文件**（全程用它）：`vi 文件名` 打开 → 按 `i` 开敲 → 按 `Esc` 再输入 `:wq` 保存退出；敲错想重来，`rm 文件名` 删掉重建。（受不了 vi 就 `yum install -y nano`，跟记事本差不多。）

## 实验一：第一个脚本——30 秒的 Hello World

### 🎯 目标

写一个能运行的 `hello.sh`：运行它，让 Linux 主动给你回话。意义在于验证**"一串命令可以打包成文件、随时一键重跑"**——后面一切自动化都从这个文件开始。

### 📍 在哪动手

新建文件 `/root/shell-learn/hello.sh`：

```bash
cd ~/shell-learn
vi hello.sh
```

### 🔧 动手做

敲入并保存（`i` 开敲，`Esc` + `:wq` 保存）：

```bash
#!/bin/bash
# 第一行叫 shebang（井号+叹号）：告诉系统这个文件交给 /bin/bash 解释执行
# # 开头的行是注释，bash 不执行，是写给人看的
echo "Hello World!"
echo "I am $(whoami), on $(hostname)"
```

- `#!/bin/bash`：shebang，❗必须写在第一行，指定用哪位"翻译官"；忘写它脚本可能不按 bash 规则执行。
- `echo "..."`：打印命令，引号里内容原样上屏；`$(whoami)` 是先跑括号里的命令、把结果填回句子（当前用户名、机器名）——**命令替换**初体验，实验二细讲。

然后发"通行证"并运行：

```bash
chmod +x hello.sh     # 加可执行权限（Linux 看"通行证"不看文件名）
./hello.sh            # 运行；点代表"当前目录"
```

### ✅ 怎么算成功

```text
Hello World!
I am root, on localhost.localdomain
```

（第二行跟你的用户名、机器名一致即可，关键字是 `Hello World!`。）

❗【易错】`./` 为什么不能省？直接敲命令时 Linux 只去环境变量 `PATH` 列出的目录找命令（`echo $PATH` 可看），当前目录不在其中，裸敲 `hello.sh` 会报 command not found；`./` 是明确说"跑当前目录这个文件"。

**三种运行方式对照**——看懂这张表就明白为什么 `sh xxx.sh` 和 `./xxx.sh` 都能跑：

| 运行方式 | 要 chmod +x 吗 | 谁来执行 | 备注 |
|---|---|---|---|
| `./hello.sh` | 要 | shebang 指定的 `/bin/bash` | 生产推荐 |
| `bash hello.sh` | 不要 | 明确指定的 bash | 临时调试推荐 |
| `sh hello.sh` | 不要 | 以 sh 身份运行 | ❗sh 规则简朴，脚本用了 bash 特有语法时可能出错 |

### 🩹 如果不对

1. **`Permission denied`**：忘了 `chmod +x`，Linux 拒绝运行。
2. **`bash: ./hello.sh: No such file or directory`**：文件名敲错或人不在 `~/shell-learn`，用 `pwd`、`ls` 核对。
3. **`command not found`**：运行时忘了写 `./`。
4. **vi 内容没存上/敲串了**：没按 `i` 就敲、或没按 `Esc` 就敲 `:wq`。重来：vi 里连按两次 `d`（dd）删错行，或删了重建。

## 实验二：变量与三种引号——Shell 第一大坑，必须亲眼看

### 🎯 目标

让脚本临时记住信息（如"要备份的目录""日期"），**改一处、处处生效**；再用同一段代码分别跑单引号/双引号/反引号，亲眼对比三种输出——Shell 第一大坑兼面试必考：搞混了不报错，但输出莫名其妙不对。

### 📍 在哪动手

在 `~/shell-learn` 里执行 `vi vars.sh`，新建文件 `/root/shell-learn/vars.sh`。

### 🔧 动手做

```bash
#!/bin/bash
# ===== 第 1 部分：变量定义 =====
name="运维"           # 存"运维"进变量 name。❗等号两边绝不能有空格！
num=10
echo "$name"           # 取值时前面加 $
echo "${num}"          # 花括号效果一样，拼接时能划清边界，推荐
# name = "运维"        # 错误示范（别取消注释）：等号一有空格，bash 就把 name 当命令名，报 command not found

# ===== 第 2 部分：三种引号对比（本实验主角）=====
echo '单引号：你好 $name，我在 $(hostname)'
echo "双引号：你好 $name，我在 $(hostname)"
echo "反引号：现在时间 `date +%T`"
echo "新写法：现在时间 $(date +%T)"

# ===== 第 3 部分：算术运算 =====
a=10
b=20
echo "a+b=$((a+b))"

# ===== 第 4 部分：普通变量 vs 环境变量 =====
export LESSON="Shell实验二"    # 加了 export 就是环境变量，能被子进程继承
bash -c 'echo "子进程看到的 LESSON 是 $LESSON"'
# ↑ bash -c 另起子进程跑引号里的命令；用单引号正好让 $LESSON 原样传给子进程自己展开——复习"单引号全照抄"
```

**口诀**：**单引号死板全照抄**（`$name` 就是 6 个字符本身）；**双引号机灵认变量**（变量和 `$( )` 都换成结果）；**反引号/`$( )` 先跑再交**（先执行命令把输出填进句子；`$( )` 是新写法，更清晰、能嵌套，生产推荐；反引号键在键盘左上角 `Tab` 上方）。

⚠️【必考】变量命名规则：只能用**字母、数字、下划线**，不能以数字开头。

### ✅ 怎么算成功

```bash
chmod +x vars.sh
./vars.sh
```

预期输出（时间看你运行的时刻）：

```text
运维
10
单引号：你好 $name，我在 $(hostname)
双引号：你好 运维，我在 localhost.localdomain
反引号：现在时间 14:23:05
新写法：现在时间 14:23:05
a+b=30
子进程看到的 LESSON 是 Shell实验二
```

三种引号的输出**并排对比**（本实验核心）：

| 你写的 | 实际打印 | 原因 |
|---|---|---|
| `'你好 $name'` | `你好 $name` | 单引号：死板全照抄 |
| `"你好 $name"` | `你好 运维` | 双引号：机灵认变量 |
| `"时间 `date +%T`"` | `时间 14:23:05` | 反引号：先跑命令再交结果 |

### 🩹 如果不对

1. **`name: command not found`**：等号两边加了空格，删掉。
2. **输出对不上**：单双引号敲反了，对着表格检查。
3. **带空格的变量"裂开"了** ❗：`f="my file.txt"` 用 `rm $f` 会被拆成 `my` 和 `file.txt` 两个参数。**保命习惯：取变量一律套双引号 `"$f"`**——生产脚本三铁律之一"变量要加引号"，能挡掉八成灵异 bug。
4. **`$name_dir` 打印成空白**：bash 把它当成叫 `name_dir` 的整体变量；写 `${name}_dir` 用花括号划清边界。

## 实验三：条件判断——让脚本学会"看情况"

### 🎯 目标

前两个脚本"无脑从头跑到尾"，但运维脚本必须会分情况："服务活着就别动，挂了就报警"。本实验写一个检查 nginx 是否在跑的脚本：在跑说"正常"，没跑说"挂了"；然后**故意把服务停掉再跑一遍**，亲眼看输出变化——一切监控告警脚本的雏形。

### 📍 在哪动手

在 `~/shell-learn` 里执行 `vi check_nginx.sh`，新建文件 `/root/shell-learn/check_nginx.sh`。若虚拟机没装 nginx，把下面命令和脚本里的 `nginx` 换成 `crond` 或 `sshd`（CentOS 7 自带且在跑）即可，效果一样。

先直接敲一下本实验的"温度计"，它只打印一个词：`active` 在跑、`inactive` 没跑：

```bash
systemctl is-active nginx
```

### 🔧 动手做

```bash
#!/bin/bash
# 检查 nginx 服务状态，按情况打印不同结论
SVC="nginx"
status=$(systemctl is-active $SVC)     # 跑命令，输出存进变量（复习 $( ) 命令替换）

if [ "$status" = "active" ]; then       # 条件成立走这里
    echo "$SVC 服务状态：$status —— 运行正常"
elif [ "$status" = "inactive" ]; then  # elif = else if，再试另一个条件
    echo "$SVC 服务状态：$status —— 挂了，快处理！"
else                                    # 前面都不成立走这里
    echo "$SVC 服务状态：$status —— 状态未知，人工看看"
fi
# fi 就是 if 反过来写，标志整个判断块结束
```

条件判断要点 ⚠️【必考】：

1. **`[ ]` 里必须有空格** ❗：`[ "$status" = "active" ]`——左括号后、右括号前、`=` 两边都要空格，忘写是新手报错榜前三名。
2. **字符串比较**：`=` 相等、`!=` 不等；`[ -z "$s" ]` 为空、`[ -n "$s" ]` 非空。**逻辑运算**：`[ ]` 里用 `-a`（与）、`-o`（或）、`!`（非），增强版 `[[ ]]` 里可直接写 `&&`、`||`、`!`。
3. **数值比较**用英文缩写：`-eq` 等于、`-ne` 不等、`-gt` 大于、`-ge` 大于等于、`-lt` 小于、`-le` 小于等于，如 `[ $a -gt 10 ]`。
4. **文件判断**如 `[ -f 文件 ]`、`[ -d 目录 ]`，完整对照表见篇末速查。

### ✅ 怎么算成功

```bash
chmod +x check_nginx.sh
./check_nginx.sh
```

预期输出（假设 nginx 在跑）：

```text
nginx 服务状态：active —— 运行正常
```

重头戏——**故意搞破坏，验证脚本真的会"看情况"**：

```bash
systemctl stop nginx
./check_nginx.sh
```

```text
nginx 服务状态：inactive —— 挂了，快处理！
```

再 `systemctl start nginx` 跑一遍，确认回到"运行正常"。❗同一个脚本、三种不同输出——这就是条件判断的意义：脚本跟着实际情况走，而不是傻跑。

### 🩹 如果不对

1. **`[: too many arguments`** / **`[: =: unary operator expected`**：`[ ]` 里空格没写够，或 `$status` 为空还没套双引号。严格照抄 `[ "$status" = "active" ]`。
2. **`syntax error near unexpected token 'fi'`**：`if` 和 `then` 之间少了 `;`，格式记住 `if 条件; then`。
3. **systemctl 打印 `unknown`**：服务名敲错，用 `systemctl list-units --type=service | grep -i nginx` 找正确名字。
4. **`Failed to stop nginx: Access denied`**：你不是 root，`su -` 切换后再练。

## 实验四：循环干活——把重复劳动交给脚本

### 🎯 目标

运维最经典的场景：一个网段几十台机器，哪些活着、哪些挂了？总不能手敲几十次 ping。**for 循环专干"同一件事重复 N 次"**：本实验批量探测整段 IP，一次跑出在线/离线清单——生产里的资产巡检、故障发现工具就是这么长出来的。

### 📍 在哪动手

先看你的虚拟机在哪个网段（找一行像 `inet 192.168.122.130/24 brd ...` 的，别管 `127.0.0.1` 那行，前三位就是网段）：

```bash
ip addr | grep "inet "
```

**示例用 `192.168.122`，你要换成自己的**。然后在 `~/shell-learn` 里执行 `vi ping_check.sh`。

### 🔧 动手做

```bash
#!/bin/bash
# 批量探测网段 1~5 号主机，输出在线/离线清单
NET="192.168.122"        # 换成你自己的网段前三位！
UP=0                     # 在线计数
DOWN=0                   # 离线计数

for i in $(seq 1 5); do            # $(seq 1 5) 生成 1 2 3 4 5，循环体跑 5 轮
    ip="$NET.$i"                   # 拼出完整 IP，如 192.168.122.1
    if ping -c 1 -W 1 "$ip" > /dev/null 2>&1; then
        # -c 1 只 ping 一次；-W 1 最多等 1 秒
        # > /dev/null 2>&1：正常输出(1)和报错输出(2)全扔黑洞，只要成败
        echo "$ip 在线"
        UP=$((UP + 1))             # 计数加一（复习 $(( )) 算术）
    else
        echo "$ip 离线"
        DOWN=$((DOWN + 1))
    fi
done

echo "-------------------"
echo "汇总：在线 $UP 台，离线 $DOWN 台"
```

- **for 循环**：`for 变量 in 列表; do ... done`，列表几个值跑几轮；列表可写死（`for ip in 192.168.1.1 192.168.1.2`）、可由命令生成（`$(seq 1 5)`）、可用通配符（`for f in /etc/*.conf`）。
- **`if` 直接判命令成败**：`if ping ...; then` 意思是"ping 的退出码是 0 就……"。**退出码**约定：0 = 成功、非 0 = 失败，上一条的退出码存在 `$?` 里——脚本"成败判断"的底层逻辑。
- **`> /dev/null 2>&1`**：输出全屏蔽不要刷屏，`2>&1` 读作"报错也跟着正常输出一起走"。

### ✅ 怎么算成功

```bash
chmod +x ping_check.sh
./ping_check.sh
```

预期输出（谁在线看你网段，关键字是"在线/离线/汇总"）：

```text
192.168.122.1 在线
192.168.122.2 离线
192.168.122.3 离线
192.168.122.4 离线
192.168.122.5 离线
-------------------
汇总：在线 1 台，离线 4 台
```

（VMware/VirtualBox 的 NAT 网络里，前几个 IP 大多没人、1 号一般是网关，"在线 1 离线 4"属正常现象。）

### 🩹 如果不对

1. **全部离线**：`NET` 没换成自己的网段，或网段不通。先 `ping -c 1 网关IP` 验证。
2. **跑得特别慢**：多数主机离线、每台都在等超时。检查 `-W 1` 写了没；想中途收工按 `Ctrl + C`。
3. **`seq: command not found`**：极罕见，可改用 C 风格：`for ((i=1; i<=5; i++)); do`。

## 实验五：函数与参数——把一次性脚本升级成复用工具

### 🎯 目标

实验三把 nginx 写死了，查十个服务难道写十个脚本？**函数**把"查服务状态"这套逻辑打包成 `check_service()`，用时传不同服务名，写一遍、到处用。最终效果：**一条命令体检一批关键服务**——生产巡检小工具的雏形。

### 📍 在哪动手

在 `~/shell-learn` 里执行 `vi check_services.sh`，新建文件 `/root/shell-learn/check_services.sh`。

### 🔧 动手做

```bash
#!/bin/bash
# 多服务体检工具：要查的服务名作为参数传给脚本

check_service() {                    # 定义函数（必须先定义后使用！）
    local svc="$1"                   # $1 = 传给函数的第 1 个参数；local = 函数私有，不污染外部
    local status                      # 好习惯：函数内变量都 local
    status=$(systemctl is-active "$svc")

    if [ "$status" = "active" ]; then
        echo "[OK]   $svc 运行正常"
    else
        echo "[CRITICAL] $svc 挂了！状态：$status"
    fi
}

if [ $# -eq 0 ]; then                # $# = 参数个数；等于 0 说明没传服务名
    echo "用法：$0 服务名1 [服务名2 ...]"
    echo "例如：$0 nginx crond sshd"
    exit 1                           # 非 0 退出码退场，方便别的程序判断"这次失败了"
fi

for svc in "$@"; do                  # "$@" = 所有参数、彼此独立，来几个查几个
    check_service "$svc"             # 调用：函数名 + 空格 + 参数，不要括号
done
```

函数四要点 ⚠️【必考】：

1. **函数 = 自己造的命令**：`check_service() { ...; }` 定义，`check_service nginx` 调用（不加括号）；bash 从上往下读，**必须先定义后调用**。
2. **`$1`、`$2` 依次收参数**。❗函数里的 `$1` 是**传给函数的**参数，和传给脚本的互不干扰。
3. **`local` 声明局部变量**：不加就是全局变量，函数一多容易互相改坏——复杂脚本里的头号暗器。
4. **两种返回**：`return` 返回**状态码**（0~255，配合 `$?` 判断）；返回**文字结果**用 `echo`，外面用 `result=$(函数名)` 接住。

口诀：**`$@` 各算各的（循环里永远用它），`$*` 一锅端（适合整句打印）**。`$0` 脚本名、`$#` 参数个数、`$?` 退出码——完整表见篇末速查。

### ✅ 怎么算成功

```bash
chmod +x check_services.sh
./check_services.sh                    # 不带参数，会打印两行用法提示（$0 和示例）
./check_services.sh crond sshd nginx   # 一条命令查三个服务
```

预期输出：

```text
[OK]   crond 运行正常
[OK]   sshd 运行正常
[OK]   nginx 运行正常
```

再用实验三的老套路验证它真的会报警——停一个再查：

```bash
systemctl stop crond
./check_services.sh crond sshd nginx
```

```text
[CRITICAL] crond 挂了！状态：inactive
[OK]   sshd 运行正常
[OK]   nginx 运行正常
```

记得 `systemctl start crond` 救回来（它是管定时任务的服务，实验七还要用）。

### 🩹 如果不对

1. **`check_service: command not found`**：调用写在了定义前面，或函数名敲错。
2. **`[: =: unary operator expected`**：参数没传到，`$status` 空了又没引号，或 `"$@"` 忘了引号导致参数被空格拆散。双引号别偷懒。
3. **想让函数报错返回而不退脚本**：`exit 1` 会退整个脚本；只让函数返回用 `return 1`。

## 实验六：实战项目——一个能直接上生产的备份脚本

### 🎯 目标

最能回答"学 Shell 干嘛"的就是备份：每家公司都要天天备数据，备份脚本通常是运维新人接手的第一个生产脚本。本实验做完整版：**打包成带日期的备份文件**（一眼知道是哪天的）、**校验大小**（防止 0 字节假货）、**自动清理超 7 天旧备份**（磁盘不被吃光）、**每次运行写日志**（出事能翻账本）。写完改两个路径就能搬上生产机。

### 📍 在哪动手

```bash
mkdir -p ~/backups     # 备份文件存放地（金库），脚本里也会兜底创建
cd ~/shell-learn
vi mybackup.sh         # 备份脚本本身
```

### 🔧 动手做

整段敲进去，每行都有注释，边敲边理解：

```bash
#!/bin/bash
# 生产级小备份脚本：打包 -> 校验大小 -> 清理旧备份 -> 写日志
SRC="$HOME/shell-learn"                                  # 备份对象：拿练习目录开刀（上生产改这里）
BACKUP_DIR="$HOME/backups"                               # 备份存放目录
LOG="$BACKUP_DIR/backup.log"                             # 日志文件：每次运行记一笔
KEEP_DAYS=7                                              # 保留最近 7 天

DATE=$(date +%Y%m%d)                                     # 今天日期，如 20261029
BAK_FILE="$BACKUP_DIR/$(basename $SRC)_${DATE}.tar.gz"   # 文件名：shell-learn_20261029.tar.gz
# basename 只留路径最后一段（/root/shell-learn -> shell-learn），文件名干净

mkdir -p "$BACKUP_DIR"                                   # 确保金库存在（-p：已存在也不报错）

tar -czf "$BAK_FILE" "$SRC"
# 第 1 步打包。c=create，z=gzip 压缩，f=指定文件名（f 必须放最后，要"抱住"文件名）

if [ $? -eq 0 -a -s "$BAK_FILE" ]; then
    # 第 2 步校验。$? 是 tar 刚才的退出码（0=成功）；-a 是逻辑与；-s 确保文件大于 0 字节
    size=$(du -sh "$BAK_FILE" | cut -f1)                 # 查大小（如 24K），cut 取第一列
    echo "$(date '+%F %T') [INFO] 备份成功：$BAK_FILE ($size)" | tee -a "$LOG"
else
    echo "$(date '+%F %T') [ERROR] 备份失败或文件异常，请检查 $SRC" | tee -a "$LOG"
    exit 1                                               # 失败退场，让调用方（明天的定时任务）能感知
fi

find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
# 第 3 步清理旧备份。+7 = 早于 7 天；-delete 删除查到的（只匹配 .tar.gz，不误伤）
echo "$(date '+%F %T') [INFO] 已清理 ${KEEP_DAYS} 天前的旧备份" | tee -a "$LOG"
```

新面孔：**`date +%Y%m%d`** 出 `20261029`、**`date '+%F %T'`** 出 `2026-10-29 14:23:05`（引号防 Shell 添乱）——文件名带日期，才能每天一份、永不覆盖；**`tee -a 文件`** 两路输出，屏幕打一句、日志追加一句；**`find 目录 -name "*.tar.gz" -mtime +7 -delete`** 是生产清理旧文件的标准姿势（日志切割同款）。

### ✅ 怎么算成功

```bash
chmod +x mybackup.sh
./mybackup.sh
ls -lh ~/backups/
tail -2 ~/backups/backup.log
```

预期输出（日期、大小以你的机器为准，关键字是"备份成功"）：

```text
tar: Removing leading '/' from member names
2026-10-29 15:41:02 [INFO] 备份成功：/root/backups/shell-learn_20261029.tar.gz (24K)
2026-10-29 15:41:02 [INFO] 已清理 7 天前的旧备份
```

❗【易错】`tar: Removing leading '/' from member names` **不是报错**！是 tar 提示"打包时去掉了开头斜杠"以防解包覆盖原文件，无视它。`ls -lh` 里应能看到 `shell-learn_20261029.tar.gz`。

**压轴戏：亲眼看清理生效。** 不想干等 7 天，伪造一个"上周的旧备份"：

```bash
touch -d "2026-10-20" ~/backups/shell-learn_20261020.tar.gz   # -d：把文件的修改时间改成指定日期
./mybackup.sh          # 再跑一次脚本
ls -l ~/backups/       # 旧货被自动清掉了
```

```text
-rw-r--r--. 1 root root     0 Oct 20 00:00 shell-learn_20261020.tar.gz
-rw-r--r--. 1 root root 24368 Oct 29 15:43 shell-learn_20261029.tar.gz
（重跑 ./mybackup.sh 之后）
-rw-r--r--. 1 root root 24368 Oct 29 15:43 shell-learn_20261029.tar.gz
```

假旧备份自动消失、今天的还在——**"磁盘不被备份吃光"**，就是这么实现的。

### 🩹 如果不对

1. **`tar: Cannot open: No such file or directory`**：备份目录没建成，或变量名敲错。`mkdir -p ~/backups` 补一发，再检查 `BACKUP_DIR` 拼写。
2. **`find: paths must precede expression`**：find 参数顺序乱了，或 `-name "*.tar.gz"` 忘了给通配符套双引号（不套会被 Shell 先展开，必坑）。
3. **日志里没有新行**：用了 `>` 覆盖而不是 `tee -a` 追加。`>` 是"每次重写"，`>>` 是"往后追加"。
4. **备份文件 0 字节却报成功**：`-s` 那个判断写漏了，照原文补全。非 root 跑不了就把 `SRC`、`BACKUP_DIR` 换成自己家目录路径。

## 实验七：定时任务 + 调试——让脚本每天自己跑，出事自己查

### 🎯 目标

到此为止每个脚本都得**人敲一下**才跑。运维要睡觉，凌晨 2 点谁来点备份？答案：**crontab 定时任务**，让机器深夜自己干活。再学两个保命技：`bash -x` 把执行过程一步步直播出来（排错神器）、`bash -n` 只查语法不执行（上线前体检）。从此你的脚本才真正算"无人值守自动化"。

### 📍 在哪动手

- 定时任务不是文件，是**系统里的任务清单**，用 `crontab -e` 打开编辑；调试直接在终端做，不用新文件。
- 前提：管定时任务的"闹钟服务" crond 得在跑，验证：`systemctl is-active crond` 应打印 `active`（正好用实验五的思路）。

### 🔧 动手做

**第 1 部分：把备份脚本挂上闹钟。**

```bash
crontab -e
```

按 `i` 进入编辑，加一行（❗**路径必须是绝对路径**，定时任务不认识"当前目录"）：

```text
0 2 * * * /root/shell-learn/mybackup.sh
```

五个格子从左到右，口诀：**分 时 日 月 周**——`0 2 * * *` 就是每天凌晨 2 点；`*` 表示"每"，五颗星就是每分钟。保存（`Esc` + `:wq`）后用 `crontab -l` 确认能看到这行。

等到凌晨 2 点验证太慢，新手友好做法：**临时加一条"每分钟跑一次"的测试任务**当场抓现行，验完删掉：

```text
* * * * * /root/shell-learn/mybackup.sh
```

保存后最多等一分钟，翻日志看有没有"新账"：

```bash
tail -2 ~/backups/backup.log
```

预期输出（关键字：时间戳是**刚刚那一分钟**）：

```text
2026-10-29 16:08:01 [INFO] 备份成功：/root/backups/shell-learn_20261029.tar.gz (24K)
2026-10-29 16:08:01 [INFO] 已清理 7 天前的旧备份
```

机器自己干活了！验完 `crontab -e` 把测试行删掉，只留 `0 2 * * *` 正式版。

**第 2 部分：调试两板斧。**

```bash
bash -n mybackup.sh     # 只查语法不执行；什么都没输出 = 语法没毛病
bash -x mybackup.sh     # 执行并直播每一步
```

`-x` 模式下，每条真正执行的命令都以 `+` 开头打印出来（变量已展开成真值），节选：

```text
+ DATE=20261029
+ BAK_FILE=/root/backups/shell-learn_20261029.tar.gz
+ tar -czf /root/backups/shell-learn_20261029.tar.gz /root/shell-learn
+ '[' 0 -eq 0 ']'
```

以后凡是脚本行为诡异，先 `bash -x` 跑一遍找"从哪一步开始不对"；也可在脚本里加 `set -x`（开始直播）、`set +x`（关闭直播）精确调试某一段。**顺手学两个保命咒语**（写到长脚本开头）：

```bash
set -e    # 任何命令失败立刻退出，不把错误越滚越远
set -u    # 用了未定义的变量立刻报错，专治变量名敲错
```

### ✅ 怎么算成功

1. `crontab -l` 能看到正式任务 `0 2 * * * /root/shell-learn/mybackup.sh`；
2. 加"每分钟"测试任务后，backup.log 出现**当分钟**的新记录（定时链路已通）；
3. `bash -n` 无任何输出（语法零问题）、`bash -x` 能看到一串 `+` 开头的执行轨迹并正常收尾。

### 🩹 如果不对

1. **定时任务死活不跑**：按顺序查四件事——① `systemctl is-active crond` 是不是 active；② `crontab -l` 有没有保存成功；③ 任务里的脚本路径是不是绝对路径、敲对了没；④ 脚本 `chmod +x` 了没。
2. **日志或邮件里发现 `Permission denied`**：定时任务同样受权限管，忘了 `chmod +x`。
3. **脚本手动跑正常、定时跑找不到命令**：定时任务的环境变量 `PATH` 很瘦，把脚本里非常规路径的命令写成绝对路径（如 `/usr/local/bin/xxx`）最稳。
4. **`bash -n` 报 `unexpected end of file`**：十有八九漏了 `fi` 或 `done`，按报错行号往上找。vi 里改 crontab 手忙脚乱就默念三步诀：`i` → 改 → `Esc` + `:wq`。

## 收尾：你现在会了什么

过一遍这七关攒下的家底：

- **会写会跑**：shebang、`chmod +x`、三种运行方式（`./`、`bash`、`sh`）的门道；
- **会玩变量**：定义规矩（等号不留空格）、`$` 与 `${}`、`$( )` 命令替换，以及三种引号——单引号死板全照抄、双引号机灵认变量、反引号先跑再交——Shell 第一大坑已踩平；
- **会让脚本看情况**：`[ ]` 三类判断（字符串/数字/文件）、`if/elif/else`、`$?` 退出码；
- **会甩重复劳动**：for 循环一把扫全网段；
- **会打包复用**：函数、`$1` 传参、`local` 私有变量，一条命令体检一批服务；
- **会造真工具**：日期命名打包、大小校验、超 7 天自动清理、写日志的生产级备份脚本；
- **会无人值守 + 自我排错**：crontab 定时、`bash -x` 直播执行、`bash -n` 上线体检、`set -e/-u` 保险。

**下一步怎么走**：把实验五的服务名单换成你公司真实的关键服务，就是现成的巡检小工具；再把 `mybackup.sh` 的 `SRC` 指向 `/etc`（需要 root）备份系统配置——这两步走完，你的脚本已经在生产机上了。

## 生产速查（收藏区）

本篇语法全家福 + 运维最常抄的模板，要用回来翻这。三条铁律先立此存照：变量永远套双引号 `"$var"`；长脚本开头加 `set -e`；脚本写完先 `bash -n` 再跑。

### 变量速查

| 类别 | 说明 | 写法 |
|---|---|---|
| 普通变量 | 当前脚本内有效 | `name="xxx"` |
| 环境变量 | 可被子进程继承 | `export PATH=/usr/local/bin:$PATH` |
| 位置参数 | 运行时传入 | `"$1"`、`"$2"` … `"$9"` |

特殊变量（面试高频）与算术运算：

```bash
$0     # 脚本文件名本身
$1-$9  # 第 1 到第 9 个位置参数
$#     # 位置参数的个数
$*     # 所有参数（粘成一整个字符串，"一锅端"）
$@     # 所有参数（彼此独立，"各算各的"，循环里用它）
$?     # 上一条命令的退出码（0=成功，非 0=失败）
$$     # 当前脚本的进程号 PID（常用于生成临时文件名）

echo $((a + b))    # 算术：30，推荐写法
let c=a+b          # let 命令也能算
```

### 条件测试速查 ⚠️【必考】

```bash
# 三种等价形式：test、[ ]、增强版 [[ ]]（推荐）；[ ] 括号内侧必须有空格！
[ -f /etc/passwd ]

# 文件判断
[ -f 文件 ]   # 是普通文件     [ -d 目录 ]   # 是目录
[ -e 路径 ]   # 存在          [ -s 文件 ]   # 存在且非空（大小 > 0）
[ -r 文件 ]   # 可读          [ -w 文件 ]   # 可写
[ -x 文件 ]   # 可执行

# 数值比较（e=equal，n=not，g=greater，l=less）
[ $a -eq $b ]   # 等于      [ $a -ne $b ]   # 不等于
[ $a -gt $b ]   # 大于      [ $a -ge $b ]   # 大于等于
[ $a -lt $b ]   # 小于      [ $a -le $b ]   # 小于等于

# 字符串判断
[ "$s1" = "$s2" ]   # 相等        [ "$s1" != "$s2" ]  # 不相等
[ -z "$s" ]         # 为空         [ -n "$s" ]         # 非空

# 逻辑运算
[ $a -gt 1 -a $a -lt 10 ]      # -a=与，-o=或，!=非（单层括号内）
[[ $a -gt 1 && $a -lt 10 ]]    # 增强括号内直接用 && || ！
```

### case 模板（服务脚本的"标准动作"）

```bash
case "$1" in
  start)   echo "启动服务"   ;;
  stop)    echo "停止服务"   ;;
  restart) echo "重启服务"   ;;
  *)       echo "用法: $0 {start|stop|restart}" ;;
esac
```

（if 多分支模板：实验三的 `if/elif/else/fi` 就是完整范式，照抄即可。）

### 循环速查

```bash
for i in 1 2 3 4 5; do echo "数字: $i"; done          # for：遍历写死的列表
for f in /etc/*.conf; do echo "配置文件: $f"; done     # for：遍历文件（通配符）
for ((i=1; i<=10; i++)); do echo $i; done              # for：C 语言风格

i=1
while [ $i -le 5 ]; do      # while：条件成立就一直转
    echo "第 $i 次"
    i=$((i + 1))
done

break       # 直接跳出整个循环
continue    # 跳过本轮，进入下一轮
```

### 函数速查

```bash
function log_info() {    # 定义写法一：带 function 关键字
    echo "[INFO] $1"
}
log_warn() {             # 定义写法二：短小精悍（两种都合法）
    echo "[WARN] $1"
}
log_info "系统启动正常"   # 调用：不要括号，参数用空格隔开
log_warn "磁盘空间不足"
```

四大要点：**先定义后调用**；参数用 `$1`/`$2`；`return` 返回状态码（0~255）、`echo` 返回文本（用 `result=$(函数名)` 接）；`local` 声明局部变量防污染全局。

### 一句话脚本小抄（运维亲测好用）

```bash
# 一键看系统状态（SSH 上去先敲这个）
echo "=== 系统信息 ==="; uname -a
echo "=== 磁盘使用 ==="; df -h | grep -v tmpfs
echo "=== 内存使用 ==="; free -h
echo "=== 负载 ==="; uptime

# 检查端口是否在监听
PORT=3306
if ss -tlnp | grep -q ":$PORT "; then
    echo "端口 $PORT 正在监听"
else
    echo "警告：端口 $PORT 未监听！"
fi

# 巡检日志里的错误关键字（超过 50 条就告警）
LOG="/var/log/nginx/error.log"
if [ -f "$LOG" ]; then
    count=$(grep -c "ERROR\|FATAL" "$LOG")
    echo "错误日志数量: $count"
    [ $count -gt 50 ] && echo "告警：错误日志过多！"
fi

# MySQL 数据库备份模板（❗生产别把密码明文写进脚本：密码另存文件并 chmod 600，
# 用 mysqldump --defaults-extra-file=密码文件 来读）
DB_USER="root"; DB_PASS="password"; DB_NAME="mydb"
BACKUP_DIR="/backup/mysql"; DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.sql
if [ $? -eq 0 ]; then
    echo "备份成功: $BACKUP_DIR/${DB_NAME}_${DATE}.sql"
else
    echo "备份失败！"
    exit 1
fi
```

### 调试速查

```bash
bash -x script.sh      # 逐条显示执行过程（排错第一神器）
bash -n script.sh      # 只查语法不执行（上线前体检）
```

> AI生成
