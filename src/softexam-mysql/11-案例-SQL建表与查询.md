# 11 案例实战二：SQL建表与查询（下午第二件套）

> 前置：SQL 语法详解在 [04 SQL语言核心](04-SQL语言核心.md)；答题总纲见 [09 案例答题总纲与评分套路](09-案例答题总纲与评分套路.md)。

SQL 题是下午卷里**最实在的一件**：不玩虚的，写对了就是满分，写错一个关键词就是扣一处。它完全靠**模板 + 细心**——语法是死的，评分点是一个一个拆开的，不像 ER 图还要"理解业务"。对在职小白来说，这是性价比最高、最该优先拿满的大题。

## 一、题型与评分点速览

| 常见问法 | 评分点拆解方式 |
| --- | --- |
| 写出建表语句 | 按约束逐个给分：主键、外键、CHECK、非空、唯一、默认，一个一分 |
| 补全/写出查询语句 | 按子句给分：FROM 对了给一点、连接条件对了给一点、WHERE/GROUP BY/聚合函数各占一点 |
| 建立视图 | CREATE VIEW 语法 + 查询部分照常拆分 |
| 授权 | GRANT 句式、权限列表、对象、用户，四点全踩才满分 |
| 建索引 / 说明约束作用 | 句式 + 标准表述句（背模板句） |

⚠️【必考】SQL 题的判分是"按子句踩点"，意味着**哪怕最后没写完，骨架正确也能捞到结构分**——这就是 09 篇强调"先写框架再填条件"的原因。

## 二、⚠️建表题模板：六种约束一个不漏

### 书写规范

- 关键字大写，**每种约束单独一行**，方便阅卷逐条找分；
- **先建被参照表（父表），再建含外键的表（子表）**——department 先建，employee 后建；
- 字段类型速记：编号类 CHAR/VARCHAR、整数 INT、金额 DECIMAL(总位数, 小数位)。

### 完整示例（部门表 + 职工表，六种约束全齐）

```sql
CREATE TABLE department (
    dno     CHAR(4)      PRIMARY KEY,          -- ①主键约束
    dname   VARCHAR(20)  NOT NULL UNIQUE       -- ②非空 ③唯一
);

CREATE TABLE employee (
    eno     CHAR(6)      PRIMARY KEY,          -- ①主键
    ename   VARCHAR(20)  NOT NULL,             -- ②非空
    salary  DECIMAL(8,2) CHECK (salary >= 0),  -- ④CHECK：工资不能为负
    age     INT          DEFAULT 18,
                        CHECK (age BETWEEN 16 AND 65),  -- ④CHECK：年龄范围
    dno     CHAR(4),                           -- 外键列
    FOREIGN KEY (dno) REFERENCES department(dno)        -- ⑤外键
);
```

六种约束一次集齐：**主键 PRIMARY KEY、非空 NOT NULL、唯一 UNIQUE、检查 CHECK、默认 DEFAULT、外键 FOREIGN KEY … REFERENCES**。写完建表语句，回头默数一遍这六个词，缺哪个补哪个。

### 约束作用一句话表（考试常问"说明该约束的作用"，标准答案逐条背）

| 约束 | 标准答案（一句话版） |
| --- | --- |
| PRIMARY KEY（主键） | 主键列取值**唯一且非空**，用于唯一标识表中的每一个元组 |
| NOT NULL（非空） | 该列取值不能为空，必须填写 |
| UNIQUE（唯一） | 该列取值不能重复，保证唯一性 |
| CHECK（检查） | 插入或更新时该列取值必须满足给定条件，不满足则拒绝操作 |
| DEFAULT（默认） | 插入时未给该列赋值时，自动填入默认值 |
| FOREIGN KEY（外键） | 保证**参照完整性**：该列取值要么为空，要么必须在被参照表（父表）的主键列中存在 |

❗【易错】外键作用的标准答案是**"保证参照完整性"**——这五个字就是踩分关键词。只写"跟别的表关联"不给分。

## 三、经典查询套路清单（每类一条标准例句）

以下示例统一用 department(dno, dname) 和 employee(eno, ename, salary, dno, age) 两张表。

### 套路一：多表连接查询（JOIN … ON）

```sql
-- 查每个员工及其所在部门名称
SELECT e.ename, d.dname
FROM   employee e JOIN department d ON e.dno = d.dno;
```

