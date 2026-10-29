---
title: MySQL 运维从入门到生产实战
category: Linux进阶
tags:
  - Linux
  - MySQL
  - 数据库
---

# MySQL 运维实战：七次实验，从小白到能救场

> **这篇实验做完，你会亲手得到这些东西**：一台装好的 MySQL 8.0、一个自己建的"员工管理"库、一个权限受限的普通账号、一份能救命的备份文件、一次完整的事故恢复经历、一个实时同步的主从架构、一条亲手抓住又治好的慢 SQL。七个实验一条主线，后一个都踩在前一个的肩膀上。做完它们，MySQL 运维的骨架就长在你自己手上了——不用死背，全是肌肉记忆。

## 实验环境准备

先确认"装备"够不够，别做到一半发现电脑带不动：

| 项目 | 要求 | 说明 |
|---|---|---|
| 操作系统 | CentOS 7 虚拟机 1 台 | VMware / VirtualBox / 云主机都行 |
| 内存 | **2G 以上** | 1G 也能装但会卡；实验六开双实例建议 3G |
| 磁盘 | 空闲 10G 以上 | 装 MySQL 本体 + 数据 + 备份文件 |
| 网络 | 能访问外网 | 要用 yum 从 MySQL 官方源下载 |
| 第二台虚机（可选） | CentOS 7 ×2 | 实验六"主从"最直观；只有一台也能做，教程给了替代方案 |
| 登录身份 | root | 后面所有命令默认以 root 执行 |

开工前敲四条命令确认环境就绪（`#` 后面是预期输出，7.x 版本号略有差异都算正常）：

```bash
cat /etc/redhat-release
# CentOS Linux release 7.9.2009 (Core)   ← 7.x 都可以

free -h
# 看 Mem 行的 total，至少 2.0G

df -h /
# 看 Avail 列，至少 10G

ping -c 2 dev.mysql.com
# 应收到 64 bytes from ...  说明能访问 MySQL 官方下载源
```

❗【易错】本篇你会待在两种"界面"里，千万别搞混：

- **Linux 终端**（提示符是 `#` 或 `$`）：敲操作系统命令，如 `systemctl`、`mysqldump`
- **mysql 交互界面**（提示符是 `mysql>`）：敲 SQL，如 `CREATE`、`SELECT`，退出用 `EXIT;`

每个实验开头"📍 在哪动手"都会告诉你这次待在哪边。所有命令可以直接复制粘贴，不必手敲。

## 实验一：装上 MySQL 8.0——拿到属于你的第一个 `mysql>` 提示符

### 🎯 目标

让这台虚机跑起来一个 MySQL 8.0 服务，并用 root 账号成功登进去、把临时密码换成自己的。为什么要先做它：后面 6 个实验全部踩在这台库上；而且第一次装 MySQL，十有八九会被"临时密码"这关卡住，现在卡过一次，以后装第二台（实验六要用）就轻车熟路了。

### 📍 在哪动手

这台 CentOS 虚机的 **Linux 终端**（全程 root 身份），这一步还没进 mysql，敲的都是操作系统命令。MySQL 装好后配置文件在 `/etc/my.cnf`，数据目录在 `/var/lib/mysql`。

### 🔧 动手做

```bash
# 1. 安装 MySQL 官方 yum 源
#    为什么：CentOS 7 自带源里没有 MySQL 8.0，必须先装官方仓库包
#    （它做的事：往 /etc/yum.repos.d/ 放一个 mysql-community.repo 文件）
rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-11.noarch.rpm

# 2. 安装服务端（会自动带上客户端 mysql 命令）
yum -y install mysql-community-server

# 3. 启动 MySQL，并设置开机自启
#    第一次启动会自动初始化数据目录，多等几秒
systemctl start mysqld
systemctl enable mysqld

# 4. 从日志里捞出 root 临时密码
#    yum 安装首次启动时会生成一个随机 root 密码，打印在 /var/log/mysqld.log
grep 'temporary password' /var/log/mysqld.log
```

上面 grep 应该会吐出类似这样一行（冒号后面那串就是临时密码，抄下来）：

```
2026-10-29T10:15:32.512345Z 6 [Note] [MY-010454] [Server] A temporary password is generated for root@localhost: kK9+qwAb3!x
```

```bash
# 5. 用临时密码登录（密码一定要用一对单引号包住，防止特殊字符捣乱）
mysql -uroot -p'kK9+qwAb3!x'
```

登录进去以后，提示符会变成 `mysql>`。此时你几乎什么都不能干——必须先改密码：

```sql
-- 8.0 的规矩：不改密码，执行任何 SQL 都会被拒
-- （如果先执行 SHOW DATABASES，会报 ERROR 1820: You must reset your password ...）
-- 密码口诀：八位起步，大小写、数字、特殊字符全都要有
ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNew@Pass123';

-- 改完密码，第一次看库里的世界
SHOW DATABASES;

-- 退出客户端，回到 Linux 终端
EXIT;
```

### ✅ 怎么算成功

第一步先确认服务活着：

```bash
systemctl status mysqld
# 应包含这一行（按 q 退出查看界面）：
#   Active: active (running)
```

然后看版本：

```bash
mysql -V
# 应包含关键字：Ver 8.0.xx for Linux on x86_64（MySQL Community Server）
```

**看到 `mysql>` 提示符，这一关就算通关**。登录成功时屏幕上会出现：

```
Welcome to the MySQL monitor.  Commands end with ; or \g.
...
mysql>
```

（前面那行 `mysql: [Warning] Using a password on the command line interface can be insecure.` 是提醒你命令行明文传密码，属正常提示。）

`SHOW DATABASES` 预期输出——一台新库只有 4 个系统库：

```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
4 rows in set (0.00 sec)
```

### 🩹 如果不对

报错 1：

```
ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: YES)
```

原因：临时密码抄错了（注意区分大小写和形近字符 0/O、1/l），或者密码含特殊字符没加单引号。解决：重新执行 grep，密码用一对单引号包住再登录。如果 grep 什么都没吐出来，就用 `tail -50 /var/log/mysqld.log` 直接翻日志找；日志里若显示初始化失败，最常见原因是虚机内存太小，加内存后 `systemctl restart mysqld` 再试。

报错 2：

```
ERROR 1819 (HY000): Your password does not satisfy the current policy requirements
```

原因：新密码太简单。8.0 默认密码策略要求至少 8 位且含大写、小写、数字、特殊字符。解决：按口诀编一个，比如 `MyNew@Pass123`。密码策略的查看与调整见生产速查 4；root 密码彻底忘了怎么办见生产速查 3。

## 实验二：建一个"员工管理"库——亲手养出第一批数据

### 🎯 目标

建一个练习库 `empdb`，里面建一张员工表 `employees`，把生产中最常用的四种表约束（主键、非空、默认值、唯一）亲手用一遍，插入 5 条数据并用 `SELECT` 看见它们。为什么要做它：数据库里最贵的是数据，约束就是数据的第一道保险；更重要的是，后面实验四备份、实验五误删恢复、实验六主从、实验七慢查询，全都要用这张表当"受害者"和"受益者"。

### 📍 在哪动手

这台虚机的 **mysql 交互界面**（`mysql>` 提示符里），用 root 登录进入（`mysql -uroot -p`）。本实验全程敲 SQL，注意每条 SQL 以分号结尾。

### 🔧 动手做

```sql
-- 1. 建库：生产统一 utf8mb4（能存 emoji 和生僻字；5.7 时代的 utf8 是残缺三字节的，坑过无数人）
CREATE DATABASE empdb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 2. 进入这个库，之后所有 SQL 默认都作用在 empdb 上
USE empdb;

-- 3. 建员工表：一张表把四种约束看全，注释逐个讲清
CREATE TABLE employees (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '工号：主键约束=全表唯一+非空，AUTO_INCREMENT=不填自动+1',
  name       VARCHAR(50)   NOT NULL   COMMENT '姓名：非空约束，不填直接报错',
  phone      VARCHAR(20)   UNIQUE     COMMENT '手机号：唯一约束，重复插入会被拦下',
  dept       VARCHAR(30)   NOT NULL DEFAULT '运维部' COMMENT '部门：默认值约束，不填自动补"运维部"',
  salary     DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '工资：DECIMAL 精确到分，绝不丢零头',
  hire_date  DATE          NOT NULL   COMMENT '入职日期：非空且无默认值，必须手填',
  created_at DATETIME      DEFAULT CURRENT_TIMESTAMP COMMENT '建档时间：自动填"现在"'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='员工表';

-- 4. 插 4 条数据（一次 INSERT 多行，注意列名和值的顺序一一对应）
INSERT INTO employees (name, phone, dept, salary, hire_date) VALUES
('张伟', '13800000001', '网络部',  8000.00, '2024-03-01'),
('王芳', '13800000002', '网络部',  9500.00, '2023-07-15'),
('李强', '13800000003', '信创组', 11000.00, '2022-11-20'),
('赵敏', '13800000004', '安全部', 12500.00, '2021-06-01');

-- 5. 再单独插一条，故意不写 dept 列，验证默认值会不会自动补上
INSERT INTO employees (name, phone, salary, hire_date)
VALUES ('陈晨', '13800000005', 10500.00, '2024-08-01');

-- 6. 查看全部数据——看见自己的数据，数据库才算"活的"
SELECT * FROM employees;
```

