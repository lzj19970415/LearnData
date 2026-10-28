# 04 SQL语言核心（上午选择题+下午SQL题的地基）

> 师兄先说人话：**SQL 就是"跟数据库说话的固定句式"**。别被厚厚一本语法书吓到——真正要背的就几类句型：建表改表、增删改、查数据、给权限。上午选择题爱考"哪句属于哪类""执行顺序对不对"；下午案例题直接让你**手写 SQL**。这一章就是那道题的地基，句型背熟，考场就是默写。

## 一、SQL 四大分类（先背这张表，年年考）

人话：把数据库想成一家公司——**DDL 是施工队**（盖楼/改楼/拆楼），**DML 是搬运工**（往楼里搬东西、挪东西、扔东西），**DQL 是查楼的保安**（带你去看看东西在哪），**DCL 是行政部门**（决定谁能进哪间屋）。

| 分类 | 全称 | 管什么 | 核心动词 | 一句话记忆 |
|---|---|---|---|---|
| DDL 数据定义语言 | Data Definition Language | 表结构（骨架） | CREATE、ALTER、DROP | 建表/改表/删表 |
| DML 数据操纵语言 | Data Manipulation Language | 表中数据（内容） | INSERT、UPDATE、DELETE | 增/改/删行 |
| DQL 数据查询语言 | Data Query Language | 查数据 | SELECT | 查 |
| DCL 数据控制语言 | Data Control Language | 权限 | GRANT、REVOKE | 发权限/收权限 |

❗【易错】上午题就爱考"归类"：`ALTER TABLE` 改的是**结构**（→ DDL，不是 DML）；`DELETE` 删的是**行**（DML），`DROP` 删的是**整张表**（DDL）；`GRANT/REVOKE` 管的是**权限**（DCL）。

口诀：**建改删表 DDL，增改删行 DML，查数据 DQL，发收权限 DCL。**

## 二、⚠️【必考】完整性约束全家桶

人话：约束就是"数据库自带的质检员"——数据不合规矩，数据库**替你把关直接拒绝**，不用程序一行行去判。案例题常给建表语句挖空让你填约束，或反过来问你某个约束的作用，一字不差背下来。

| 约束 | 语法写法 | 一句话作用 |
|---|---|---|
| PRIMARY KEY（主键） | `Sno CHAR(8) PRIMARY KEY` | 唯一标识一行；等价于"非空 + 全表唯一" |
| FOREIGN KEY（外键） | `FOREIGN KEY (Sno) REFERENCES S(Sno)` | 保证引用的值在被引用表中确实存在 |
| NOT NULL（非空） | `Sname VARCHAR(20) NOT NULL` | 该列必须有值，空值直接拒收 |
| UNIQUE（唯一） | `Sname VARCHAR(20) UNIQUE` | 全表不重复，但**允许 NULL** |
| CHECK（检查） | `CHECK (Sage BETWEEN 0 AND 100)` | 值必须满足给定条件 |
| DEFAULT（默认） | `Sdept VARCHAR(20) DEFAULT '计算机系'` | 不给值时自动填默认值 |

❗【易错】主键 vs UNIQUE：主键一张表只能有一个且不许空；UNIQUE 可以建多个、允许 NULL。

### 建表完整示例（案例题模板，直接背）

经典三张表：学生表 S、课程表 C、选课表 SC。其中 SC 的"组合主键 + 双外键"是案例题最高频考法。

```sql
-- 学生表 S
CREATE TABLE S (
    Sno   CHAR(8)     PRIMARY KEY,                        -- 学号：主键
    Sname VARCHAR(20) NOT NULL,                          -- 姓名：非空
    Ssex  CHAR(2)     CHECK (Ssex IN ('男', '女')),      -- 性别：检查约束
    Sage  INT         CHECK (Sage >= 0 AND Sage <= 100),  -- 年龄：检查约束
    Sdept VARCHAR(20) DEFAULT '计算机系'                   -- 系别：默认值
);

-- 课程表 C
CREATE TABLE C (
    Cno    CHAR(4)     PRIMARY KEY,                       -- 课程号：主键
    Cname  VARCHAR(30) NOT NULL,                          -- 课程名：非空
    Credit INT         DEFAULT 3                          -- 学分：默认 3
);

-- 选课表 SC（⚠️组合主键 + 双外键）
CREATE TABLE SC (
    Sno   CHAR(8),
    Cno   CHAR(4),
    Grade INT CHECK (Grade BETWEEN 0 AND 100),
    PRIMARY KEY (Sno, Cno),               -- 组合主键：学号 + 课程号
    FOREIGN KEY (Sno) REFERENCES S(Sno),  -- 外键1：引用学生表
    FOREIGN KEY (Cno) REFERENCES C(Cno)   -- 外键2：引用课程表
);
```

