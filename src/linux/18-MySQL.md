---
title: MySQL 运维从入门到生产实战
category: Linux进阶
tags:
  - Linux
  - MySQL
  - 数据库
---

> 面向运维岗的 MySQL 生产实战笔记：从安装部署、权限管理、参数调优，到备份恢复、主从复制、故障处理，附生产可直接使用的配置模板、脚本和上线 Checklist。

## 一、运维视角简介

### 1.1 版本怎么选

| 版本 | 现状 | 建议 |
|---|---|---|
| 5.7 | 已于 2023 年 10 月停止官方支持 | 存量系统还在用就继续维护，**新项目不要再选** |
| 8.0 | 当前主流，默认 utf8mb4、支持窗口函数/GTID 增强 | **生产首选**，本笔记以 8.0 为主，标注 5.7 差异点 |

生产上经常同时存在 5.7 和 8.0，两个版本的运维命令大部分一致，注意几个差异即可：

- 8.0 建用户必须 `CREATE USER` 再 `GRANT`（5.7 可以 `GRANT` 直接隐式建用户）
- 8.0 binlog 过期参数推荐用 `binlog_expire_logs_seconds`（5.7 用 `expire_logs_days`）
- 8.0 密码策略参数是 `validate_password.policy`（5.7 插件是 `validate_password_length` 等）

### 1.2 和国产数据库的运维共通点

日常运维达梦（DM8）、金仓（KingbaseES）时，会发现整体思路和 MySQL 是一套方法论：

| 运维工作 | MySQL | 达梦 DM8 | 金仓 KingbaseES |
|---|---|---|---|
| 参数文件 | my.cnf | dm.ini | postgresql.conf |
| 启停服务 | systemctl | DmService 实例名 | pg_ctl / systemctl |
| 逻辑备份 | mysqldump | dexp | pg_dump |
| 逻辑恢复 | mysql < xx.sql | dimp | pg_restore |
| 主从/归档 | binlog + 复制 | 归档日志 + 守护集群 | WAL + 流复制 |
| 实例日志 | error log | dm 实例日志 | pg_log |

学会 MySQL 的"参数文件、备份恢复、主从、监控"四大件，切换到国产库只是换个命令名。

## 二、安装部署

### 2.1 yum 仓库安装（简单快速，适合虚机/测试）

```bash
# 1. 安装 MySQL 官方 yum 仓库
rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-11.noarch.rpm

# 2. 安装 MySQL 8.0 服务端（会自动带上客户端）
yum -y install mysql-community-server

# 3. 启动并设置开机自启
systemctl start mysqld
systemctl enable mysqld
systemctl status mysqld
```

yum 安装后 datadir 默认是 `/var/lib/mysql`，配置文件在 `/etc/my.cnf`。

### 2.2 二进制 tar 包安装（生产推荐，可控可迁移）

生产环境推荐二进制包：不依赖 yum 源，目录规划清晰，升级只需替换目录。

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
```

### 2.3 初始化（mysqld --initialize）

```bash
/usr/local/mysql/bin/mysqld --initialize \
  --user=mysql \
  --basedir=/usr/local/mysql \
  --datadir=/usr/local/mysql/data