接着练改和删（这两类操作天生危险，规矩先立好）：

```sql
-- 7. 改：只给张伟涨薪
UPDATE employees SET salary = 12000.00 WHERE name = '张伟';

-- 8. 删：带 WHERE 只删一行，删完马上补回来
DELETE FROM employees WHERE id = 5;
SELECT COUNT(*) FROM employees;      -- 变成 4 行

INSERT INTO employees (name, phone, salary, hire_date)
VALUES ('陈晨', '13800000005', 10500.00, '2024-08-01');   -- 补回来
SELECT COUNT(*) FROM employees;      -- 又回到 5 行；注意新行 id 是 6 不是 5——自增号用掉就不回收，属正常现象
```

> ❗【易错】生产红线：`UPDATE` / `DELETE` 不带 `WHERE` 会对**全表**生效——全公司工资一秒变 12000。规矩是：批量改数前，先用同条件的 `SELECT` 数一遍行数，确认只影响该影响的那几行；大表操作必须走变更审批。

再练"改表"——生产上给表加列、删列都用它（注意区分：`DELETE` 删的是**行**，`DROP` 删的是**列或整个表**）：

```sql
-- 9. 加一列"绩效分"（有默认值，老数据自动补 0，不用改历史行）
ALTER TABLE employees ADD COLUMN perf_score DECIMAL(5,2) DEFAULT 0 COMMENT '绩效分';
SELECT * FROM employees LIMIT 1;      -- 多出了 perf_score 列

-- 10. 删掉这一列（练习完删干净，恢复原状）
ALTER TABLE employees DROP COLUMN perf_score;
```

> 顺带立个规矩：`DROP TABLE` / `DROP DATABASE` 属于"核按钮"级操作——整表、整库瞬间蒸发。执行前必须先备份、走变更审批（实验五你会亲身体验一次 `DROP TABLE` 的威力）。另外改表结构还常用 `SHOW CREATE TABLE` 先看当前定义，改完再核对一遍。

最后认识三个最常用的"查看"命令：

```sql
SHOW DATABASES;                  -- 现在列表里多了 empdb
SHOW TABLES;                      -- empdb 里有 employees
SHOW CREATE TABLE employees\G     -- 看这张表的"出生证明"，所有约束都在里面（\G 表示竖着排版）
```

### ✅ 怎么算成功

`SELECT * FROM employees;` 预期输出（created_at 列显示你插入数据的那个时刻，id 和行序一致即可）：

```
+----+--------+-------------+-----------+----------+------------+---------------------+
| id | name   | phone       | dept      | salary   | hire_date  | created_at          |
+----+--------+-------------+-----------+----------+------------+---------------------+
|  1 | 张伟   | 13800000001 | 网络部    | 12000.00 | 2024-03-01 | 2026-10-29 10:40:12 |
|  2 | 王芳   | 13800000002 | 网络部    |  9500.00 | 2023-07-15 | 2026-10-29 10:40:12 |
|  3 | 李强   | 13800000003 | 信创组    | 11000.00 | 2022-11-20 | 2026-10-29 10:40:12 |
|  4 | 赵敏   | 13800000004 | 安全身    | 12500.00 | 2021-06-01 | 2026-10-29 10:40:12 |
|  6 | 陈晨   | 13800000005 | 运维部    | 10500.00 | 2024-08-01 | 2026-10-29 10:40:35 |
+----+--------+-------------+-----------+----------+------------+---------------------+
5 rows in set (0.00 sec)
```

两个细节验证约束在干活：陈晨那行 **dept 是"运维部"**（默认值生效）、**created_at 有值**（自动填时间）。`SHOW CREATE TABLE employees\G` 应包含 `AUTO_INCREMENT`、`PRIMARY KEY`、`UNIQUE KEY`、`DEFAULT '运维部'` 这些关键字。

### 🩹 如果不对

报错 1：

```
ERROR 1364 (HY000): Field 'hire_date' doesn't have a default value
```

原因：INSERT 漏填了"非空且无默认值"的列。解决：把缺的列补上；或者建表时就给这类列配 DEFAULT。

报错 2：

```
ERROR 1062 (23000): Duplicate entry '13800000001' for key 'employees.phone'
```

原因：唯一约束/主键撞车了——手机号重复（主键重复时报 `for key 'PRIMARY'`）。解决：这不是故障，是约束在保护你，检查数据后改正。

## 实验三：给开发同事开个账号——亲手试出权限的边界

### 🎯 目标

模拟真实生产分工：你（运维/DBA）拿 root，开发同事只该拿一个受限账号。建一个只能对 empdb 做增删改查的账号 `appuser`，然后"换人"用它的身份登录，逐条试出"哪些能干、哪些会被数据库拒之门外"。为什么要做它：生产上 99% 的数据事故和"开发直连 root"有关；而且 8.0 建用户的语法和 5.7 不同，是面试和软考的高频考点。⚠️【必考】

### 📍 在哪动手

建号授权在**你现在的这个 root 的 `mysql>` 里**；验证要"换人"——**再开一个终端窗口**（同一台虚机再开一个 SSH/XShell 标签即可；有两台虚机的可以从另一台连过来，本实验两种都行），在那个新窗口里用 appuser 登录。两个窗口一个 root 一个 appuser，别敲串了。

### 🔧 动手做

先在 root 的 mysql> 里建号、授权：

```sql
-- 1. 建用户。⚠️【必考】8.0 必须先 CREATE USER 再 GRANT 两步走；
--    5.7 允许 GRANT 时隐式建号，8.0 直接报错
-- '@' 后面的部分叫 host，意思是"允许他从哪里连进来"：
--    localhost = 只许本机；192.168.1.% = 只许这个网段；% = 哪里都行（练习图方便，生产有风险）
CREATE USER 'appuser'@'%' IDENTIFIED BY 'App@Pass123';

-- 2. 授权：只给 empdb 这一个库的四种权限，* 表示 empdb 下所有表
--    原则口诀：最小权限 + 最窄网段
GRANT SELECT, INSERT, UPDATE, DELETE ON empdb.* TO 'appuser'@'%';

-- 3. 白纸黑字查权限（第一行 GRANT USAGE 的意思是"除了能登录，其他啥都不能干"的占位）
SHOW GRANTS FOR 'appuser'@'%';
```

> 顺带说清 `FLUSH PRIVILEGES`：8.0 里 CREATE USER / GRANT 会自动生效，一般用不着它；只有在手工改 `mysql` 库权限表或特殊场景下才需要。另外账号回收的两条命令（本实验不用执行，记住即可）：`REVOKE INSERT, UPDATE, DELETE ON empdb.* FROM 'appuser'@'%';`（收权）、`DROP USER 'appuser'@'%';`（删号）。

换人验证——**切到新开的终端窗口**，这是 Linux 终端：

```bash
# 用 appuser 身份连库
# 注意 -h127.0.0.1：写 127.0.0.1 强制走网络（TCP）；不写 -h 或写 localhost 会走本机 socket，
# 连接来源的判定方式不同，初学者最容易栽在这里
mysql -uappuser -p -h127.0.0.1 -P3306
```

进去以后（现在是 appuser 的 mysql>），把权限边界逐条试出来：