要点：**连接条件 ON 必须写**，忘了写就成笛卡尔积；老式写法 `FROM department d, employee e WHERE d.dno = e.dno` 也算对，但 JOIN…ON 结构更不容易漏条件。

### 套路二：分组统计（GROUP BY + 聚合 + HAVING）

```sql
-- 统计各部门人数
SELECT   d.dname, COUNT(*) AS 人数
FROM     employee e JOIN department d ON e.dno = d.dno
GROUP BY d.dname;
```

⚠️【必考】**HAVING 专管"聚合结果的条件"**：

```sql
-- 只显示平均工资高于 5000 的部门
SELECT   d.dname, AVG(e.salary) AS 平均工资
FROM     employee e JOIN department d ON e.dno = d.dno
GROUP BY d.dname
HAVING   AVG(e.salary) > 5000;
```

记死这条线：**WHERE 在分组前筛"行"，HAVING 在分组后筛"组"**。`WHERE AVG(...)>5000` 是必错项——WHERE 阶段还没有"组"可算平均。

### 套路三：子查询（IN / NOT EXISTS）

```sql
-- IN：查出"工资高于 5000 的员工所在"的部门名
SELECT dname
FROM   department
WHERE  dno IN (SELECT dno FROM employee WHERE salary > 5000);
```

**"查没参加X的人/没员工的部门"→ NOT EXISTS 套路**（三步搭积木）：

```sql
-- 查没有任何员工的部门
SELECT d.dno, d.dname
FROM   department d
WHERE  NOT EXISTS
       (SELECT * FROM employee e WHERE e.dno = d.dno);
```

搭法口诀：**外层摆全员，内层挑"参加的"，前面加 NOT 一翻就是"没参加的"。** 内外两层的关联条件（e.dno = d.dno）千万别忘，忘了直接全错。

### 套路四：模糊查询 LIKE

```sql
-- 查姓"张"的员工
SELECT eno, ename
FROM   employee
WHERE  ename LIKE '张%';
```

通配符记两个：`%` 任意长字符串（含空串），`_` 恰好一个字符。`LIKE '张%'`=姓张，`LIKE '张_'`=姓张且名只有一个字。

### 套路五：排序 + 限量（ORDER BY … LIMIT n）

```sql
-- 查工资最高的 3 名员工（Top-N 套路）
SELECT eno, ename, salary
FROM   employee
ORDER BY salary DESC
LIMIT 3;
```

DESC 别忘写——不写默认升序，"最高"就变"最低"。LIMIT 是 MySQL 写法（标准 SQL 里也有 FETCH FIRST，考试用 LIMIT 即可）。

### 套路六：自连接

同一张表当两张用，各起别名：

```sql
-- 假设 employee 表加一列 mgr（存上级的 eno），查"每个员工和他的经理"
SELECT w.ename AS 员工, m.ename AS 经理
FROM   employee w JOIN employee m ON w.mgr = m.eno;
```

场景特征：题干出现"**上下级、员工与经理、同班同学**"这类"自己和自己比"的句式，就是自连接。

## 四、视图题

```sql
-- 建视图：各部门平均工资
CREATE VIEW v_dept_salary AS
SELECT   d.dno, d.dname, AVG(e.salary) AS avg_salary
FROM     department d JOIN employee e ON e.dno = d.dno
GROUP BY d.dno, d.dname;
```

**WITH CHECK OPTION 的标准答法**（高频小问，背这句）：

```sql
CREATE VIEW v_high AS
SELECT eno, ename, salary
FROM   employee
WHERE  salary > 5000
WITH CHECK OPTION;
```

> 标准答案：WITH CHECK OPTION 用于保证**对视图执行 INSERT、UPDATE、DELETE 操作时，操作结果必须仍然满足视图定义中的条件**（仍在视图范围内），否则拒绝执行，防止通过视图修改出"视图自己看不见"的数据。

作用类小问再补一句通用弹药：**视图能简化用户查询、提供逻辑数据独立性、实现安全性保护（不同用户授权不同视图）**——三个作用按需取用（详见 [04 SQL语言核心](04-SQL语言核心.md)）。

## 五、授权题

```sql
-- 授权：user1 可以查询和插入 employee 表
GRANT SELECT, INSERT ON employee TO user1;

-- 可转授（考试常考 WITH GRANT OPTION：user1 还能把权限转给别人）
GRANT SELECT ON employee TO user1 WITH GRANT OPTION;

-- 收权
REVOKE INSERT ON employee FROM user1;
```

