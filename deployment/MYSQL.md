# 接入 MySQL（本地从零）

**先说要不要做这件事**：不做也能用。默认 `DATABASE_ENABLED=false`，访客账号就是 `work/visitor-accounts.json` 一份文件，
`scripts/add-visitor.py` 直接维护它，访客模式照样工作。接数据库只在这几种情况下才值得：

- 想把账号和别的系统（WordPress、某个面板、公司已有的库）放在一起管；
- 想让账号跟着数据库走（备份、迁移、多人维护）；
- 想用 SQL 直接查/批量改。

接上去以后 **JSON 那份不会失效**——两份合并读取。合并规则与完整字段说明见
[DATABASE.md](./DATABASE.md)，本文只讲"怎么接上、怎么确认真的接上了"。

---

## 第 0 步：你需要什么

| 需要 | 说明 |
| --- | --- |
| 一个 MySQL | 5.7 或 8.x 都行。本机装、Docker 起、或者用已有的实例 |
| 一个库 | 本篇用 `marcus_app` 这个名字，你可以换 |
| 一个账号 | 只需要这个库的权限，不需要全局权限 |
| 三个 Python 包 | 见第 3 步——**这一步最容易漏，漏了会以为是自己配错了** |

## 第 1 步：建库与账号

用管理员账号连上 MySQL，执行：

```sql
CREATE DATABASE marcus_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'marcus'@'127.0.0.1' IDENTIFIED BY '换成你自己的强密码';
GRANT ALL PRIVILEGES ON marcus_app.* TO 'marcus'@'127.0.0.1';
FLUSH PRIVILEGES;
```

两点值得留意：

- **不用建表**。表由后端启动时自动创建（见第 5 步）。账号只需要这一个库的权限。
- **`'marcus'@'127.0.0.1'` 和 `'marcus'@'localhost'` 在 MySQL 里是两个不同的账号**。连接串里写 `127.0.0.1` 就必须授权给 `'marcus'@'127.0.0.1'`；写成 `localhost` 会走 socket 或另一条授权记录，容易出现"密码明明是对的却 Access denied"。

### 想快速起一个（Docker，可选）

```bash
docker run -d --name marcus-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD='root-strong-password' \
  -e MYSQL_DATABASE=marcus_app \
  -e MYSQL_USER=marcus -e MYSQL_PASSWORD='user-strong-password' \
  mysql:8
```

> MySQL 8 默认用 `caching_sha2_password` 认证，所以第 3 步里的 `cryptography` 是**必须**装的。用 5.7 或把账号改成 `mysql_native_password` 则不需要。

## 第 2 步：把密码里的特殊字符编码好

连接串是 URL 格式，密码里出现 `@ : / # ? %` 这些字符时必须先编码，否则会被当成 URL 的分隔符解析。
一条命令帮你编码：

```bat
backend\.venv\Scripts\python.exe -c "import urllib.parse; print(urllib.parse.quote('你的原始密码', safe=''))"
```

例如原始密码是 `p@ss:word`，编码后是 `p%40ss%3Aword`。
（脚本与后端都会用 `unquote` 解回来，所以你写编码后的形式就行。）

## 第 3 步：装驱动

这一步漏掉最坑，因为**后端不会报错退出**——它照常启动，只是访客登录全 503。

```bat
backend\.venv\Scripts\python.exe -m pip install aiomysql==0.2.0 PyMySQL==1.1.1 cryptography
```

| 包 | 谁用 | 为什么 |
| --- | --- | --- |
| `aiomysql` | 后端运行时 | `DATABASE_URL` 里的 `mysql://` 会被自动换成 `mysql+aiomysql://`，异步连接靠它 |
| `PyMySQL` | `scripts/add-visitor.py --db` | 脚本走同步连接，不拉起整个异步栈 |
| `cryptography` | MySQL 8 才需要 | `caching_sha2_password` 首次认证要它；**`requirements.txt` 里没有这一项**，要手动装 |