```sql
-- 能干的 1：进 empdb（对它有权限，USE 是允许的）
USE empdb;
SELECT * FROM employees;             -- 能查，5 行数据正常出来

-- 能干的 2：插入一条数据（后面实验还要用它）
INSERT INTO employees (name, phone, salary, hire_date)
VALUES ('刘洋', '13800000006', 9800.00, '2025-02-10');

-- 不能干的 1：想看系统库 mysql？拒绝
USE mysql;

-- 不能干的 2：想删表？拒绝
DROP TABLE empdb.employees;

-- 不能干的 3：想建新库？拒绝
CREATE DATABASE testdb;
```

> 生产原则：root 禁止配 `'%'`（任意来源远程）；应用账号按最小权限授权、按最小网段放开。练习机上图省事用 `%` 没问题，上生产要收敛成 `192.168.10.%` 这种网段写法。

### ✅ 怎么算成功

root 视角 `SHOW GRANTS FOR 'appuser'@'%';` 预期输出应包含：

```
| GRANT SELECT, INSERT, UPDATE, DELETE ON `empdb`.* TO `appuser`@`%` |
```

appuser 视角：`SELECT` 正常出数据，INSERT 成功（`Query OK, 1 row affected`）；三条越权操作应分别报错（报错里 user@host 的 host 部分显示的是你的连接来源，可能是 localhost 或 127.0.0.1）：

```
USE mysql;
ERROR 1044 (42000): Access denied for user 'appuser'@'localhost' to database 'mysql'

DROP TABLE empdb.employees;
ERROR 1142 (42000): DROP command denied to user 'appuser'@'localhost' for table 'employees'

CREATE DATABASE testdb;
ERROR 1044 (42000): Access denied for user 'appuser'@'localhost' to database 'testdb'
```

看到"能干的都成了、不能干的全被拦"，权限边界就试明白了。

### 🩹 如果不对

报错 1：

```
ERROR 1130 (HY000): Host '192.168.1.20' is not allowed to connect to this MySQL server
```

原因：你授权的 host 和连接来源对不上——比如只授了 `localhost`，却从另一台虚机连过来。解决：给对应来源重新授权（练习环境就用 `%`；生产收敛到网段）。密码输错则是另一个老朋友 `ERROR 1045`，回实验一的🩹复习。

报错 2（两台虚机做实验时常见）：

```
ERROR 2003 (HY000): Can't connect to MySQL server on '192.168.1.10:3306' (111)
```

原因：压根没连到 MySQL——最常见是目标机器防火墙没放行 3306 端口。解决：在 MySQL 所在的那台机器上执行：

```bash
firewall-cmd --add-port=3306/tcp --permanent
firewall-cmd --reload
```

## 实验四：备份——给数据库拍一张"全家福"

### 🎯 目标

用 mysqldump 把 empdb（单库）和整台数据库（全库）都导出成文件，存进安全目录，然后打开文件亲眼看——你会发现所谓"备份"就是一份 SQL 脚本。为什么要做它：下一个实验就要靠这份文件救命。备份是运维的底线能力，记住一句话：**没验证过恢复的备份，等于没备份**。

### 📍 在哪动手

**Linux 终端**（注意！mysqldump 是操作系统命令，不是在 `mysql>` 里敲）。这台虚机，备份文件统一放 `/root/bak/`。

### 🔧 动手做

```bash
# 1. 建一个备份目录
mkdir -p /root/bak

# 2. 单库备份：把 empdb 导成明文 SQL 文件
#    --single-transaction：InnoDB 一致性快照，备份全程不锁表（生产必加）
mysqldump -uroot -p --single-transaction empdb > /root/bak/empdb.sql

# 3. 全库备份：-A 表示所有库；
#    --triggers --routines --events：把触发器、存储过程、定时事件一起带走；
#    --master-data=2：在文件头注释里记下备份时刻的 binlog 位点
#    （以后搭主从、做时间点恢复全靠它）；
#    | gzip：压缩，全库文件不小，能省约 80% 空间
mysqldump -uroot -p -A --single-transaction \
  --triggers --routines --events --master-data=2 \
  | gzip > /root/bak/all_$(date +%F).sql.gz

# 4. 看看成果
ls -lh /root/bak/

# 5. 打开备份文件，亲眼确认"备份 = 一堆 SQL"
head -30 /root/bak/empdb.sql               # 文件头：版本信息和注释
grep 'CREATE TABLE' /root/bak/empdb.sql     # 建表语句在里面
grep -c 'INSERT INTO' /root/bak/empdb.sql   # 数一数有几张表的数据在里面

# 6. 校验压缩包完好（无输出就是通过）
gunzip -t /root/bak/all_$(date +%F).sql.gz && echo "备份文件完好"
```

看懂备份文件的本质，你就看懂了恢复的原理：这份文件就是**完整的重建说明书**——`CREATE TABLE` 负责把房子盖起来，`INSERT INTO` 负责把家具一件件搬回去。所谓恢复，就是让 MySQL 把这份说明书原样再执行一遍。

> ❗【易错】管道坑：如果第 3 步密码输错，mysqldump 会失败，但 `| gzip` 仍会生成一个坏掉的 gz 文件躺在那里。所以备份完必须做第 6 步校验，重要库还要定期做恢复演练（实验五就是）。

### ✅ 怎么算成功

`ls -lh /root/bak/` 应包含两个文件（大小仅供参考）：

```
-rw-r--r-- 1 root root 4.3K 10月 29 11:02 empdb.sql
-rw-r--r-- 1 root root 306K 10月 29 11:03 all_2026-10-29.sql.gz
```

`head -30 /root/bak/empdb.sql` 应包含关键字 `MySQL dump 10.13`、`Distrib 8.0.xx`；`grep 'CREATE TABLE'` 应看到 `CREATE TABLE `employees``；`grep -c 'INSERT INTO'` 输出一个大于等于 1 的数字（empdb 只有 employees 一张表，正常是 1）。校验命令应输出"备份文件完好"。

### 🩹 如果不对

报错 1：

```
mysqldump: Got error: 1045: Access denied for user 'root'@'localhost' (using password: YES)
```

原因：密码输错。危险在于管道照样生成了坏的 gz 文件——**空文件/残缺文件也是"文件"**，不校验根本发现不了。解决：重新备份 + 校验。

报错 2：`empdb.sql` 是 0 字节。原因：往上翻终端，多半是上面那个 1045 密码错，或者 MySQL 没在运行（先 `systemctl status mysqld` 确认）。解决：对症处理后重新导出，并检查文件大小非零。

## 实验五：事故现场！误删一张表，亲手把它救回来

### 🎯 目标

全篇的高潮。亲历一次生产事故并亲手救回：误把 employees 表 DROP 掉，用实验四的备份恢复，验证数据一条不少。为什么要做它：做完这一场，你会获得"出了事故不慌"的底气——这是运维岗最值钱的能力；而且它是前四个实验的毕业考试：库是你建的、账号权限你懂、备份是你拍的，现在只差按下"恢复"键。

### 📍 在哪动手

**"闯祸"和"验收"在 `mysql>` 里，"救援"在 Linux 终端**，两头切换。建议找个整块时间，把自己代入角色——你现在就是值班运维。

### 🔧 动手做

> **现场还原**：周五 17:40，你在清理一张没用的测试表，本来要删的是别的表——手快敲错，回车一响，empdb.employees 没了。这是全公司的员工数据表。此刻你的救星只有一个：实验四拍的备份。

```sql
-- ── 第 1 步：事故发生 ──
USE empdb;
DROP TABLE employees;          -- ！！！就是这一下

SELECT * FROM employees;
-- ERROR 1146 (42S02): Table 'empdb.employees' doesn't exist
```

深呼吸。救援心法四步，口诀：**停应用、保现场、先全量、再回放**。本实验的练习机上没有应用在写库，第一、二步简化为"确认没有新写入"；"再回放"指用 binlog 把备份之后的变更补齐，属于进阶操作，放在生产速查 5。现在直接执行第三步：

```bash
# ── 第 2 步：确认备份还躺在那里（这就是它存在的意义）──
ls -lh /root/bak/

# ── 第 3 步：恢复！把备份文件里的 SQL 重新执行一遍 ──
# 注意命令里两处细节：
#   empdb   —— 指定导回到哪个库（❗重要，见本实验末尾的坑）
#   < 文件  —— 重定向符，意思是"把文件内容灌进 mysql"
mysql -uroot -p empdb < /root/bak/empdb.sql
```

```sql
-- ── 第 4 步：验收 ──
USE empdb;
SELECT COUNT(*) FROM employees;          -- 行数回来了
SELECT * FROM employees ORDER BY id;    -- 数据全在
```