口诀：**主键定唯一，外键保存在，非空必须有，唯一可空着，检查把好关，默认兜个底。**

## 三、DQL：一条 SELECT 的完整骨架

先看全貌（能背下来最好）：

```sql
SELECT [DISTINCT] 列名1, 列名2     -- 5.最终输出哪些列（DISTINCT 去重）
FROM 表名                          -- 1.先确定从哪张表拿数据
WHERE 行条件                        -- 2.一行一行筛选（这里不能用聚合函数！）
GROUP BY 分组列                     -- 3.按什么把行分堆
HAVING 组条件                       -- 4.把不合格的"堆"整个扔掉（这里能用聚合函数）
ORDER BY 列名 ASC或DESC             -- 6.排序
LIMIT 数字;                         -- 7.只要前几条（MySQL）
```

### ⚠️【必考】逻辑执行顺序

数据库**真正干活的顺序**和书写顺序不一样，这是上午选择题的常客：

| | 顺序 |
|---|---|
| 书写顺序 | SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT |
| 逻辑执行顺序 | **FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT** |

口诀：**先找表（FROM），再筛行（WHERE），然后分堆（GROUP BY），堆里再挑（HAVING），挑完定列（SELECT），最后排序截断（ORDER BY、LIMIT）。**

### ❗【易错】WHERE vs HAVING

| 对比 | WHERE | HAVING |
|---|---|---|
| 作用对象 | 逐行筛（筛"行"） | 分组后筛（筛"组"） |
| 能否用聚合函数（COUNT/AVG 等） | ❌ 不能 | ✅ 能 |
| 执行时机 | 分组前 | 分组后 |
| 不带 GROUP BY | 可单独使用 | 一般与 GROUP BY 连用 |

❗【易错】经典错误写法：`WHERE COUNT(*) > 2` ——错。原因：执行 WHERE 时数据还没分组，聚合函数没有对象可算。正确：`HAVING COUNT(*) > 2`。

### 聚合函数与 NULL（上午常考）

| 函数 | 作用 | 遇到 NULL 怎么办 |
|---|---|---|
| COUNT(*) | 统计**行数** | NULL 行也照数（整行总存在） |
| COUNT(列名) | 统计该列**非空**的行数 | NULL 一律不计入 |
| COUNT(DISTINCT 列名) | 去重后统计 | NULL 不计入 |
| SUM(列) | 求和 | 忽略 NULL；若全为 NULL，结果为 NULL |
| AVG(列) | 平均 | 忽略 NULL 再平均（**分母不含 NULL 行数！**） |
| MAX(列) / MIN(列) | 最大 / 最小 | 忽略 NULL |

❗【易错】`AVG(Grade)` ≠ `SUM(Grade)/COUNT(*)`。AVG 会**先扔掉 NULL 再除**，分母是"非空行数"。

看数字最直观：Grade 列共 5 行——80、90、NULL、70、NULL：

- `COUNT(*)` = 5，`COUNT(Grade)` = 3；
- `AVG(Grade)` = (80+90+70)/3 = **80**，而不是 240/5 = 48。

## 四、多表连接：内、左外、右外、自连接

人话：两张表是两本花名册，连接就是**按共同的"暗号"（连接列）把两页对上**。

| 连接 | 语法 | 结果怎么算 |
|---|---|---|
| 内连接 | `A JOIN B ON A.x = B.x`（或 `WHERE A.x = B.x`） | 只保留两边都配得上的行 |
| 左外连接 | `A LEFT JOIN B ON A.x = B.x` | **左表全保留**，右表配不上的补 NULL |
| 右外连接 | `A RIGHT JOIN B ON A.x = B.x` | **右表全保留**，左表配不上的补 NULL |
| 自连接 | `E1 JOIN E2 ON E1.mgr = E2.emp`（同一张表取两个别名） | 一张表当两张用 |

### 外连接结果差异（看数字最直观）

设 S 表有 3 个学生（S1 张三、S2 李四、S3 王五），SC 表只有 3 条选课记录（S1-C1、S1-C2、S2-C1）——也就是说 S3 没选任何课：

| 查询 | 结果行数 | 说明 |
|---|---|---|
| S JOIN SC（内连接） | 3 行 | S3 没选课，被丢弃 |
| S LEFT JOIN SC | 4 行 | S3 保留，其课程/成绩列补 NULL |
| S RIGHT JOIN SC | 3 行 | 右表 SC 全部配上了，同内连接 |

### 自连接：员工-经理（高频小题型）