前两个在 `requirements.txt` 里，正常 `pip install -r requirements.txt` 应该带上；
如果你这份虚拟环境是早先建的，可能实际没装（本次交付的这份就属于这种情况，三个都没有）。先确认一下：

```bat
backend\.venv\Scripts\python.exe -c "import aiomysql, pymysql; print('驱动 OK')"
```

## 第 4 步：改 `backend/.env`

```ini
DATABASE_ENABLED=true
DATABASE_URL=mysql://marcus:p%40ss%3Aword@127.0.0.1:3306/marcus_app
```

- 前缀写 `mysql://` 就够，后端会自动换成异步驱动（`mysql://`、`mysql+pymysql://` 都映射到 `mysql+aiomysql://`）。
- 库名写在路径位置：`/marcus_app`。
- 改了 `.env` **必须重启后端**（这个文件只在进程启动时读一次）。

## 第 5 步：启动，并确认真的连上了

```bat
scripts\dev-win.bat
```

后端窗口（以及 `work\marcus-backend.log`）里看启动那几行：

| 看到什么 | 含义 |
| --- | --- |
| 什么都没有、`/api/ready` 的 `application_database` 是 `true` | 连上了，表已建好 |
| `警告: 数据库连接失败，将使用无数据库模式: ModuleNotFoundError` | 驱动没装 → 回第 3 步 |
| 同样这行但错误是 `Access denied` / `Unknown database` | 账号或库不对 → 回第 1、2 步 |

表 `visitor_accounts` 会自动建好。想手工建（或确认表结构）也可以，这是应用生成的等价语句：

```sql
CREATE TABLE visitor_accounts (
  id INTEGER NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  apps VARCHAR(255) NOT NULL,
  disabled BOOL NOT NULL,
  created_at DATETIME DEFAULT now(),
  updated_at DATETIME DEFAULT now(),
  PRIMARY KEY (id)
);
CREATE UNIQUE INDEX ix_visitor_accounts_username ON visitor_accounts (username);
```

## 第 6 步：加账号

`add-visitor.py --db` 会自己算 PBKDF2 哈希，**不碰 JSON 那份文件**。
但它默认从 `/etc/marcusweb/backend.env` 读连接串——那是服务器路径，本机没有。
所以要给它指路，两种写法都行：

```bat
:: 方式一：读你自己的 backend\.env（推荐，密码不出现在命令里）
backend\.venv\Scripts\python.exe scripts\add-visitor.py alice --name Alice --ask-password --apps our-space,files --db --db-env backend\.env

:: 方式二：直接给连接串
backend\.venv\Scripts\python.exe scripts\add-visitor.py alice --name Alice --ask-password --apps our-space,files --db --db-url "mysql://marcus:p%40ss%3Aword@127.0.0.1:3306/marcus_app"
```

`--ask-password` 是交互式输入（不进命令历史）。也可以用 `--generate` 生成 20 位随机密码（只打印一次）。
**参数规则**（弄混最容易踩）：给了 `--apps` 又没给任何密码参数＝只改授权；什么都不给＝只改密码。完整表格见 [DATABASE.md](./DATABASE.md) 第六节「日常操作」。

常用操作：

```bat
backend\.venv\Scripts\python.exe scripts\add-visitor.py --db --list --db-env backend\.env          :: 看库里有哪些账号
backend\.venv\Scripts\python.exe scripts\add-visitor.py alice --db --disable --db-env backend\.env :: 停用（--enable 改回）
backend\.venv\Scripts\python.exe scripts\add-visitor.py alice --db --remove --db-env backend\.env  :: 删除
```

## 第 7 步：验证

**(1) 脚本视角**——库里确实有这条：

```bat
backend\.venv\Scripts\python.exe scripts\add-visitor.py --db --list --db-env backend\.env
```

**(2) 应用视角**——"JSON + 数据库"合起来看到的是什么（这才是登录时真正用的名单）：

```bat
cd backend
set DATABASE_ENABLED=true
set DATABASE_URL=mysql://marcus:p%40ss%3Aword@127.0.0.1:3306/marcus_app
.venv\Scripts\python.exe -c "import asyncio;from app.services.visitor_accounts import find_account as f;a=asyncio.run(f('alice'));print('找不到' if a is None else (a.name, a.apps))"
```