一个必须知道的残酷真相：**恢复的只是"备份那一刻"的数据**。备份之后、事故之前新写入的行，全量恢复救不回来——生产上要靠 binlog 回放补齐（速查 5 的"时间点恢复"就是干这个的）。这也解释了生产备份的铁律：**每天全量备份 + binlog 实时保留 = 可恢复到任意时间点**。另外，别让这次演练变成一次性记忆：**每月至少做一次恢复演练**，把备份恢复到测试库，确认能起来、能查数。

### ✅ 怎么算成功

`SELECT COUNT(*) FROM employees;` 预期输出——6 行数据一条不少（含实验三 appuser 插入的刘洋，因为备份发生在它之后）：

```
+----------+
| COUNT(*) |
+----------+
|        6 |
+----------+
1 row in set (0.00 sec)
```

`SELECT * FROM employees ORDER BY id;` 应看到 6 行：张伟、王芳、李强、赵敏、陈晨、刘洋都在，工资、部门、入职日期分毫不差。事故时那句 `ERROR 1146 ... doesn't exist` 彻底消失。此刻你可以回头告诉领导：数据回来了，全部。

### 🩹 如果不对

报错 1：

```
ERROR 1046 (3D000): No database selected
```

原因：恢复命令里没写库名。❗【易错】不带 `--databases` 导出的单库备份文件里**没有** `CREATE DATABASE` 语句，导回去必须由你在命令行指定落到哪个库。解决：`mysql -uroot -p empdb < /root/bak/empdb.sql`，把 empdb 写上。

报错 2：恢复成功了，但"备份之后"新插的数据没了。这不是故障，是 mysqldump 全量恢复的天性：它只能回到备份时刻。解决：想要"恢复到任意时间点"，备份必须配 binlog 回放，见速查 5。

## 实验六：主从复制——给数据库配一个实时同步的"分身"

### 🎯 目标

搭一主一从：主库写数据，从库秒级同步出现同样的数据。为什么要做它：生产双保险的地基——主库挂了从库顶上（高可用）、读请求分给从库扛（读写分离）；同时主从原理（binlog + IO 线程 + SQL 线程）是软考和面试的必考概念。⚠️【必考】这一实验也有"数据自动长出来"的神奇体验：在主库 INSERT，切到从库 SELECT，数据已经在等你。

### 📍 在哪动手

**首选方案（两台虚机）**：主库 = 你一直在用的这台（下面按 192.168.1.10 写），从库 = 第二台 CentOS 7（按 192.168.1.11 写），从库要先照实验一装好 MySQL。两边都要改 `/etc/my.cnf` 文件并重启，再进各自的 `mysql>` 配复制。**只有一台虚机**：照本实验末尾"单机双实例"方案做，效果一样。口诀记住原理：**主库记账，IO 抄账，SQL 还账**。

```
主库                          从库
binlog（流水账）
   │
   └── IO 线程 ────────→ relay log（抄回家的账本）
                              │
                         SQL 线程（照账重做一遍）
                              ↓
                          从库数据同步
```

### 🔧 动手做

**第 1 步（主库）：开"流水账" + 招"抄账员"**

编辑 `/etc/my.cnf`，在 `[mysqld]` 段下加两行：

```ini
# 主库 /etc/my.cnf 的 [mysqld] 段
[mysqld]
server-id = 1          # 全局唯一编号，主从之间不许重复（相当于身份证号）
log-bin   = mysql-bin  # 开 binlog：8.0 默认已开启，显式写上最稳；主从的"流水账"
```

```bash
# 改配置文件必须重启才生效
systemctl restart mysqld

# 防火墙放行 3306，从库要连进来（同机双实例方案可跳过这步）
firewall-cmd --add-port=3306/tcp --permanent
firewall-cmd --reload
```

在主库的 `mysql>` 里建复制专用账号：

```sql
-- 复制账号只给 REPLICATION SLAVE 一种权限，并按网段授权（最小权限原则的活例子）
CREATE USER 'repl'@'192.168.1.%' IDENTIFIED BY 'Repl@Pass123';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'192.168.1.%';

-- 看当前"账本页码"，从库要从这一页开始抄——拿笔记下 File 和 Position！
SHOW MASTER STATUS;
```

预期输出（页码数字以你的机器为准）：

```
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000001 |      157 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
```

**第 2 步（主库）：把现有数据整体搬给从库**

```bash
# --master-data=2 会把"从哪一页开始抄"写进备份文件头部，从库不用手工找位点
mysqldump -uroot -p -A --single-transaction --master-data=2 > /tmp/all_init.sql

# 传到从库（会让你输从库 root 的 SSH 密码）
scp /tmp/all_init.sql root@192.168.1.11:/tmp/
```

**第 3 步（从库）：配身份、导数据、指主库**

编辑从库的 `/etc/my.cnf`（`[mysqld]` 段）：

```ini
[mysqld]
server-id = 2          # ❗【易错】必须和主库不同！两边一样，复制直接罢工
```

```bash
systemctl restart mysqld
# 把主库数据先灌进来（复制是"从现在开始同步"，之前的数据要靠这份全量铺底）
mysql -uroot -p < /tmp/all_init.sql
```

在从库的 `mysql>` 里指向主库：

```sql
-- 老语法写法（8.0.22+ 也有新写法 CHANGE REPLICATION SOURCE TO ... / START REPLICA，
-- 含义完全相同，生产环境 5.7/8.0 混用时可先记老语法）
CHANGE MASTER TO
  MASTER_HOST     = '192.168.1.10',      -- 主库 IP
  MASTER_USER     = 'repl',              -- 抄账员账号
  MASTER_PASSWORD = 'Repl@Pass123',
  MASTER_LOG_FILE = 'mysql-bin.000001',  -- 第 1 步 SHOW MASTER STATUS 记下的 File
  MASTER_LOG_POS  = 157;                 -- 第 1 步记下的 Position

START SLAVE;    -- 开抄！（此处出现 1 条 warning 是提示老语法弃用，正常）
```

**第 4 步：验收——主库写，从库到**

在**主库**的 `mysql>` 里插一条新数据：

```sql
INSERT INTO empdb.employees (name, phone, salary, hire_date)
VALUES ('孙俪', '13800000007', 13000.00, '2026-10-01');
```

切到**从库**的 `mysql>`，什么都不干，直接查：

```sql
SELECT * FROM empdb.employees WHERE name = '孙俪';   -- 数据自己长出来了！

-- 健康体检：\G 让结果竖着看
SHOW SLAVE STATUS\G
```

最后给从库上锁防误写（收尾一步）：

```sql
SET GLOBAL read_only = ON;          -- 普通账号在从库只读
SET GLOBAL super_read_only = ON;     -- 连有超级权限的账号也只读，双保险
```

想永久生效就把这两行写进从库 `/etc/my.cnf` 的 `[mysqld]` 段再 `systemctl restart mysqld`。

**替代方案：只有一台虚机？同机双实例（3306 当主、3307 当从）**

原理一模一样：第二个实例换端口、换数据目录、换配置文件，"两台机器"就变成了"一台机器上的两个 mysqld 进程"。

```bash
# 1. 给从实例安个新家
mkdir -p /data/mysql3307
chown -R mysql:mysql /data/mysql3307
cp /etc/my.cnf /etc/my3307.cnf      # 以主库配置为底稿
```

编辑 `/etc/my3307.cnf`，把 `[mysqld]` 段改成这几项（其余保持）：

```ini
[mysqld]
port      = 3307                     # 端口错开
server-id = 2                         # 编号错开
datadir   = /data/mysql3307           # 数据目录错开
socket    = /data/mysql3307/mysql.sock
log-error = /data/mysql3307/mysqld.log
```