员工表 Emp(EmpNo 员工号, Ename 姓名, MgrNo 经理的员工号)。想查"每个员工的姓名 + 他经理的姓名"，就得把 Emp 当两本账用：

```sql
SELECT E1.Ename AS 员工, E2.Ename AS 经理
FROM Emp E1
JOIN Emp E2 ON E1.MgrNo = E2.EmpNo;
```

人话：E1 是"打工人视角"，E2 是"经理视角"，靠"打工人的 MgrNo = 经理的 EmpNo"对上号。

## 五、子查询：查询里再套查询

人话：子查询就是**先算好一个小结果，再拿去当条件用**——像先查出名单，再拿着名单去查人。

### IN / NOT IN

```sql
-- 查选了课的学生姓名
SELECT Sname
FROM S
WHERE Sno IN (SELECT Sno FROM SC);
```

❗【易错】`NOT IN` 的子查询结果里**只要含 NULL，整个查询一行也查不出来**（NULL 参与比较结果是"未知"）。考场遇到 NOT IN 选项，先看子查询的列可不可能为 NULL。

### ⚠️【必考】EXISTS / NOT EXISTS：查"没有…"的经典套路

```sql
-- 经典中的经典：查询没有选修任何课程的学生姓名
SELECT Sname
FROM S
WHERE NOT EXISTS (
    SELECT *
    FROM SC
    WHERE SC.Sno = S.Sno    -- 内层引用了外层的 S.Sno → 相关子查询
);
```

人话：对 S 表每个学生逐个问一句——"选课表里存在他的记录吗？"一条都不存在 → NOT EXISTS 为真 → 他就是没选课的人。

| 写法 | 判断方式 | 出场场景 |
|---|---|---|
| IN / NOT IN | 看值在不在集合里 | 集合小、无 NULL 时 |
| EXISTS / NOT EXISTS | 看子查询**有没有结果**（不看具体值） | 查"没有…"、集合大时效率好 |

**相关子查询**：内层查询**引用了外层的列**，外层每行都要代入算一次（上面 NOT EXISTS 就是）。
**非相关子查询**：内层独立执行一次出结果，外层直接拿去用（上面 IN 那句就是）。

### ANY / ALL

```sql
-- 比"计算机系任意一个学生"年龄大（大于其中任意一个 → 大于最小值）
SELECT Sname, Sage
FROM S
WHERE Sage > ANY (SELECT Sage FROM S WHERE Sdept = '计算机系');

-- 比"计算机系所有学生"年龄大（大于每一个 → 大于最大值）
SELECT Sname, Sage
FROM S
WHERE Sage > ALL (SELECT Sage FROM S WHERE Sdept = '计算机系');
```

| 写法 | 人话等价 |
|---|---|
| > ANY | 大于**最小值** |
| > ALL | 大于**最大值** |
| = ANY | 等于其中某一个 = IN |
| <> ALL | 不等于其中每一个 = NOT IN |

## 六、模糊查询 LIKE 与常用函数

```sql
SELECT Sname FROM S WHERE Sname LIKE '张%';   -- 姓张的（%任意多个字符，可以是0个）
SELECT Sname FROM S WHERE Sname LIKE '张_';   -- 姓张且姓名共2个字（_恰好1个字符）
SELECT Sname FROM S WHERE Sname LIKE '%三%';  -- 名字里带"三"的
```

| 通配符 | 含义 | 例子 |
|---|---|---|
| % | 任意多个字符（含 0 个） | '张%' 匹配 张、张三、张三丰 |
| _ | 恰好 1 个字符 | '张_' 匹配 张三，不匹配 张三丰 |

❗【易错】通配符只在 `LIKE` 里有效；`WHERE Sname = '张%'` 是**精确匹配**字面上的"张%"四个字符，不是模糊查询。

常用函数（MySQL 写法，选择题知道作用即可）：

| 类别 | 函数 | 作用 | 例子 |
|---|---|---|---|
| 字符串 | CONCAT(a, b, ...) | 拼接字符串 | CONCAT('数据','库') → 数据库 |
| | SUBSTRING(s, 起, 长) | 截子串，位置从 1 数起 | SUBSTRING('数据库系统', 1, 3) → 数据库 |
| | UPPER(s) / LOWER(s) | 转大写 / 转小写 | UPPER('sql') → SQL |
| | LENGTH(s) / CHAR_LENGTH(s) | 字节数 / 字符数 | LENGTH('中')→3，CHAR_LENGTH('中')→1 |
| 日期 | NOW() | 当前日期+时间 | 2026-10-28 10:30:00 |
| | CURDATE() | 当前日期 | 2026-10-28 |
| | YEAR(d) / MONTH(d) / DAY(d) | 取年 / 月 / 日 | YEAR(NOW()) → 2026 |
| | DATEDIFF(d1, d2) | 日期差（天） | DATEDIFF('2026-10-28','2026-10-01') → 27 |