固定句式背死：**GRANT 权限 ON 对象 TO 用户；REVOKE 权限 ON 对象 FROM 用户**——TO 后面是"人"，FROM 后面也是"人"，写反了整空全扣。

## 六、索引题

```sql
CREATE INDEX idx_emp_salary ON employee(salary);
CREATE UNIQUE INDEX idx_emp_eno ON employee(eno);
```

**"什么列适合建索引"的标准答法**（四条，按题意挑两三条写）：

1. **经常出现在 WHERE、连接条件、ORDER BY / GROUP BY 中的列**；
2. **主键列和外键列**（主键通常自动建索引）；
3. **区分度高**（取值种类多、重复少）的列；
4. 查询多、更新少的表收益大。

反向提醒（有时考"不适合"）：**频繁更新的列、区分度极低的列（如性别只有两个值）**不适合建索引——索引是空间和维护成本换查询速度，不是越多越好（详见 [08 MySQL专项高频考点](08-MySQL专项高频考点.md)）。

## 七、⚠️演练题（改编自历年真题风格）

> 已知两个表结构：
>
> - **employee（职工表）**：eno（职工号，主键）、ename（姓名）、salary（工资）、dno（所在部门号，外键，引用 department 的 dno；**新入职员工可能尚未分配部门，此时 dno 为空**）、age（年龄）
> - **department（部门表）**：dno（部门号，主键）、dname（部门名）
>
> 假设员工姓名不重复，年龄默认为 18，工资不得为负。

**问题：**

① 写出创建这两张表的 SQL 语句，要求包含以下全部约束：主键、外键、CHECK、NOT NULL、UNIQUE、DEFAULT。

② 统计各部门的平均工资，只显示部门名、平均工资，且**只列出平均工资大于 5000** 的部门。

③ 查询工资**高于全公司平均工资**的员工的职工号、姓名、工资。

④ 查询**尚未分配部门**的员工的职工号、姓名；并写出它的变式：查询**没有任何员工**的部门的部门号、部门名。

⑤ 建立"各部门平均工资"视图，并授予用户 user1 对该视图的查询权限。

先自己写完再往下对答案，SQL 是写会的，不是看会的。

## 八、参考答案与评分点

### 第①问：建表含六约束

```sql
CREATE TABLE department (
    dno     CHAR(4)      PRIMARY KEY,
    dname   VARCHAR(20)  NOT NULL UNIQUE
);

CREATE TABLE employee (
    eno     CHAR(6)      PRIMARY KEY,
    ename   VARCHAR(20)  NOT NULL,
    salary  DECIMAL(8,2) CHECK (salary >= 0),
    age     INT          DEFAULT 18,
    dno     CHAR(4),
    FOREIGN KEY (dno) REFERENCES department(dno)
);
```

| 评分点 | 说明 |
| --- | --- |
| 先建 department、后建 employee | 顺序反了外键无处参照，可能被判逻辑错 |
| PRIMARY KEY ×2 | 两表主键各占分 |
| FOREIGN KEY (dno) REFERENCES department(dno) | 六约束里最值钱的一条，**REFERENCES 必写** |
| NOT NULL（ename、dname） | 写一处即算踩点 |
| UNIQUE（dname） | 借"姓名不重复/部门名不重复"的题干假设放在 dname |
| CHECK（salary >= 0） | 条件随题干走 |
| DEFAULT（age = 18） | 题干"默认 18"就是让你写 DEFAULT |

### 第②问：分组统计 + HAVING

```sql
SELECT   d.dname, AVG(e.salary) AS 平均工资
FROM     employee e JOIN department d ON e.dno = d.dno
GROUP BY d.dname
HAVING   AVG(e.salary) > 5000;
```

| 评分点 | 说明 |
| --- | --- |
| FROM 含两表 + JOIN…ON 连接条件 | 缺连接条件 = 笛卡尔积，重扣 |
| 聚合函数 AVG(e.salary) | 用 SUM/COUNT 者此空 0 分 |
| GROUP BY d.dname | 分组字段错了后面全塌 |
| **HAVING** AVG(e.salary) > 5000 | 写在 WHERE 里 = 此空 0 分，本题最大的坑 |
| SELECT 列含 dname 与平均工资 | 题目要什么给什么，多列不扣、缺列扣 |