```bash
# 2. 初始化并启动第二个实例（不注册 systemd，挂后台跑）
mysqld --defaults-file=/etc/my3307.cnf --initialize --user=mysql
nohup mysqld --defaults-file=/etc/my3307.cnf --user=mysql &

# 3. 3307 也有自己的临时密码，照实验一的流程改掉
grep 'temporary password' /data/mysql3307/mysqld.log
mysql -uroot -p -S /data/mysql3307/mysql.sock   # 连 3307 一律加 -S 指定 socket
```

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Slave@Pass123';
EXIT;
```

然后照抄主流程，只有三处不同：主库建复制账号时用 `%`（127.0.0.1 的连接来源经解析常被记成 localhost，练习机直接 `%` 最省心，生产别学）；从实例的 `CHANGE MASTER TO` 里 `MASTER_HOST` 写 `127.0.0.1` 并**加一行 `MASTER_PORT=3306`**；连接从实例的命令都带 `-S /data/mysql3307/mysql.sock`。想停掉 3307：`mysqladmin -uroot -p -S /data/mysql3307/mysql.sock shutdown`。

### ✅ 怎么算成功

从库（或 3307 实例）上 `SELECT * FROM empdb.employees WHERE name = '孙俪';` 预期输出：

```
+----+--------+-------------+-----------+----------+------------+
| id | name   | phone       | dept      | salary   | hire_date  |
+----+--------+-------------+-----------+----------+------------+
|  8 | 孙俪   | 13800000007 | 运维部    | 13000.00 | 2026-10-01 |
+----+--------+-------------+-----------+----------+------------+
1 row in set (0.00 sec)
```

`SHOW SLAVE STATUS\G` 的关键行——⚠️【必考】**两个 Yes 是主从健康的金标准**：

```
             Slave_IO_Running: Yes
            Slave_SQL_Running: Yes
        Seconds_Behind_Master: 0
```

同时 `Last_IO_Errno` / `Last_SQL_Errno` 应为 0。监控主从，盯的就是这几项。

### 🩹 如果不对

报错 1：`SHOW SLAVE STATUS\G` 里 `Slave_IO_Running: No`，`Last_IO_Error` 中出现 `1045` / `Access denied`。原因：复制账号密码错，或授权的 host 没覆盖从库来源 IP。解决：在从库上直接手工测试能不能进主库：

```bash
mysql -h192.168.1.10 -urepl -p    # 能进说明账号没问题；进不去就回主库查 GRANT
```

报错 2：`Last_IO_Error` 中出现 `Fatal error: The slave I/O thread stops because master and slave have equal MySQL server ids`。原因：两边 `server-id` 相同。❗【易错】改完 my.cnf 必须 `systemctl restart mysqld` 才生效，光改文件不重启是初学者最常见失误。解决：从库改成 2 并重启。若报的是 `Can't connect`/`(111)`，则是主库防火墙没放 3306，回本实验第 1 步补 firewall-cmd 两连。

## 实验七：慢查询初体验——亲手抓一条慢 SQL，再治好它

### 🎯 目标

让 MySQL 把"慢 SQL"自动记到小本本上：开慢日志 → 亲手造一条慢 SQL → 去日志里抓它现行 → 用 EXPLAIN 看它为什么慢（全表扫描）→ 加索引治好它。为什么要做它：数据库变慢十有八九是慢 SQL 惹的祸，"开慢日志 → 抓语句 → EXPLAIN → 加索引"是运维的标准排障组合拳，EXPLAIN 的 `type=ALL` 是面试软考双料考点。⚠️【必考】

### 📍 在哪动手

这台虚机。**开关慢日志**在 root 的 `mysql>` 里（这里用 `SET GLOBAL` 演示式开启，重启会失效；生产做法是写进 my.cnf，见速查 4）；**看日志文件**在 Linux 终端，文件位置在 `/var/lib/mysql/` 下。

### 🔧 动手做

```sql
-- 1. 打开慢日志开关，阈值设 2 秒（超过 2 秒的 SQL 才叫"慢"）
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 2;

-- 2. 确认开关状态，并记下 slow_query_log_file 的值——日志就写在那里
SHOW VARIABLES LIKE 'slow_query_log%';
SHOW VARIABLES LIKE 'long_query_time';
```

> ❗【易错】`SET GLOBAL` 只对"之后新连上的会话"生效，你当前这个 mysql> 仍拿着老阈值（默认 10 秒）。所以必须退出重连一次：

```sql
EXIT;
```

```bash
# 3. 重连，新阈值才带上
mysql -uroot -p
```

```sql
-- 4. 故意造一条慢 SQL：SLEEP(5) 就是让数据库睡 5 秒再回话
SELECT SLEEP(5);

EXIT;
```

```bash
# 5. 去慢日志抓现行（文件名一般是"主机名-slow.log"，用 $(hostname) 自动拼出来；
#    root 可直接读，普通用户加 sudo）
tail -20 /var/lib/mysql/$(hostname)-slow.log
```

抓到现行后，生产里语句多如牛毛，一条条看不过来，用 mysqldumpslow 聚合出最耗时的前几名：

```bash
mysqldumpslow -s t -t 5 /var/lib/mysql/$(hostname)-slow.log   # 按耗时取 TOP5
```

回到 `mysql>`，用 EXPLAIN 给慢 SQL"验伤"——看 MySQL 打算怎么执行它：

```sql
-- 6. 拿员工表试：按姓名查，name 上没建索引
EXPLAIN SELECT * FROM empdb.employees WHERE name = '张伟';
```

看懂输出的四个关键列（好坏对照）：

| 列 | 好的样子 | 坏的样子 |
|---|---|---|
| `type` | ref、range、const | **ALL（全表扫描，一行行翻）** |
| `key` | 走到的索引名 | NULL（没走索引） |
| `rows` | 越小越好 | 几十万上百万=严重缺索引 |
| `Extra` | Using index | Using filesort / Using temporary（要优化） |

```sql
-- 7. 对症下药：给 name 加索引，再验一次
ALTER TABLE empdb.employees ADD INDEX idx_name (name);

EXPLAIN SELECT * FROM empdb.employees WHERE name = '张伟';
```

### ✅ 怎么算成功

`SELECT SLEEP(5);` 预期输出（耗时 5 秒）：

```
+-----------+
| SLEEP(5)  |
+-----------+
|         0 |
+-----------+
1 row in set (5.00 sec)
```

`tail` 慢日志应包含关键字 `Query_time: 5.00` 和语句本体 `SELECT SLEEP(5)`，完整条目长这样（数字略有差异）：

```
# Time: 2026-10-29T11:30:45.123456+08:00
# User@Host: root[root] @ localhost []
# Query_time: 5.000291  Lock_time: 0.000000 Rows_sent: 1  Rows_examined: 0
SET timestamp=1779693045;
SELECT SLEEP(5);
```

第一次 EXPLAIN 应包含 `type` 列为 `ALL`、`key` 列为 `NULL`（示意，rows 为你的表行数）：

```
+----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+-------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | employees | NULL       | ALL  | NULL          | NULL | NULL    | NULL |    7 |    20.00 | Using where |
+----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+-------------+
```

加索引后第二次 EXPLAIN 应看到 `key` 列变成 `idx_name`，`type` 变成 `ref`。（练习表只有几行，优化器偶尔仍选全表扫，属正常；生产上百万行的表，索引前后是天壤之别。）

### 🩹 如果不对

问题 1：`SELECT SLEEP(5)` 明明跑够 5 秒，日志里却什么都没有。原因：老会话还是 10 秒的老阈值——`SET GLOBAL` 不影响已连接的会话。解决：`EXIT` 后重新 `mysql -uroot -p` 连进来再跑一次。

问题 2：`tail` 报没有那个文件。原因：日志文件路径和你猜的不一样。解决：用 `SHOW VARIABLES LIKE 'slow_query_log_file';` 看真实路径再 tail；另外确认 `slow_query_log` 确实是 ON。

## 收尾：你现在会了什么

七次实验走完，回头看看你亲手攒下的能力清单：

1. **装机上线**：yum 装 MySQL 8.0、捞临时密码、首次改密、服务自启——生产新机器交付的第一天你干的就是这些
2. **数据建模**：建库建表、四种约束（主键/非空/默认值/唯一）、增删改查、`UPDATE`/`DELETE` 必带 `WHERE` 的红线意识
3. **权限管理**：8.0 先 `CREATE USER` 再 `GRANT`、host 决定"谁能从哪连"、最小权限 + 最窄网段原则
4. **备份**：mysqldump 单库/全库、`--single-transaction` 不锁表、备份文件的本质就是 SQL 说明书、备份必须校验
5. **恢复**：误删救援四步法口诀——**停应用、保现场、先全量、再回放**——以及"每月一次恢复演练"的职业习惯
6. **主从复制**：**主库记账，IO 抄账，SQL 还账**；`CHANGE MASTER` 五要素；双 Yes 金标准；server-id 不能重复
7. **性能排障**：慢日志抓现行、EXPLAIN 四列验伤、`type=ALL` 就是全表扫描、缺索引就补索引