> 标准 SQL 里的 CURRENT_DATE、CURRENT_TIMESTAMP 是同类函数，考题见到要认识。

## 七、视图：存起来的一段查询

人话：视图 = **给常用查询起个名字存起来**，用的时候像查表一样方便。它是一张**虚表**——数据库里存的只是"查询定义"，数据本身不复制一份。语法就是套模板：`CREATE VIEW 视图名 AS SELECT 子查询`，建好之后查它跟查普通表一模一样。

### ⚠️【必考】WITH CHECK OPTION 的含义

```sql
CREATE VIEW v_cs AS
SELECT Sno, Sname, Sdept
FROM S
WHERE Sdept = '计算机系'
WITH CHECK OPTION;
```

含义：通过这个视图做 INSERT / UPDATE 时，数据库会检查**改完的数据是否仍满足视图定义中的 WHERE 条件**（即还落不落在视图"视野"内）；不满足就直接拒绝。例：通过 v_cs 插入一个"数学系"的学生 → 拒绝。

### 视图三大好处（一字不差背下来）

| 好处 | 人话 |
|---|---|
| 简化操作 | 复杂多表查询存成视图，以后一句 SELECT 搞定 |
| 安全性 | 只开放部分行/列，敏感列（如工资）藏在视图后面 |
| 逻辑独立性 | 基表结构变了，只需改视图定义，应用程序照用不误 |

## 八、索引：给表配一本"目录"

人话：索引就是**书的目录**——查"第3章"先翻目录再翻页，不用一页页扫。代价是目录本身占地方，而且每改一页正文，目录都得跟着更新。

```sql
CREATE UNIQUE INDEX idx_sname ON S(Sname);   -- 唯一索引
CREATE INDEX idx_sc_sno ON SC(Sno);          -- 普通索引
DROP INDEX idx_sname ON S;                   -- MySQL 删索引
```

| 优点 | 缺点 |
|---|---|
| 查询快：走 B+ 树定位，避免全表扫描 | 占磁盘空间 |
| 索引有序，排序、分组也更高效 | 拖慢 INSERT/UPDATE/DELETE：每次改数据都要维护索引 |

| 什么情况该建 | 什么情况别建 |
|---|---|
| 主键、外键列 | 很小的表（全表扫比走索引还快） |
| 经常出现在 WHERE / JOIN / ORDER BY 里的列 | 频繁大量增删改的表 |
| 大表上取值很分散（区分度高）的列 | 区分度极低的列（如性别只有两个值） |
| | 几乎不作为查询条件的列 |

❗【易错】"索引越多越好"是错的。一句话判断：**索引加速查询、减速更新**。

## 九、⚠️【必考】授权：GRANT / REVOKE

语法框架（一字不差背）：

```sql
GRANT <权限列表> ON <表名> TO <用户> [WITH GRANT OPTION];
REVOKE <权限列表> ON <表名> FROM <用户> [CASCADE | RESTRICT];
```

常用权限：SELECT、INSERT、UPDATE、DELETE、ALTER、ALL PRIVILEGES（全部权限）。

```sql
-- 把 S 表的查询、插入权限授给 user1
GRANT SELECT, INSERT ON S TO user1;
-- 授全部权限，并允许 user2 再转授给别人
GRANT ALL PRIVILEGES ON SC TO user2 WITH GRANT OPTION;
-- 收回权限（CASCADE：user2 转授出去的也一并连锁收回）
REVOKE ALL PRIVILEGES ON SC FROM user2 CASCADE;
```

**WITH GRANT OPTION 的含义**：允许被授权的用户把**本次获得的权限再转授给其他用户**——权限可以"往下传染"。

| 收回方式 | 行为 |
|---|---|
| REVOKE ... CASCADE | 连锁收回：该用户转授出去的权限一并收回 |
| REVOKE ... RESTRICT | 若权限已被转授出去，则**拒绝执行**本次收回 |

❗【易错】GRANT ... **TO** 用户；REVOKE ... **FROM** 用户。介词本身就能出细节选择题。

## 十、DELETE / TRUNCATE / DROP 三兄弟