期望输出 `('Alice', ('our-space', 'files'))` 这样的一行；`找不到` 说明两份名单里都没有这个名字。
（这条只打印显示名与授权，**不会把 `password_hash` 打到终端上**。）

> 环境变量：Git Bash 用 `export DATABASE_ENABLED=true`；PowerShell 用 `$env:DATABASE_ENABLED='true'`。

**(3) 真实登录**——打开 <http://127.0.0.1:3010/terminal>，访客模式里用新账号登录。

**(4) 直接查表**：

```sql
SELECT username, display_name, apps, disabled, LEFT(password_hash, 22) AS hash FROM visitor_accounts;
```

## 第 8 步：排错表

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 启动日志 `数据库连接失败… ModuleNotFoundError` | 后端驱动 `aiomysql` 没装 | 第 3 步 |
| 跑 `--db` 时提示 `缺少 PyMySQL：它没装在这个虚拟环境里` | 脚本用的同步驱动没装 | 按提示里那条 `pip install PyMySQL` 装（第 3 步） |
| `(2003, "Can't connect to MySQL server")` | MySQL 没起 / 端口不对 / 只监听 socket | 确认服务在跑、端口 3306 可达 |
| `(1045, "Access denied for user")` | 账号或密码不对 | 密码要 URL 编码（第 2 步）；`'user'@'127.0.0.1'` 与 `'user'@'localhost'` 不是同一个账号 |
| `(1049, "Unknown database")` | 库没建 | 第 1 步 |
| `(1044, "Access denied for user … to database")` | 授权没给到这个库 | 补 `GRANT ALL PRIVILEGES ON marcus_app.* TO …` |
| `cryptography package is required` | MySQL 8 认证插件 | 装 `cryptography` |
| 脚本提示 `<路径> 里没有 DATABASE_URL` | 没告诉脚本去哪读连接串 | 加 `--db-env backend\.env` 或 `--db-url "mysql://…"`（第 6 步） |
| 服务起来了，但访客登录**全部 503** | 名单读取失败**关闭**，不会退回 JSON | 看启动日志；这行警告不代表降级成功 |
| 登录 503「访客名单存在重复账号」 | 同一个名字在 JSON 和库里都有 | 删掉或停用其中一份 |
| `Data too long for column 'apps'` | `apps` 列 255 字符上限 | 把该列改成 `TEXT` |

**关于"503 而不是退回 JSON"**：这是刻意设计的。数据库写着 `DATABASE_ENABLED=true` 却连不上时，
如果悄悄退回 JSON 那份名单，你会在完全不知情的情况下按一套旧的账号体系认证。
所以它选择直接失败。实测过：调用名单读取会抛 `VisitorAccountsUnavailable` → 登录 503。

## 与 JSON 那份的关系（要点）

1. **合并，不是替换**：两边都读，JSON 里原有的账号照常能用。
2. **同名 → 整体 503**：不猜用哪一份密码。要把某个账号迁到数据库，先在 JSON 里删掉或停用那条。
3. **JSON 文件不存在** → 纯数据库模式（把文件移走即可）。
4. **改完立刻生效**，不用重启后端——名单每次请求都重读。但改 `.env` 要重启。
5. 停用的账号（`disabled=1`）照常加载，但永远认证不过。

## 安全须知

- **表里只存 PBKDF2-SHA256 哈希**，工具里没有也不要加"明文密码"列。原因很直接：能读到这张表的人
  （同机的 WordPress、面板导出的 `.sql`、备份文件）如果拿到的是明文，就等于拿到了每个访客的口令——
  而访客往往在别处复用同一个密码；拿到哈希则什么都做不了。
- **3306 不要对公网开放**。只给应用所在的主机访问。
- **导出的 `.sql` 是明文的**（里面是哈希，但仍包含账号名单），别放进 `frontend/public/` 这类会被公开访问的目录。