这些恰好就是 MySQL 运维的骨架：安装、权限、备份、恢复、主从、慢查询——生产上 80% 的 MySQL 日常工作都在这个圆圈里。备着软考数据库方向的你也赚了：约束、SQL、备份恢复、主从原理，这些考点你不再是背的，是做过的。

接下来两件事：一是把下面的生产速查从头到尾读一遍（不求记住，混个眼熟，用时来查）；二是每周回来重做一次实验五的恢复演练，让它从"会"变成"肌肉记忆"。

## 生产速查（收藏区）

以下是原手册里的"武器库"：参数模板、对照表、恢复进阶、故障速查、上线 Checklist。平时当工具书用，用时按编号直达。

### 速查 1｜版本怎么选 + 5.7/8.0 差异

| 版本 | 现状 | 建议 |
|---|---|---|
| 5.7 | 已于 2023 年 10 月停止官方支持 | 存量系统还在用就继续维护，**新项目不要再选** |
| 8.0 | 当前主流，默认 utf8mb4、支持窗口函数/GTID 增强 | **生产首选**，运维命令大部分与 5.7 一致 |

5.7 与 8.0 的三个关键差异（维护混合环境必记）：

- 8.0 建用户必须 `CREATE USER` 再 `GRANT`（5.7 可以 `GRANT` 直接隐式建用户）
- 8.0 binlog 过期参数用 `binlog_expire_logs_seconds`（5.7 是 `expire_logs_days`）
- 8.0 密码策略参数是 `validate_password.policy`（5.7 是 `validate_password_length` 等插件参数）

### 速查 2｜MySQL 与国产数据库的运维对照

日常运维达梦（DM8）、金仓（KingbaseES）时，整体思路和 MySQL 是同一套方法论：

| 运维工作 | MySQL | 达梦 DM8 | 金仓 KingbaseES |
|---|---|---|---|
| 参数文件 | my.cnf | dm.ini | postgresql.conf |
| 启停服务 | systemctl | DmService 实例名 | pg_ctl / systemctl |
| 逻辑备份 | mysqldump | dexp | pg_dump |
| 逻辑恢复 | `mysql < xx.sql` | dimp | pg_restore |
| 主从/归档 | binlog + 复制 | 归档日志 + 守护集群 | WAL + 流复制 |
| 实例日志 | error log | dm 实例日志 | pg_log |

学会 MySQL 的"参数文件、备份恢复、主从、监控"四大件，切换到国产库只是换个命令名。

### 速查 3｜二进制安装、systemd 模板、忘记 root 密码

生产推荐二进制 tar 包安装（不依赖 yum 源、目录规划清晰、升级只需替换目录）：

```bash
# 1. 准备用户和目录（不登录的系统用户）
useradd -M -s /sbin/nologin mysql
mkdir -p /usr/local/mysql/data
mkdir -p /data/mysql_backup

# 2. 解压（包提前上传到 /usr/local/src）
cd /usr/local/src
tar xf mysql-8.0.36-linux-glibc2.28-x86_64.tar.xz
mv mysql-8.0.36-linux-glibc2.28-x86_64 /usr/local/mysql

# 3. 授权
chown -R mysql:mysql /usr/local/mysql

# 4. 初始化（生产用 --initialize 生成随机密码；--initialize-insecure 空密码仅测试）
/usr/local/mysql/bin/mysqld --initialize \
  --user=mysql \
  --basedir=/usr/local/mysql \
  --datadir=/usr/local/mysql/data

# 5. 捞临时密码（datadir 必须是空目录；缺 libaio 报错就先 yum -y install libaio）
grep 'temporary password' /usr/local/mysql/data/*.err
```

二进制安装需要自己写 systemd unit 文件（yum 安装自带）：

```ini
# /etc/systemd/system/mysqld.service
[Unit]
Description=MySQL Server
After=network.target

[Service]
User=mysql
Group=mysql
ExecStart=/usr/local/mysql/bin/mysqld --defaults-file=/etc/my.cnf
LimitNOFILE=65535
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl start mysqld
systemctl enable mysqld
# 日常启停三件套：start（启动）/ stop（停止）/ restart（改 my.cnf 后必须重启生效）
```

忘记 root 密码重置（skip-grant-tables 流程）：

```bash
# 1. 停库，加免密参数（写在 [mysqld] 段下）
systemctl stop mysqld
echo "skip-grant-tables" >> /etc/my.cnf

# 2. 免密启动并进入（提示输密码直接回车）
systemctl start mysqld
mysql -uroot -p
```

```sql
-- 3. 必须 FLUSH PRIVILEGES 重载权限表，否则 ALTER USER 会报错
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNew@Pass123';
EXIT;
```

```bash
# 4. 删掉 skip-grant-tables 那行，正常重启
sed -i '/skip-grant-tables/d' /etc/my.cnf
systemctl restart mysqld
```

5.7 老写法（直接改 user 表）：`UPDATE mysql.user SET authentication_string=PASSWORD('MyNew@Pass123') WHERE user='root' AND host='localhost'; FLUSH PRIVILEGES;`——8.0 不可用。生产重置密码记得留变更记录。

### 速查 4｜my.cnf 参数调优表 + 生产模板

| 参数 | 生产建议值 | 说明 |
|---|---|---|
| `max_connections` | 1000~2000 | 最大连接数。打满报 `Too many connections`，先查应用是否泄漏连接 |
| `innodb_buffer_pool_size` | 物理内存的 **50%~70%** | 最重要参数，缓存数据和索引，专用 DB 服务器可到 70% |
| `slow_query_log` | ON | 慢查询开关，生产必开 |
| `long_query_time` | 2（秒） | 超过该时间记入慢日志 |
| `character-set-server` | utf8mb4 | 8.0 默认就是 utf8mb4，兼容 5.7 数据建议显式声明 |
| `log-bin` | 开启 | binlog，主从和数据恢复都靠它 |
| `expire_logs_days` | 7~15 | binlog 保留天数防撑爆磁盘（8.0 推荐 `binlog_expire_logs_seconds=604800`） |
| `max_allowed_packet` | 64M | 单包上限，大批量导入报 `Packet too large` 时调它 |
| `lower_case_table_names` | 1 | 表名不区分大小写，**8.0 只能在初始化时指定**，初始化前想清楚 |

MySQL 8.0 生产基础模板（16G 内存专用机，可直接改用）：

```ini
# /etc/my.cnf  —— MySQL 8.0 生产基础模板（16G 内存专用机）
[mysqld]
# ---------- 基础 ----------
port        = 3306
basedir     = /usr/local/mysql
datadir     = /usr/local/mysql/data
socket      = /tmp/mysql.sock
log-error   = /usr/local/mysql/data/mysqld.err
pid-file    = /usr/local/mysql/data/mysqld.pid

# ---------- 字符集：统一 utf8mb4，防止乱码 ----------
character-set-server = utf8mb4
collation-server     = utf8mb4_general_ci

# ---------- 连接 ----------
max_connections     = 2000          # 按业务峰值评估，别拍脑袋
max_connect_errors  = 100000        # 防止客户端反复重连被拉黑
max_allowed_packet  = 64M
interactive_timeout  = 600          # 交互连接空闲 10 分钟断开
wait_timeout        = 600           # 应用连接空闲超时，压 sleep 连接的关键

# ---------- InnoDB 缓冲 ----------
# 专用 DB 服务器给到物理内存 60%~70%；与其他服务混部则 40%~50%
innodb_buffer_pool_size    = 10G
innodb_buffer_pool_instances = 4    # 拆 4 个池减少锁竞争
innodb_log_file_size       = 1G     # redo log 单文件大小
innodb_flush_log_at_trx_commit = 1  # 每事务刷盘，最安全，主库保持默认

# ---------- 慢查询日志（生产必开）----------
slow_query_log              = ON
slow_query_log_file         = /usr/local/mysql/data/slow.log
long_query_time             = 2     # 2 秒以上算慢 SQL
log_queries_not_using_indexes = ON  # 没走索引的 SQL 也记录（噪声多可关）

# ---------- binlog（主从与恢复的基础）----------
server-id = 1                        # 主从架构里全局唯一
log-bin   = mysql-bin
binlog_format = ROW                  # 8.0 默认，数据一致性最好
binlog_expire_logs_seconds = 604800  # 保留 7 天，防磁盘撑爆（604800 = 7*24*3600）
sync_binlog = 1                      # 每事务落盘，主库安全优先

# ---------- 文件数 ----------
open_files_limit = 65535

[mysql]
default-character-set = utf8mb4
```

