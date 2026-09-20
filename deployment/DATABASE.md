# 访客账号存数据库（MySQL / PostgreSQL）

访客账号有两种存法，**可以同时用**：服务器上一份 JSON 文件，和数据库的 `visitor_accounts` 表。
开数据库**不会**让 JSON 失效——两份合并读取，所以「保留原来的两个默认账户、同时用数据库加新账户」就是默认行为。
日常管理用 `scripts/add-visitor.py --db`，不用手写 SQL，也不用自己算密码哈希。

> 密码只以 PBKDF2-SHA256（600k 次迭代、每条随机盐）落库，**哪一边都不存明文**。
> 这不是洁癖：这台机器上还跑着 WordPress，面板能导出 `.sql`，备份文件也是明文的——
> 凡是能读这张表的人，就等于拿到了每个访客的口令（而访客往往在别处复用同一个密码）；
> 拿到哈希则什么都做不了。工具里没有、也不要加"明文密码"列。

## 一、先分清两个数据库

这两件事都在"数据库"名下，但完全不同，排查时别串了：

| | 存什么 | 在哪 | 谁读写 | 驱动 |
| --- | --- | --- | --- | --- |
| 访客账号 | 访客名、显示名、密码哈希、授权应用 | MySQL `terminal.visitor_accounts` | `backend/app/models/visitor.py` + `database.py` | SQLAlchemy 异步（`aiomysql` / `asyncpg`） |
| 限流计数 | 每桶的付费轮次、登录窗口、失败次数 | SQLite `/var/lib/marcusweb-harness/chat-limits.sqlite` | `backend/app/security.py` | 标准库 `sqlite3` 直连 |

限流那个库跟 `DATABASE_ENABLED` 无关，也不在本文范围内——它在 `CHAT_LIMIT_DB`（默认 `work/chat-limits.sqlite`），由 `backend/app/security.py` 用标准库 `sqlite3` 直接读写。

## 二、相关代码都在哪

| 文件 | 职责 | 关键位置 |
| --- | --- | --- |
| `backend/app/database.py` | 引擎与会话；把同步 URL 换成异步驱动；建表 | `normalize_database_url()`、`get_sessionmaker()`、`init_db()` |
| `backend/app/models/visitor.py` | 表结构定义 | `VisitorAccountRecord` |
| `backend/app/services/visitor_accounts.py` | 名单加载（**合并两份来源**）与密码校验 | `_database_accounts()`、`_load_accounts()`、`find_account()`、`authenticate()` |
| `backend/app/config.py` | 开关与连接串 | `DATABASE_ENABLED`、`DATABASE_URL` |
| `backend/app/main.py` | 启动时建表、退出时释放 | `lifespan()` 里调 `init_db()` / `close_db()` |
| `backend/app/api/routes/visitor.py` | 登录接口（自己不经手数据库，走 `visitor_accounts`） | `/api/visitor/login` |
| `scripts/add-visitor.py` | 运维工具：`--db` 直写数据库，也管 JSON 那份 | `run_database()`、`upsert_sql()`、`parse_db_url()` |
| `backend/tests/test_visitor_login.py` | 回归测试 | `DatabaseStoreTests`、`MergedStoreTests`、`AccountScriptTests`、`DatabaseUrlTests` |

## 三、表结构

`visitor_accounts`（启动时由 `init_db()` 自动建，无需手工建表）：

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int 自增主键 | |
| `username` | varchar(64)，**唯一索引** | 规范化后的访客名（小写、去空白、NFKC），登录时也按这个比对 |
| `display_name` | varchar(64) | 访客页上显示的名字 |
| `password_hash` | varchar(255) | `pbkdf2_sha256$600000$<盐>$<摘要>`；**不存明文** |
| `apps` | varchar(255) | 授权应用 id，逗号分隔（如 `our-space,files`）；空串＝没有可用应用 |
| `disabled` | tinyint/bool | 1 = 停用：记录留着但永不通过认证 |
| `created_at` / `updated_at` | datetime | 数据库自己维护 |

`apps` 是 **255 字符**的上限——这是"能授多少应用"的真正天花板（大约 15～20 个 id）。真要更多，把这一列改成 `TEXT`。