| 对比项 | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| 语言分类 | DML | DDL | DDL |
| 干什么 | 按条件删行 | 清空整表数据 | 表（数据+结构）彻底删除 |
| 能否带 WHERE | ✅ 能 | ❌ 不能 | 不需要 |
| 日志与回滚 | 逐行记日志，可 ROLLBACK | 不逐行记日志，一般不可回滚 | 不可回滚 |
| 速度 | 慢 | 快 | 最快 |
| 触发器 | 触发 | 不触发 | 表都没了，无从触发 |
| 自增计数器（AUTO_INCREMENT） | 不重置 | 重置归 1 | 随表一起消失 |

人话记忆：**DELETE 是"按行撕纸"（能挑着撕），TRUNCATE 是"整页擦白"（快、回不去），DROP 是"连本子扔掉"（表都没了）**。

## 考前速记卡

- SQL 四分类：DDL（CREATE/ALTER/DROP）、DML（INSERT/UPDATE/DELETE）、DQL（SELECT）、DCL（GRANT/REVOKE）
- 约束六件套：主键定唯一、外键保存在、非空必须有、唯一可空着、检查把好关、默认兜个底
- 逻辑执行顺序：**FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT**
- WHERE 里不能用聚合函数，聚合条件必须放 HAVING
- COUNT(*) 数所有行、COUNT(列名) 跳过 NULL；AVG 求平均时分母不含 NULL 行
- 内连接只留配得上的；左外保留左表、右外保留右表；自连接一张表取两个别名
- 查"没有…"用 **NOT EXISTS** 相关子查询
- LIKE：%任意多字符、_恰好一个字符；通配符对 = 无效
- 视图是虚表；WITH CHECK OPTION = 更新后必须仍在视图范围内；三好处：简化、安全、逻辑独立
- 索引：快查询、慢更新、占空间；小表、低区分度、频繁写的表别建
- GRANT ... TO 用户 [WITH GRANT OPTION]；REVOKE ... FROM 用户 [CASCADE / RESTRICT]
- DELETE 挑行、TRUNCATE 擦页、DROP 扔本

## 自测 5 题（改编自历年真题风格）

**1.** SQL 语句 `ALTER TABLE S ADD COLUMN Ssex CHAR(2);` 属于（　）
A. DQL　　B. DML　　C. DDL　　D. DCL

**2.** 关于 SELECT 各子句的逻辑执行顺序，正确的是（　）
A. WHERE → FROM → GROUP BY → SELECT → HAVING → ORDER BY
B. FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
C. FROM → GROUP BY → WHERE → SELECT → HAVING → ORDER BY
D. SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY

**3.** 查询"没有选修任何课程的学生姓名"，正确的 SQL 是（　）
A. `SELECT Sname FROM S JOIN SC ON S.Sno = SC.Sno;`
B. `SELECT Sname FROM S WHERE EXISTS (SELECT * FROM SC WHERE SC.Sno = S.Sno);`
C. `SELECT Sname FROM S WHERE NOT EXISTS (SELECT * FROM SC WHERE SC.Sno = S.Sno);`
D. `SELECT Sname FROM S WHERE Sno IN (SELECT Sno FROM SC);`

**4.** 下列关于视图的说法，**错误**的是（　）
A. 视图是虚表，数据库中只存储其定义
B. 视图可以简化用户操作，并提供一定的安全性
C. 视图能够提供数据的逻辑独立性
D. 任何视图都能和基表一样随意更新

**5.（手写题）** 已知 S(Sno, Sname, Ssex, Sage, Sdept)，查询男生人数超过 2 人的系，输出系名和人数，按人数从多到少排列。请写出完整 SQL。

---

**答案与解析**

1. **C**。ALTER 修改的是表结构（骨架），属于数据定义语言 DDL；只有操作"表里的行"才是 DML。
2. **B**。先找表、再筛行、然后分组、组筛完才定列、最后排序。记住：WHERE 在 GROUP BY 前，HAVING 在 SELECT 前。
3. **C**。A 内连接只能查出选了课的学生；B、D 查的恰好是"选了课的学生"；C 用 NOT EXISTS 相关子查询，对每个学生问一句"选课表里有没有他"，没有的才输出。
4. **D**。含聚合函数、GROUP BY、多表连接的视图通常不可更新；带 WITH CHECK OPTION 的视图还要求更新后仍在视图范围内。A、B、C 正是视图的标准三大好处。
5. 参考答案：

```sql
SELECT Sdept AS 系名, COUNT(*) AS 人数
FROM S
WHERE Ssex = '男'
GROUP BY Sdept
HAVING COUNT(*) > 2
ORDER BY 人数 DESC;
```

要点：筛行用 WHERE（不能写 COUNT）；对"组"设条件用 HAVING（可以用聚合函数）；排序在最后。三个子句一个都不能少，顺序写错一分没有。

> AI生成
