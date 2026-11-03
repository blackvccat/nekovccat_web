# PostgreSQL 业务表设计

Go 后端把**网站用户**和**Agent 交互**放在 PostgreSQL（`pgdata`）；访客应用的数据/文件和限流计数暂时留在本地 SQLite/文件系统。两类存储职责不同，避免把大文件或高频计数器塞进业务库。

## ER 图

```mermaid
erDiagram
    visitor_accounts ||--o{ visitor_account_apps : "授权应用"
    visitor_accounts ||--o{ agent_conversations : "登录访客"
    agent_conversations ||--o{ agent_turns : "多轮对话"

    visitor_accounts {
        uuid id PK
        text username UK "NFKC + casefold"
        text display_name
        text password_hash "pbkdf2_sha256"
        boolean disabled
        timestamptz created_at
        timestamptz updated_at
    }

    visitor_account_apps {
        uuid account_id PK,FK
        text app_id PK "visitor app id"
    }

    agent_conversations {
        uuid id PK
        text client_session_id UK "浏览器会话 nonce"
        uuid visitor_account_id FK "可空"
        timestamptz created_at
        timestamptz last_active_at
    }

    agent_turns {
        uuid id PK
        uuid conversation_id FK
        text request_id UK "X-Request-ID"
        text user_message
        text assistant_message "可空"
        text status "completed/error/cancelled/timeout"
        text error_code
        text desktop_action
        text model
        integer latency_ms
        timestamptz created_at
        timestamptz finished_at
    }
```

## 表职责

| 表 | 作用 | 关键约束 |
| --- | --- | --- |
| `visitor_accounts` | 访客账号、显示名、PBKDF2 密码哈希、禁用状态 | `username` 唯一；密码哈希只允许 `pbkdf2_sha256` |
| `visitor_account_apps` | 账号到访客应用的授权关系 | 复合主键 `(account_id, app_id)`；`ON DELETE CASCADE` |
| `agent_conversations` | 一个浏览器会话一条记录，记录是否绑定登录访客 | `client_session_id` 唯一；访客删除时置 NULL |
| `agent_turns` | 每个请求一条：用户最后一条消息 + 最终答案 + 状态/耗时 | `request_id` 唯一，重试不会重复插入 |
| `schema_migrations` | 迁移版本 | 启动时自动执行迁移 |

## 设计理由

1. **账号和授权分开**
   应用权限用 `visitor_account_apps` 归一化存储，不塞逗号分隔字符串；查询“哪些账号能用 notebook”不需要扫描/拆字符串。

2. **会话和轮次分开**
   `agent_conversations` 表示浏览器会话，`agent_turns` 表示一轮问答。它不会保存中间草稿、推理内容、工具参数或工具原始返回，只保存用户实际输入和最终答案。

3. **ID 由应用生成**
   UUID 在 Go 侧生成，不依赖 `pgcrypto`，迁移更简单。`request_id` 来自前端 `X-Request-ID`，唯一约束保证幂等。

4. **状态可区分**
   `status` 限定为 `completed/error/cancelled/timeout`。用户停止回复、超时和模型失败不会伪装成成功记录。

5. **密码只存哈希**
   账号 JSON 和数据库都只保存 `pbkdf2_sha256$迭代次数$salt$hash`。登录失败按访客名滚动窗口锁定，避免换 IP 绕过。

## 数据流

```text
visitor-accounts.json ──(visitor-sync)──> visitor_accounts + visitor_account_apps
                                              │
浏览器会话 nonce ──> agent_conversations <────┘（仅登录访客绑定）
       │
       └──> agent_turns（每次请求一条，最终答案/状态/耗时）
```

- 登录时合并读取数据库账号和本地 JSON；同名账号直接拒绝，避免“用哪个密码”的歧义。
- `cmd/visitor-sync` 把 JSON 账号快照 upsert 到 PostgreSQL；不会删除数据库中未出现在快照里的账号。
- `cmd/visitor-hash` 从 stdin 读取密码并输出 PBKDF2 哈希，明文不落盘。
- 每次聊天成功后写 `agent_turns`；失败/取消/超时也会写一行，但 `assistant_message` 为空。
- PostgreSQL 未启用或连接失败时，聊天仍可用，但访客数据库账号与交互记录不可用；`/api/ready` 会返回不可用。

## 启用

```bash
DATABASE_ENABLED=true
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/nekovccat_app
DATABASE_MAX_CONNS=5
```

迁移文件在 `internal/database/migrations/0001_initial.sql`，服务启动时自动执行。

## 保留策略

`agent_turns.user_message` / `assistant_message` 是用户内容，必须按业务要求设置保留期。当前没有自动删除；生产环境建议按天/按月清理，例如：

```sql
DELETE FROM agent_turns WHERE created_at < now() - interval '90 days';
```

不要为了清理日志而删除 `visitor_accounts`；账号与交互记录是两张独立的表。

## 后续迁移

- 访客应用键值数据目前仍在 `work/visitor-app-data.sqlite`。
- 文件仍在 `work/visitor-app-files/`，按应用/访客隔离。
- 聊天配额和登录失败计数仍在 SQLite；如果要多实例共享，下一步再把它们迁到 PostgreSQL 或 Redis。

## Redis 与 PostgreSQL 的分工

| 存储 | 内容 | 特点 |
| --- | --- | --- |
| PostgreSQL | 用户、授权、会话、每轮最终问答 | 持久、可查询，迁移随服务启动执行 |
| Redis | 聊天滚动配额（全站/单 IP 的分钟、小时、24 小时窗口） | 原子 Lua、跨进程共享、自动过期 |
| SQLite / 文件系统 | 访客应用 data/files、登录失败计数 | 本地操作状态，暂不参与多实例共享 |

生产模式要求 `REDIS_ENABLED=true`；Redis 不可用时 `/api/ready` 返回不可用，聊天准入失败关闭。开发模式默认使用进程内配额，便于不启动外部服务。