改完 my.cnf 必须 `systemctl restart mysqld` 生效；上线前用 `mysqld --validate-config --defaults-file=/etc/my.cnf` 校验语法（8.0 支持），避免手滑把库起不来。

密码策略相关：`SHOW VARIABLES LIKE 'validate_password%';` 查看策略（MEDIUM = 至少 8 位、含大小写、数字、特殊字符）；测试环境可 `SET GLOBAL validate_password.policy = LOW;` 临时降级，生产不要降；改用户密码用 `ALTER USER 'xxx'@'host' IDENTIFIED BY 'New@Pass456';`。

### 速查 5｜备份恢复大全

三种方式怎么选：

| 方式 | 工具 | 特点 | 场景 |
|---|---|---|---|
| 逻辑备份 | mysqldump | 导出 SQL 文本，跨版本恢复灵活，大库慢 | 每日全备（<100G 库） |
| 物理备份 | xtrabackup | 直接拷贝数据文件，速度与库大小成正比、快 | 大库、热备 |
| 增量恢复 | binlog | 回放变更，精确到秒 | 误操作追平到指定时间点 |

**生产标准答案：每天 mysqldump/xtrabackup 全量 + binlog 实时保留 = 可恢复到任意时间点。**

mysqldump 三种粒度与常用开关：

```bash
# 全量备份（所有库）——生产必加 --single-transaction 保证 InnoDB 一致性且不锁表
mysqldump -uroot -p -A --single-transaction \
  --triggers --routines --events --master-data=2 | gzip > /data/mysql_backup/all_$(date +%F).sql.gz

# 库级备份
mysqldump -uroot -p --single-transaction --databases billdb | gzip > billdb_$(date +%F).sql.gz

# 表级备份（库名 空格 表名）
mysqldump -uroot -p billdb usage_record > usage_record_$(date +%F).sql

# 只导表结构 / 只导数据
mysqldump -uroot -p billdb --no-data          # 只建表语句
mysqldump -uroot -p billdb --no-create-info   # 只数据
```

关键参数：`--single-transaction` = InnoDB 一致性快照、备份期间不锁表，生产必加；`--master-data=2` = 在备份文件里注释记录备份时的 binlog 位点，搭主从和增量恢复必加；`-A` = 所有库；`--databases` = 指定库。

恢复：

```bash
gunzip all_2026-10-12.sql.gz                          # 先解压
mysql -uroot -p < all_2026-10-12.sql                  # 全量恢复
mysql -uroot -p billdb < billdb_2026-10-12.sql        # 单库恢复
mysql -uroot -p billdb < usage_record_2026-10-12.sql  # 单表恢复
```

binlog 基于时间点/位置恢复（实验五"再回放"的进阶版）。场景：`2026-10-12 10:00` 误执行了 `DELETE FROM usage_record`，10:05 发现：

```sql
-- 1. 确认 binlog 开着、看看当前位点
SHOW VARIABLES LIKE 'log_bin';
SHOW MASTER STATUS;
```

```bash
# 2. 定位误操作所在的 binlog 文件和位置
mysqlbinlog --no-defaults /usr/local/mysql/data/mysql-bin.000012 | grep -n -i 'DELETE FROM' -A2 -B5

# 3. 方式 A：基于时间——先导入最近全量，再回放全量之后到误操作之前的 binlog
mysqlbinlog --no-defaults \
  --start-datetime='2026-10-12 08:00:00' \
  --stop-datetime='2026-10-12 10:00:00' \
  /usr/local/mysql/data/mysql-bin.000012 | mysql -uroot -p

# 方式 B：基于位置——精确跳过误操作的 position 区间
mysqlbinlog --no-defaults \
  --start-position=1556 --stop-position=2100 \
  /usr/local/mysql/data/mysql-bin.000012 | mysql -uroot -p
```

定位误操作用 `SHOW BINLOG EVENTS IN 'mysql-bin.000012';` 能直接看到每条语句的位置，比 grep 更精确。

xtrabackup（物理备份，大库首选）：

```bash
# 全量备份（8.0 用 xtrabackup 命令，老版本叫 innobackupex）
xtrabackup --backup --target-dir=/data/backup/full -uroot -p'MyNew@Pass123'

# 恢复三步：prepare -> copy-back -> 授权
xtrabackup --prepare --target-dir=/data/backup/full
systemctl stop mysqld
xtrabackup --copy-back --target-dir=/data/backup/full
chown -R mysql:mysql /usr/local/mysql/data
systemctl start mysqld

# 增量：在昨天全量基础上只备今天的变更
xtrabackup --backup --target-dir=/data/backup/inc1 \
  --incremental-basedir=/data/backup/full -uroot -p'MyNew@Pass123'
```

每日定时备份脚本（cron + 保留 7 天 + 备份后校验）：

```bash
#!/bin/bash
# /opt/scripts/mysql_backup.sh  每日全备 + 保留 7 天 + 备份后校验
DB_USER=root
DB_PASS='MyNew@Pass123'
BAK_DIR=/data/mysql_backup
DATE=$(date +%F)
LOG=/var/log/mysql_backup.log

mkdir -p $BAK_DIR
echo "===== $DATE 备份开始 =====" >> $LOG

mysqldump -u$DB_USER -p"$DB_PASS" -A --single-transaction \
  --triggers --routines --events --master-data=2 \
  | gzip > $BAK_DIR/all_${DATE}.sql.gz

# 校验：gunzip 完整性测试应通过
if gunzip -t $BAK_DIR/all_${DATE}.sql.gz 2>/dev/null; then
  echo "$DATE 备份成功，大小：$(du -sh $BAK_DIR/all_${DATE}.sql.gz)" >> $LOG
else
  echo "$DATE 备份失败！请检查！" >> $LOG
fi

# 保留策略：删 7 天前的旧备份
find $BAK_DIR -name "all_*.sql.gz" -mtime +7 -delete
```

```bash
chmod +x /opt/scripts/mysql_backup.sh
crontab -e
# 每天凌晨 2:10 执行
10 2 * * * /opt/scripts/mysql_backup.sh >/dev/null 2>&1
```

> 每月至少做一次**恢复演练**：把备份恢复到测试库，确认能起来、能查数据。没验证过恢复的备份等于没备份。

### 速查 6｜主从进阶（健康指标 / 延迟 / 中断修复）

`SHOW SLAVE STATUS\G` 关键项（实验六双 Yes 的完整版）：

| 关键项 | 健康值 | 含义 |
|---|---|---|
| `Slave_IO_Running` | Yes | IO 线程活着，在拉 binlog |
| `Slave_SQL_Running` | Yes | SQL 线程活着，在重放 |
| `Seconds_Behind_Master` | 0 | 延迟秒数，持续增大即同步追不上 |
| `Last_IO_Errno / Last_SQL_Errno` | 0 | 非 0 就是复制报错，看 Error 信息 |
| `Master_Log_File / Read_Master_Log_Pos` | 递增 | 已拉取到的主库位点 |

主从延迟原因与处理：

| 原因 | 现象 | 处理 |
|---|---|---|
| 主库大事务（一次 update 百万行） | 从库 relay log 堆积 | 拆小批量提交，业务改造 |
| 从库单线程重放跟不上 | Seconds_Behind_Master 持续增长 | 开并行复制（见下） |
| 从库机器差/盘慢 | 写入耗时高 | 提升硬件，重点看磁盘 IO |
| 从库被重查询拖垮 | CPU 高 | 重查询路由到别的从库，`read_only` 防写入 |

```sql
-- 8.0 并行复制：SQL 线程按库/事务组并行重放（5.7 参数名为 slave_parallel_workers）
STOP SLAVE;
SET GLOBAL replica_parallel_workers = 4;
START SLAVE;
```

读写分离思路：应用中间件层（MyCat、ProxySQL、ShardingSphere-Proxy）自动把写发主库、读发从库；应用代码层配多数据源实现；注意"主写完马上从读"会读到旧数据（复制有延迟），重要业务用"写后强制读主"兜底。

主从中断修复：

```sql
-- 1. 先看报错类型
SHOW SLAVE STATUS\G      -- 看 Last_IO_Errno / Last_SQL_Errno

-- 2. 从库数据被误改导致主键冲突(1062)、记录丢失(1032)等，权衡后跳过 1 个错误事件
--    （生产跳过前先备份现场，且要报备；8.0.22+ 参数名为 sql_replica_skip_counter）
STOP SLAVE;
SET GLOBAL sql_slave_skip_counter = 1;
START SLAVE;
```