## 四、运行时行为（合并规则）

`_load_accounts()` 每次请求都会重新读，所以**改完立刻生效，不用重启后端**。规则是：

1. `DATABASE_ENABLED=true` → 先读数据库全部行；`VISITOR_ACCOUNTS_PATH` 那份文件若存在，再读它。
2. **同名访客同时出现在两边 → 直接拒绝**（抛 `VisitorAccountsUnavailable`，登录返回 503「访客名单存在重复账号」）。
   不猜用哪一份密码，也不静默取其一——这种歧义正是登录闸门不能猜的东西。
3. 文件不存在 → 只读数据库（想切成"纯数据库模式"，把文件移走即可）。
4. **数据库不可用 → 直接失败，不退回只读文件**：不会因为数据库挂了就悄悄降级成另一套名单。
5. 两边合起来一个可用账户都没有 → 也算未配置（503）。
6. 停用的账号（`disabled=1`）照常加载，但 `authenticate()` 永远返回 `None`。
7. 未知访客名也会走一次同样的哈希计算（防时间侧信道探测账号是否存在）。

规范化：NFKC + 去首尾空白 + casefold。`Alice`、`ALICE`、`Ａｌｉｃｅ`、前后带空格的写法都指向同一个账户。

## 五、配置

`/etc/marcusweb/backend.env`（`0600 root:root`，密码只在这里）：

```bash
DATABASE_ENABLED=true
DATABASE_URL=mysql://Terminal:<密码>@127.0.0.1:3306/terminal
```

- URL 前缀会被自动换成异步驱动：`mysql://` 与 `mysql+pymysql://` → `mysql+aiomysql://`，`postgres://` 与 `postgresql://` → `postgresql+asyncpg://`（见 `normalize_database_url()`）。
- 依赖：Web 端用 `aiomysql`（MySQL）/`asyncpg`（PostgreSQL），脚本用 `PyMySQL`/`psycopg2`，四个都在 `requirements.txt` 里。
- **MySQL 版本决定要不要额外装 `cryptography`**：5.7 默认 `mysql_native_password`，不用；MySQL 8 的 `caching_sha2_password` 首次认证需要它（当前 server 是 5.7.44，所以现装即可用）。
- 连接串里带 `@`、`:` 这类字符的密码要 URL 编码（脚本用 `urllib.parse.unquote` 解回来）。
- 改完 `systemctl restart marcusweb-backend`。**建表失败不会拦住服务启动**：`init_db()` 只打印一行警告，此时登录会 503——所以重启后要看一眼 journal 里有没有「数据库初始化成功」。

## 六、日常操作（`--db`）

服务器上用后端的 venv 跑（连接串默认从 `/etc/marcusweb/backend.env` 读，也可 `--db-url` 直接给）：

```bash
PY=/srv/marcusweb/current/backend/.venv/bin/python
SC=/srv/marcusweb/current/scripts/add-visitor.py

$PY $SC alice --name alice --ask-password --apps our-space,files --db   # 建号：交互输密码 + 授权
$PY $SC alice --generate --apps files --db                          # 换随机强密码
$PY $SC alice --apps files --db                                     # 只改授权，密码一个字都不碰
$PY $SC alice --ask-password --db                                   # 只改密码，其余字段全保留
$PY $SC --db --list                                              # 看数据库里现有账号
$PY $SC alice --db --disable                                        # 停用（--enable 改回）
$PY $SC alice --db --remove                                         # 删除
```

**参数规则**（弄混了最容易踩）：

| 写法 | 结果 |
| --- | --- |
| `--ask-password` | 交互输入密码（不进命令历史），推荐 |
| `--generate` | 生成 20 位随机密码，只打印这一次 |
| `--password 'x'` | 直接给定（会留在命令历史里） |
| 三个都不给 + 带 `--apps` | **只改授权**，密码不动（批量加应用时不会重置口令） |
| 三个都不给 + 不带 `--apps` | **只改密码**，显示名/授权/停用状态全部保留 |
| 没给 `--name` | 保留原显示名（新建时用访客名当显示名） |

密码至少 8 位。`--db` 只碰数据库，**不会动那份 JSON 文件**。