# 初始化成功后，root 临时密码打印在错误日志里，用完即换
grep 'temporary password' /usr/local/mysql/data/*.err
# 输出示例：[Note] [MY-010454] A temporary password is generated for root@localhost: ab3!xKk9qw_,

# 首次登录，必须先改密码才能执行任何 SQL
mysql -uroot -p'ab3!xKk9qw_,' -h127.0.0.1
ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNew@Pass123';
```

- `--initialize`：生成随机 root 密码，生产用这个
- `--initialize-insecure`：root 空密码，仅测试环境
- 如果提示缺 `libaio`：`yum -y install libaio` 后重新初始化
- 初始化报错先看错误日志（datadir 下 `.err` 文件），datadir 必须是空目录

### 2.4 systemd 服务管理

二进制安装需要自己写 unit 文件（yum 安装自带）：

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
```

日常启停三件套：

```bash
systemctl start mysqld     # 启动
systemctl stop mysqld      # 停止
systemctl restart mysqld   # 重启（改 my.cnf 后需要重启生效）
```

### 2.5 忘记 root 密码重置（skip-grant-tables 流程）

```bash
# 1. 停库，改配置
systemctl stop mysqld
echo "skip-grant-tables" >> /etc/my.cnf     # 加在 [mysqld] 段下

# 2. 免密启动
systemctl start mysqld
mysql -uroot -p                              # 直接回车即可进入
```

```sql
-- 3. 必须 FLUSH PRIVILEGES 重载权限表，否则 ALTER USER 会报错
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNew@Pass123';
EXIT;
```

```bash
# 4. 删掉 skip-grant-tables 这一行，再正常重启
sed -i '/skip-grant-tables/d' /etc/my.cnf
systemctl restart mysqld
mysql -uroot -p'MyNew@Pass123'
```

5.7 老写法（改 user 表）：

```sql
UPDATE mysql.user SET authentication_string=PASSWORD('MyNew@Pass123')
  WHERE user='root' AND host='localhost';
FLUSH PRIVILEGES;
```

## 三、运维必会 SQL

### 3.1 库表管理

```sql
-- 建库：生产统一 utf8mb4，注意 8.0 建库要显式写字符集（跨版本兼容）
CREATE DATABASE billdb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 建表
CREATE TABLE billdb.usage_record (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  host_name VARCHAR(64) NOT NULL COMMENT '主机名',
  bill_month CHAR(7) NOT NULL COMMENT '账期 2026-10',
  cpu_usage DECIMAL(5,2) DEFAULT 0 COMMENT 'CPU使用率',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 改表
ALTER TABLE billdb.usage_record ADD COLUMN mem_usage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE billdb.usage_record DROP COLUMN mem_usage;

-- 删库删表（危险，执行前先备份）
DROP TABLE billdb.usage_record;
DROP DATABASE billdb;
```

### 3.2 增删改查速查

```sql
INSERT INTO billdb.usage_record (host_name, bill_month, cpu_usage)
VALUES ('web-01', '2026-10', 35.60);

SELECT * FROM billdb.usage_record WHERE bill_month = '2026-10' LIMIT 100;

UPDATE billdb.usage_record SET cpu_usage = 40.00 WHERE host_name = 'web-01';

DELETE FROM billdb.usage_record WHERE id = 1;
```

> 生产红线：`UPDATE` / `DELETE` 不带 `WHERE` 全表生效。批量操作前先用同条件 `SELECT` 数一遍行数，大表操作走变更审批。

### 3.3 show 家族（排障第一入口）

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

### 3.4 运维常用查询

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

-- 慢查询是否开启、阈值
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
```

## 四、用户与权限

### 4.1 创建用户和授权

```sql
-- 8.0 必须先建用户再授权（两步分开是规范）
CREATE USER 'appuser'@'192.168.10.%' IDENTIFIED BY 'App@Pass123';
GRANT SELECT, INSERT, UPDATE, DELETE ON billdb.* TO 'appuser'@'192.168.10.%';

-- 运维账号：给某个库的全部权限
CREATE USER 'dba_admin'@'192.168.10.%' IDENTIFIED BY 'Dba@Pass123';
GRANT ALL ON billdb.* TO 'dba_admin'@'192.168.10.%';

-- 远程访问：host 写 % 即任意地址可连（方便但风险大，生产尽量按网段收敛）
CREATE USER 'remoteuser'@'%' IDENTIFIED BY 'Remote@Pass123';
GRANT SELECT ON billdb.* TO 'remoteuser'@'%';

-- 刷新权限（8.0 GRANT 自动生效，改密码或手工改表后需要）
FLUSH PRIVILEGES;

-- 查看用户权限
SHOW GRANTS FOR 'appuser'@'192.168.10.%';
```

host 的写法决定"谁能从哪里连"：`localhost`（本机）、`192.168.10.%`（指定网段）、`%`（任意）。**生产原则：按最小网段授权，禁止 `%'@'root'` 这种组合。**

### 4.2 收回权限与删用户

```sql
REVOKE INSERT, UPDATE, DELETE ON billdb.* FROM 'appuser'@'192.168.10.%';
DROP USER 'remoteuser'@'%';
```

### 4.3 密码策略

```sql
-- 8.0 查看密码策略（validate_password 组件在初始化后默认自动安装）
SHOW VARIABLES LIKE 'validate_password%';
-- validate_password.policy = MEDIUM：至少8位、含大小写、数字、特殊字符

-- 临时降级便于测试（生产不要降）
SET GLOBAL validate_password.policy = LOW;

-- 改用户密码
ALTER USER 'appuser'@'192.168.10.%' IDENTIFIED BY 'NewApp@Pass456';
```

> 忘记 root 密码的处理见第 2.5 节 skip-grant-tables 流程，生产操作记得留变更记录。

## 五、my.cnf 核心参数

### 5.1 参数速查

| 参数 | 生产建议值 | 说明 |
|---|---|---|
| `max_connections` | 1000~2000 | 最大连接数。打满报 `Too many connections`，先看应用是否泄漏连接 |
| `innodb_buffer_pool_size` | 物理内存的 **50%~70%** | 最重要参数，缓存数据和索引，专用 DB 服务器可到 70% |
| `slow_query_log` | ON | 慢查询开关，生产必开 |
| `long_query_time` | 2（秒） | 超过该时间记录慢日志 |
| `character-set-server` | utf8mb4 | 8.0 默认就是 utf8mb4，兼容 5.7 数据建议显式声明 |
| `log-bin` | 开启 | binlog，主从和数据恢复都靠它 |
| `expire_logs_days` | 7~15 | binlog 保留天数，防撑爆磁盘（8.0 推荐 `binlog_expire_logs_seconds=604800`） |
| `max_allowed_packet` | 64M | 单包上限，大批量导入报 `Packet too large` 时调它 |
| `lower_case_table_names` | 1 | 表名不区分大小写，**8.0 只能在初始化时指定**，初始化前想清楚 |

### 5.2 生产可直接用的 my.cnf 模板

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
max_connections   = 2000          # 按业务峰值评估，别拍脑袋
max_connect_errors = 100000        # 防止客户端反复重连被拉黑
max_allowed_packet = 64M
interactive_timeout = 600          # 交互连接空闲 10 分钟断开
wait_timeout       = 600          # 应用连接空闲超时，压 sleep 连接的关键

# ---------- InnoDB 缓冲 ----------
# 专用 DB 服务器给到物理内存 60%~70%；与其他服务混部则 40%~50%
innodb_buffer_pool_size = 10G
innodb_buffer_pool_instances = 4  # 拆 4 个池减少锁竞争
innodb_log_file_size  = 1G        # redo log 单文件大小
innodb_flush_log_at_trx_commit = 1  # 每事务刷盘，最安全，主库保持默认

# ---------- 慢查询日志（生产必开）----------
slow_query_log      = ON
slow_query_log_file = /usr/local/mysql/data/slow.log
long_query_time     = 2            # 2 秒以上算慢 SQL
log_queries_not_using_indexes = ON  # 没走索引的 SQL 也记录（噪声多可关）

# ---------- binlog（主从与恢复的基础）----------
server-id = 1                      # 主从架构里全局唯一
log-bin   = mysql-bin
binlog_format = ROW                # 8.0 默认，数据一致性最好
binlog_expire_logs_seconds = 604800  # 保留 7 天，防磁盘撑爆（604800 = 7*24*3600）
sync_binlog = 1                    # 每事务落盘，主库安全优先

# ---------- 文件数 ----------
open_files_limit = 65535

[mysql]
default-character-set = utf8mb4
```

> 改完 `my.cnf` 必须 `systemctl restart mysqld` 生效。上线前用 `mysqld --validate-config --defaults-file=/etc/my.cnf` 校验语法（8.0 支持），避免手滑把库起不来。

## 六、备份与恢复

### 6.1 备份策略总览

| 方式 | 工具 | 特点 | 场景 |
|---|---|---|---|
| 逻辑备份 | mysqldump | 导出 SQL 文本，跨版本恢复灵活，大库慢 | 每日全备（<100G 库） |
| 物理备份 | xtrabackup | 直接拷贝数据文件，速度与库大小成正比、快 | 大库、热备 |
| 增量恢复 | binlog | 回放变更，精确到秒 | 误操作追平到指定时间点 |

**生产标准答案：每天 mysqldump/xtrabackup 全量 + binlog 实时保留 = 可恢复到任意时间点。**

### 6.2 mysqldump 三种粒度

```bash
# 全量备份（所有库），生产加 --single-transaction 保证 InnoDB 一致性且不锁表
mysqldump -uroot -p -A --single-transaction \
  --triggers --routines --events --master-data=2 | gzip > /data/mysql_backup/all_$(date +%F).sql.gz

# 库级备份
mysqldump -uroot -p --single-transaction --databases billdb | gzip > billdb_$(date +%F).sql.gz

# 表级备份（库 空格 表名）
mysqldump -uroot -p billdb usage_record > usage_record_$(date +%F).sql

# 只导表结构 / 只导数据
mysqldump -uroot -p billdb --no-data      # 只建表语句
mysqldump -uroot -p billdb --no-create-info  # 只数据
```

关键参数：

- `--single-transaction`：InnoDB 一致性快照，**备份期间不锁表**，生产必加
- `--master-data=2`：在备份文件里注释记录备份时的 binlog 位点，**搭主从和增量恢复必加**
- `-A`：所有库；`--databases`：指定库

### 6.3 恢复

```bash
# 全量恢复（先解压再导入）
gunzip all_2026-10-12.sql.gz
mysql -uroot -p < all_2026-10-12.sql

# 单库恢复
mysql -uroot -p billdb < billdb_2026-10-12.sql

# 单表恢复：从库级备份文件中截取该表的 CREATE/INSERT 段，或直接用表级备份
mysql -uroot -p billdb < usage_record_2026-10-12.sql
```

### 6.4 binlog 基于时间点/位置恢复（误删救命流程）

场景：`2026-10-12 10:00` 误执行了 `DELETE FROM usage_record`，10:05 发现。

```sql
-- 1. 确认 binlog 开着、看看文件
SHOW VARIABLES LIKE 'log_bin';
SHOW MASTER STATUS;
```

```bash
# 2. 定位误操作所在 binlog 和位置（找 DELETE 语句的起止点）
mysqlbinlog --no-defaults /usr/local/mysql/data/mysql-bin.000012 | grep -n -i 'DELETE FROM' -A2 -B5

# 3. 两种恢复方式，任选其一：
# 方式 A：基于时间——回放全量之后、误操作之前的所有变更
#   先导入最近全量，再回放 00:00(全量之后) 到 10:00(误操作前) 的 binlog
mysqlbinlog --no-defaults \
  --start-datetime='2026-10-12 08:00:00' \
  --stop-datetime='2026-10-12 10:00:00' \
  /usr/local/mysql/data/mysql-bin.000012 | mysql -uroot -p

# 方式 B：基于位置——跳过误操作的 position 区间，精确回放
#   用 --start-position / --stop-position 跳过 DELETE 那段
mysqlbinlog --no-defaults \
  --start-position=1556 --stop-position=2100 \
  /usr/local/mysql/data/mysql-bin.000012 | mysql -uroot -p
```

定位错误用什么：`SHOW BINLOG EVENTS IN 'mysql-bin.000012';` 能直接看到每条语句的位置，比 grep 更精确。

### 6.5 xtrabackup 简介（物理备份思路）

大库用 mysqldump 要几小时，xtrabackup 直接拷数据文件，支持热备和增量：

```bash
# 全量备份（8.0 用 xtrabackup 命令，老版本叫 innobackupex）
xtrabackup --backup --target-dir=/data/backup/full -uroot -p'MyNew@Pass123'

# 恢复三步：prepare -> copy-back -> 授权
xtrabackup --prepare --target-dir=/data/backup/full
systemctl stop mysqld
xtrabackup --copy-back --target-dir=/data/backup/full
chown -R mysql:mysql /usr/local/mysql/data
systemctl start mysqld

# 增量：在昨天的全量基础上只备今天的变更
xtrabackup --backup --target-dir=/data/backup/inc1 \
  --incremental-basedir=/data/backup/full -uroot -p'MyNew@Pass123'
```

### 6.6 每日定时备份脚本（cron + 保留策略）

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

# 校验：正常文件 gunzip 测试应通过，且末尾有 "Dump completed"
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

## 七、主从复制

### 7.1 复制原理

主库每次变更写入 **binlog**；从库两个线程协作：

```
主库                      从库
binlog ──── IO线程 ─────→ relay log（中继日志）
                              │
                              SQL线程（读取 relay log 重放 SQL）
                              ↓
                          从库数据同步
```

- **IO 线程**：连上主库拉取 binlog，存成本地 relay log
- **SQL 线程**：读取 relay log 重放，数据最终落库
- 两个 `Yes` + `Seconds_Behind_Master: 0` = 主从健康

### 7.2 一主一从搭建完整步骤

环境：主库 192.168.1.10，从库 192.168.1.11（均已完成安装）。

**第一步：主库配置与授权**

```ini
# 主库 /etc/my.cnf [mysqld] 段
server-id = 1
log-bin   = mysql-bin
```

```sql
-- 主库建复制专用账号，只给复制权限、按网段授权
CREATE USER 'repl'@'192.168.1.%' IDENTIFIED BY 'Repl@Pass123';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'192.168.1.%';
FLUSH PRIVILEGES;

-- 记下 File 和 Position，从库 change master 要用
SHOW MASTER STATUS;
-- 输出示例：
-- File: mysql-bin.000003   Position: 157
```

**第二步：把主库现有数据搬过去**

```bash
# 主库备份（--master-data=2 自动把位点写进备份文件头部，从库恢复后不用手工找位点）
mysqldump -uroot -p -A --single-transaction --master-data=2 > /tmp/all_init.sql

# 传到从库
scp /tmp/all_init.sql root@192.168.1.11:/tmp/
```

**第三步：从库配置并启动复制**

```ini
# 从库 /etc/my.cnf [mysqld] 段
server-id = 2          # 和主库不同！
read_only = ON         # 从库只读，防误写造成主从不一致
super_read_only = ON   # 连有 SUPER 权限的账号也只读
```

```bash
systemctl restart mysqld     # 两边改完配置都要重启
```

```sql
-- 从库：先恢复全量数据
SOURCE /tmp/all_init.sql;

-- 从库：指向主库
CHANGE MASTER TO
  MASTER_HOST     = '192.168.1.10',
  MASTER_USER     = 'repl',
  MASTER_PASSWORD = 'Repl@Pass123',
  MASTER_LOG_FILE = 'mysql-bin.000003',
  MASTER_LOG_POS  = 157;

-- 启动复制线程
START SLAVE;
```

> 8.0.22+ 新语法为 `CHANGE REPLICATION SOURCE TO SOURCE_HOST=..., SOURCE_LOG_FILE=..., START REPLICA`，老语法目前仍通用，维护 5.7/8.0 混合环境建议先记老语法。

### 7.3 show slave status 关键项

```sql
SHOW SLAVE STATUS\G
```

| 关键项 | 健康值 | 含义 |
|---|---|---|
| `Slave_IO_Running` | Yes | IO 线程活着，在拉 binlog |
| `Slave_SQL_Running` | Yes | SQL 线程活着，在重放 |
| `Seconds_Behind_Master` | 0 | 延迟秒数，持续增大即同步追不上 |
| `Last_IO_Errno / Last_SQL_Errno` | 0 | 非 0 就是复制报错，看 Error 信息 |
| `Master_Log_File / Read_Master_Log_Pos` | 递增 | 已拉取到的主库位点 |

**双 Yes 是主从健康的金标准**，监控脚本就盯这两项和延迟。

### 7.4 主从延迟原因与处理

| 原因 | 现象 | 处理 |
|---|---|---|
| 主库大事务（一次 update 百万行） | 从库 relay log 堆积 | 拆小批量提交，业务改造 |
| 从库单线程重放跟不上 | Seconds_Behind_Master 持续增长 | 开并行复制（见下） |
| 从库机器差/盘慢 | 写入耗时高 | 提升硬件，重点看磁盘 IO |
| 从库被重查询拖垮 | CPU 高 | 重查询路由到别的从库，`read_only` 防写入 |

```sql
-- 8.0 并行复制：SQL 线程按库/事务组并行重放
STOP SLAVE;
SET GLOBAL replica_parallel_workers = 4;   -- 5.7 参数名为 slave_parallel_workers
START SLAVE;
```

### 7.5 读写分离思路

- 应用中间件层：MyCat、ProxySQL、ShardingSphere-Proxy 自动把写发主库、读发从库
- 应用代码层：框架配置多数据源，写主库、读从库，延迟敏感的强制读主
- 注意"主写完马上从读"会读到旧数据（复制有延迟），重要业务用"写后强制读主"兜底

## 八、性能与排障

### 8.1 慢查询定位：slow log + explain

```bash
# 1. 从慢日志拿到慢 SQL（逐条看）
tail -100 /usr/local/mysql/data/slow.log
# 查全表扫描的聚合统计可用 mysqldumpslow
mysqldumpslow -s t -t 5 /usr/local/mysql/data/slow.log   # 按耗时取 TOP5
```

```sql
-- 2. explain 分析执行计划
EXPLAIN SELECT * FROM usage_record WHERE host_name = 'web-01';
```

explain 重点看 4 列：

| 列 | 好的样子 | 坏的样子 |
|---|---|---|
| `type` | ref、range、const | **ALL（全表扫描）** |
| `key` | 索引名 | NULL（没走索引） |
| `rows` | 越小越好 | 几十万上百万就是缺索引 |
| `Extra` | Using index | Using filesort / Using temporary（排序临时表，需优化） |

加索引：

```sql
ALTER TABLE billdb.usage_record ADD INDEX idx_host (host_name);
```

### 8.2 连接数打满排查

报错 `Too many connections` 或连接数逼近上限：

```sql
-- 1. 看当前连接概况：哪些用户、状态是什么
SHOW PROCESSLIST;
SELECT user, host, COUNT(*) AS cnt
FROM information_schema.processlist
GROUP BY user, host ORDER BY cnt DESC;

-- 2. 数 sleep 连接：大量 Sleep 说明应用没释放连接（连接池没配好）
SELECT command, COUNT(*) FROM information_schema.processlist GROUP BY command;

-- 3. 处理：杀掉空闲很久的连接（Ids 按第一列取）
KILL 12345;

-- 4. 治本：调小空闲超时让僵尸连接自动断开
SET GLOBAL wait_timeout = 600;
```

判断顺序：连接数高 → 看是不是 sleep 僵尸（应用问题）→ 还是真活跃（业务峰值，扩 `max_connections` 并检查慢 SQL 拖住连接）。

### 8.3 CPU / 内存飙高分析思路

```sql
-- CPU 高：先看是不是数据库内部在跑重 SQL
SHOW PROCESSLIST;                       -- 找 Time 很长、State 是 Sending data 的
SHOW STATUS LIKE 'Threads_running';     -- 活跃线程数突增即有风暴
-- 再结合慢日志锁定语句，explain 补索引

-- 内存：buffer pool 是大头（本来就该吃），异常增长看这些
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW STATUS LIKE 'Created_tmp_disk_tables';  -- 值猛增 = 排序/关联在用磁盘临时表，内存参数不足
```

经验顺序：**CPU 高先抓 SQL，内存异常先看连接数和临时表，磁盘 IO 高先看慢查询**。用 `top`、`iostat -x 1` 先定位是 mysqld 进程再进库内分析。

### 8.4 表损坏修复

```sql
-- 报错 "Table ... is marked as crashed and should be repaired" 时
CHECK TABLE billdb.usage_record;         -- 先检查
REPAIR TABLE billdb.usage_record;       -- MyISAM 表修复
OPTIMIZE TABLE billdb.usage_record;     -- 回收碎片/整理空间，可定期对大表做
```

InnoDB 表极少损坏（有 redo log 自动恢复）；若 InnoDB 起不来报页损坏，先保留 datadir 全量副本再按错误日志处理，**不要反复重启硬碰**。

### 8.5 磁盘满处理（binlog 清理）

```sql
-- 1. 确认是 binlog 占的（/usr/local/mysql/data 下 mysql-bin.0000xx 一堆）
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

## 九、故障场景速查表

### 9.1 连不上数据库

| 现象/排查 | 命令/判断 |
|---|---|
| 端口没起 | `systemctl status mysqld`；`ss -tlnp | grep 3306` |
| 服务起了只允许本机 | `SHOW VARIABLES LIKE 'bind_address';` 非 `0.0.0.0` 要改配置 |
| 防火墙拦了 | `firewall-cmd --add-port=3306/tcp --permanent && firewall-cmd --reload` |
| 账号没远程权限 | host 是 `localhost`：`CREATE USER 'xx'@'192.168.1.%'` 重新授权 |
| 密码错/策略拦 | `ERROR 1045` 核对密码；`SHOW VARIABLES LIKE 'validate_password%';` |
| 连接数满 | `ERROR 1040`：`Too many connections`，按 8.2 节排查，应急先 `SET GLOBAL max_connections=3000` |

### 9.2 主从中断修复

```sql
-- 1. 先看报错类型
SHOW SLAVE STATUS\G
-- 看 Last_IO_Errno / Last_SQL_Errno

-- 2. 常见修复
-- 从库数据被误改导致主键冲突(1062)、记录丢失(1032)等：
--   权衡后跳过 1 个错误事件（生产跳过前先备份现场，且要报备）
STOP SLAVE;
SET GLOBAL sql_slave_skip_counter = 1;
START SLAVE;
-- 8.0.22+ 对应 SET GLOBAL sql_replica_skip_counter = 1;
```

| 报错 | 含义 | 处理 |
|---|---|---|
| `1236 Could not find first log file` | 主库 binlog 被删，从库找不到了 | 重新备份主库，从库重新搭建 change master |
| `1062 Duplicate entry` | 从库已有该数据 | 确认数据一致后 skip counter 跳过 |
| IO 线程 Yes、SQL 线程 No | relay log 重放报错 | 看 Last_SQL_Errno 定位，无法修复则重建从库 |
| 连不上主库 | 网络/账号问题 | `mysql -h192.168.1.10 -urepl -p` 手工测试连通与授权 |

### 9.3 误删恢复思路

| 误操作 | 恢复路径 |
|---|---|
| 误删单库/单表 | 最近全量恢复 + binlog 回放到误删前一刻（见 6.4 节） |
| 误 `UPDATE`/`DELETE` 全表 | 同上：全量 + binlog `--stop-position` 到误操作前 |
| 库还在但数据错乱 | 有从库先查从库，把正确数据导出回补主库 |
| `DROP DATABASE` | binlog 里 DROP 也有位点，恢复全量后回放到 DROP 之前的位置 |

四步法：**停应用防继续写 → 保留 binlog 现场全量拷贝 → 恢复最近备份到临时库验证 → binlog 回放补齐到误操作前**。

## 十、生产上线 Checklist

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