### 第③问：子查询比较平均

```sql
SELECT eno, ename, salary
FROM   employee
WHERE  salary > (SELECT AVG(salary) FROM employee);
```

| 评分点 | 说明 |
| --- | --- |
| 子查询 SELECT AVG(salary) FROM employee | 内层聚合对象是全表、无 GROUP BY |
| 外层用 salary > 子查询 整体作条件 | 子查询要用括号包住 |
| SELECT 返回三列齐全 | 题干点名要的列别偷懒 |

### 第④问：空值判断 + NOT EXISTS

```sql
-- (1) 尚未分配部门的员工
SELECT eno, ename
FROM   employee
WHERE  dno IS NULL;

-- (2) 变式：没有任何员工的部门
SELECT d.dno, d.dname
FROM   department d
WHERE  NOT EXISTS
       (SELECT * FROM employee e WHERE e.dno = d.dno);
```

| 评分点 | 说明 |
| --- | --- |
| **IS NULL**（写成 `= NULL` 直接 0 分） | 空值只能用 IS NULL 判断，机考手滑高发区 |
| NOT EXISTS 句式 | 用 LEFT JOIN … WHERE e.dno IS NULL 的写法同样给分 |
| 内外层关联条件 e.dno = d.dno | 没有它查出来的就是"全部部门" |

### 第⑤问：建视图 + 授权

```sql
CREATE VIEW v_dept_salary AS
SELECT   d.dno, d.dname, AVG(e.salary) AS avg_salary
FROM     department d JOIN employee e ON e.dno = d.dno
GROUP BY d.dno, d.dname;

GRANT SELECT ON v_dept_salary TO user1;
```

| 评分点 | 说明 |
| --- | --- |
| CREATE VIEW 视图名 AS SELECT … | 句式骨架分 |
| 查询部分：连接 + AVG + GROUP BY | 视图里的 SELECT 照样按套路二拆点给分 |
| GRANT SELECT ON 视图 TO user1 | 权限、对象、用户三要素全对才满分 |

## 九、❗细节丢分提醒（SQL 卷上的"隐形杀手"）

| # | 翻车现场 | 后果 | 对策 |
| --- | --- | --- | --- |
| 1 | 语句末尾**没写分号** | 语法不完整，可能整句受牵连 | 每写完一句，眼光扫一下行尾 |
| 2 | 字符串用了**双引号** "5000" | 标准字符串必须**单引号** '5000'，双引号是标识符 | 只认英文单引号 |
| 3 | **中文输入法**的引号、逗号、分号 | 看起来一样、编译必错，阅卷也判错 | 打 SQL 前确认输入法为英文状态 |
| 4 | **字段名手滑打错**（sallary、depno） | 找不到列，句子再顺也错 | 字段名直接从题干表结构里抄，别凭记忆默写 |
| 5 | 外键忘写 **REFERENCES** | 外键约束这分白丢 | 建表后默数六约束 |
| 6 | `= NULL` 判空 | 永远查不到 | 空值判断只有 IS NULL / IS NOT NULL |
| 7 | 聚合条件塞进 WHERE | 逻辑硬伤 | 组级条件进 HAVING |

细节口诀：**"句尾分号、单引号、英文输入、照抄字段名。"**

## 十、考前速记卡

- 建表六约束：**主键、外键、CHECK、NOT NULL、UNIQUE、DEFAULT**——写完默数一遍
- 外键作用标准句：**保证参照完整性**
- 查询六行骨架：SELECT→FROM→WHERE→GROUP BY→HAVING→ORDER BY，**聚合条件进 HAVING**
- NOT EXISTS 套路口诀：**外层摆全员，内层挑参加，加 NOT 求没参加**
- 判空只有 **IS NULL**；Top-N = ORDER BY … DESC LIMIT n
- 授权句式：**GRANT 权限 ON 对象 TO 用户**；收权 FROM
- 适合建索引：WHERE/JOIN/ORDER BY 常客、主外键、区分度高；不适合：频繁更新、性别类低区分度列
- 细节四件套：**分号、单引号、英文输入、字段名照抄**

下一件进入全卷最"数学"的部分 → [12 案例-候选键与范式分解](12-案例-候选键与范式分解.md)

> AI生成