## 七、加新应用与授权

可用应用不是你随便写的字符串，而是**应用注册表**里定义的 id：

1. 在 `VISITOR_APPS_DIR`（服务器上 `/var/lib/marcusweb-private/visitor-apps/`）下新建一个以应用 id 命名的文件夹：

   ```text
   visitor-apps/photos/
   ├── app.json          ← 元数据与能力声明
   ├── index.html        ← 入口 HTML（连同它引用的 js/css/图片）
   └── assets/           ← 该应用自己的图标 / 壁纸（可选）
   ```

   ```json
   {
     "apiVersion": 1,
     "id": "photos",
     "title": "Photos",
     "subtitle": "只读：分享的照片",
     "entry": "index.html",
     "permissions": ["files"],
     "embeds": []
   }
   ```

   `entry` 必填（界面由它提供）；还能写 `icon`、`wallpaper`、`watermark`、`window`（素材文件放**这个应用自己的** `assets/`）、`permissions`（`files` 上传下载 / `data` 键值数据）、`embeds`（允许内嵌的第三方源）。界面在登录后由服务器下发，**不用改代码也不用重启**（目录每次请求重读）。移植一个应用 = 复制整个 `<id>/` 文件夹到对方的 `VISITOR_APPS_DIR`。

2. 授权给访客：`$PY $SC alice --apps our-space,files,photos --db`（**整份替换**，要把原有的都列上）。
3. 注册表里没有的 id **不会报错**：它会写进库，但访客页上被静默过滤掉。脚本会提醒一句（写错 id 也走这条路）。

## 八、怎么验证

```bash
# 1) 只看账号，别打印 password_hash 之外没用的东西（一定要 mode=ro，见第十二节第 7 条）
MYSQL_PWD='<密码>' mysql -u Terminal -D terminal \
  -e 'select username, display_name, apps, disabled, left(password_hash,22) as hash from visitor_accounts;'

# 2) 用应用自己的加载逻辑核对（JSON 与数据库合起来看到的是什么）
cd /srv/marcusweb/current/backend && DEBUG=false \
  DATABASE_ENABLED=true DATABASE_URL='<url>' VISITOR_ACCOUNTS_PATH=<路径> \
  .venv/bin/python -c "
import asyncio
from app.services import visitor_accounts as va
async def main():
    for n in ('alice', 'guest', 'bob', 'nobody-here'):
        a = await va.find_account(n)
        print(n, '->', (a.name, a.apps, a.disabled) if a else '找不到')
asyncio.run(main())"

# 3) 真实登录（登录窗口 6 次/分钟，错误凭据返回 401，额度用完/名单不可用是 503）
#    探针做法：用一个不存在的访客名连打 4 发，前 3 发 401、第 4 发会被试次闸门挡下（429 + Retry-After: 30），
#    不消耗模型额度也不会锁到真实账号。
```

回归测试：`cd backend && .venv/bin/python -m unittest discover -s tests -v`
（数据库相关：`DatabaseStoreTests` 只读数据库、`MergedStoreTests` 合并与同名拒绝、`AccountScriptTests` 覆盖 `--db` 的 URL 解析/upsert/交互密码/字段保留、`DatabaseUrlTests` 覆盖驱动映射。）

## 九、已知约束与坑

- **别把 JSON 里已有的名字加进数据库**：两边同名会让访客登录整体 503。要接管就先在 JSON 里删掉或停用那条。
- **改密码只改密码**：显示名、授权、停用状态都会保留（曾经有一版会把它们一起冲掉，现在有测试盯着）。
- **`apps` 列 255 字符上限**：超了脚本会直接告诉你去改列类型，而不是抛 MySQL 的 `Data too long`。
- **3306 不要对公网开**：现在实测从公网连不上（云安全组挡着），只在内网可达——但即便这样也别存明文，见文首的理由。
- **`DATABASE_ENABLED=true` 但连接串写错**：服务照常起来（`init_db()` 吞异常只打警告），只是访客登录全 503。改完连接串务必看 journal。
- **别在内存很小的机器上构建**：构建 Next 约需 2GB 内存，内存不足时在别处构建、只把产物传过去。