| 报错 | 含义 | 处理 |
|---|---|---|
| `1236 Could not find first log file` | 主库 binlog 被删，从库找不到了 | 重新备份主库，从库重新搭建 change master |
| `1062 Duplicate entry` | 从库已有该数据 | 确认数据一致后 skip counter 跳过 |
| IO 线程 Yes、SQL 线程 No | relay log 重放报错 | 看 Last_SQL_Errno 定位，无法修复则重建从库 |
| 连不上主库 | 网络/账号问题 | `mysql -h192.168.1.10 -urepl -p` 手工测试连通与授权 |

### 速查 7｜日常排障速查

连不上数据库六连查：

| 现象/排查 | 命令/判断 |
|---|---|
| 端口没起 | `systemctl status mysqld`；`ss -tlnp \| grep 3306` |
| 服务起了只允许本机 | `SHOW VARIABLES LIKE 'bind_address';` 非 `0.0.0.0` 要改配置 |
| 防火墙拦了 | `firewall-cmd --add-port=3306/tcp --permanent && firewall-cmd --reload` |
| 账号没远程权限 | host 是 `localhost`：`CREATE USER 'xx'@'192.168.1.%'` 重新授权 |
| 密码错/策略拦 | `ERROR 1045` 核对密码；`SHOW VARIABLES LIKE 'validate_password%';` |
| 连接数满 | `ERROR 1040`：`Too many connections`，按下文排查，应急先 `SET GLOBAL max_connections=3000` |

连接数打满排查（`Too many connections`）：

```sql
-- 1. 看当前连接概况：哪些用户、什么状态
SHOW PROCESSLIST;
SELECT user, host, COUNT(*) AS cnt
FROM information_schema.processlist
GROUP BY user, host ORDER BY cnt DESC;

-- 2. 数 sleep 连接：大量 Sleep 说明应用没释放连接（连接池没配好）
SELECT command, COUNT(*) FROM information_schema.processlist GROUP BY command;

-- 3. 处理：杀掉空闲很久的连接（Id 按第一列取）
KILL 12345;

-- 4. 治本：调小空闲超时，让僵尸连接自动断开
SET GLOBAL wait_timeout = 600;
```

判断顺序：连接数高 → 先看是不是 sleep 僵尸（应用问题）→ 还是真活跃（业务峰值，扩 `max_connections` 并查慢 SQL 拖住连接）。

CPU / 内存飙高分析思路：

```sql
-- CPU 高：先看是不是库内在跑重 SQL
SHOW PROCESSLIST;                       -- 找 Time 很长、State 是 Sending data 的
SHOW STATUS LIKE 'Threads_running';     -- 活跃线程数突增即有风暴
-- 再结合慢日志锁定语句，explain 补索引

-- 内存：buffer pool 是大头（本来就该吃），异常增长看这些
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW STATUS LIKE 'Created_tmp_disk_tables';  -- 值猛增 = 排序/关联在用磁盘临时表，内存参数不足
```

经验顺序：**CPU 高先抓 SQL，内存异常先看连接数和临时表，磁盘 IO 高先看慢查询**；先用 `top`、`iostat -x 1` 定位是不是 mysqld 进程，再进库内分析。

show 家族（排障第一入口）：

```sql
SHOW DATABASES;                          -- 有哪些库
USE billdb; SHOW TABLES;                  -- 有哪些表
SHOW CREATE TABLE usage_record\G         -- 看表结构定义
SHOW PROCESSLIST;                        -- 当前连接在干什么（排障必杀）
SHOW STATUS LIKE 'Threads_connected';    -- 当前连接数
SHOW VARIABLES LIKE 'max_connections';   -- 最大连接数配置
SHOW VARIABLES LIKE 'slow_query_log%';   -- 慢日志开关状态
SHOW ENGINE INNODB STATUS\G              -- InnoDB 内部状态（死锁信息在这里）
```

运维巡检常用查询：

```sql
-- 连接数使用情况：当前值 / 上限
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';

-- 各库大小排序（DBA 巡检常备）
SELECT table_schema AS '库',
       ROUND(SUM(data_length + index_length)/1024/1024, 2) AS '大小(MB)',
       COUNT(*) AS '表数量'
FROM information_schema.tables
GROUP BY table_schema
ORDER BY SUM(data_length + index_length) DESC;

-- 大表 TOP10（找最占空间的表）
SELECT table_schema AS '库', table_name AS '表',
       ROUND((data_length + index_length)/1024/1024, 2) AS '大小(MB)',
       table_rows AS '行数(近似)'
FROM information_schema.tables
ORDER BY data_length + index_length DESC
LIMIT 10;
```

表损坏修复：

```sql
-- 报错 "Table ... is marked as crashed and should be repaired" 时
CHECK TABLE billdb.usage_record;         -- 先检查
REPAIR TABLE billdb.usage_record;        -- MyISAM 表修复
OPTIMIZE TABLE billdb.usage_record;      -- 回收碎片/整理空间，可定期对大表做
```

InnoDB 表极少损坏（有 redo log 自动恢复）；若 InnoDB 起不来报页损坏，先保留 datadir 全量副本再按错误日志处理，**不要反复重启硬碰**。

磁盘满处理（binlog 清理）：

```sql
-- 1. 确认是 binlog 占的（datadir 下 mysql-bin.0000xx 一堆）
SHOW BINARY LOGS;                        -- 列出所有 binlog 及大小

-- 2. 清理到指定序号（该序号之前的全删，留新不留旧）
PURGE BINARY LOGS TO 'mysql-bin.000300';

-- 3. 或清理指定日期之前的
PURGE BINARY LOGS BEFORE '2026-10-05 00:00:00';

-- 4. 治本：设置自动过期（保留 7 天）
SET GLOBAL binlog_expire_logs_seconds = 604800;   -- 8.0
SET GLOBAL expire_logs_days = 7;                  -- 5.7
```

注意：从库还需要的 binlog **不能删**，先确认从库 `Master_Log_File` 再清理。

### 速查 8｜误删恢复路线表（实验五的进阶版）

| 误操作 | 恢复路径 |
|---|---|
| 误删单库/单表 | 最近全量恢复 + binlog 回放到误删前一刻（速查 5） |
| 误 `UPDATE`/`DELETE` 全表 | 同上：全量 + binlog `--stop-position` 到误操作前 |
| 库还在但数据错乱 | 有从库先查从库，把正确数据导出回补主库 |
| `DROP DATABASE` | binlog 里 DROP 也有位点，恢复全量后回放到 DROP 之前的位置 |

四步法（口诀：**停应用、保现场、先全量、再回放**）：停应用防继续写 → 保留 binlog 现场全量拷贝 → 恢复最近备份到临时库验证 → binlog 回放补齐到误操作前。

### 速查 9｜生产上线 Checklist

| 检查项 | 标准 | 确认 |
|---|---|---|
| **备份策略** | 每日 mysqldump/xtrabackup 全备 + binlog 保留 7 天以上 | ☐ |
| 备份演练 | 近一个月内做过恢复演练，恢复时间达标 | ☐ |
| **主从复制** | 双 Yes、Seconds_Behind_Master 正常，从库 `read_only` | ☐ |
| 主从故障演练 | 手动停主库验证切换流程，知道谁接写 | ☐ |
| **监控** | 端口探活、连接数、主从状态、延迟、磁盘使用率（binlog 目录）告警 | ☐ |
| 慢查询日志 | `slow_query_log=ON`、`long_query_time=2`，每周出 TOP5 分析 | ☐ |
| **参数** | `innodb_buffer_pool_size` 按内存规划、`utf8mb4`、binlog 过期时间已设 | ☐ |
| 密码与权限 | root 禁止 `%` 远程、应用账号最小权限、密码符合策略 | ☐ |
| 防火墙 | 3306 仅对应用/管理网段放通 | ☐ |
| 服务自启 | `systemctl enable mysqld`，开机自动拉起 | ☐ |
| 错误日志巡检 | `mysqld.err` 纳入日志平台，有 ERROR 即告警 | ☐ |
| 变更管理 | 改 my.cnf / 改权限 / 批量 UPDATE 走变更审批与回滚预案 | ☐ |

> AI生成
