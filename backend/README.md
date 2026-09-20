# Marcus Backend

FastAPI 通过官方 `deepseek-harness-sdk` 运行 DeepSeek Harness。SDK 管理原生 `dsh` 子进程，使用 `deepseek-v4-pro` 执行真实 Agent 工具循环。项目的 `agent/website.patch.yml` 只允许 `site_info` 和 `desktop_apps` 两个受限站内工具；访客凭据从不进入模型。

## 本地启动

使用 Python 3.11 / 3.12。当前锁定的 Harness SDK 是官方开发预览版 `0.1.5rc1`；它自动安装匹配的原生 runtime wheel，本机 macOS 14+ arm64 无需额外安装 Node.js 来运行 SDK。

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
```

在本机 `backend/.env` 设置 `DEEPSEEK_API_KEY`。先按项目根目录说明准备 Harness 的站内插件与 profile，再启动整个项目；只启动 API 可用：

```bash
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8110
```

- API 健康检查：`http://127.0.0.1:8110/api/health`
- Swagger 文档：`http://127.0.0.1:8110/docs`
- Harness 子进程：由 API 按请求创建，完成、失败、超时或断开后关闭

`/api/health` 只报告 FastAPI 存活；验证 AI 必须实际调用聊天接口。当前聊天不保存到 PostgreSQL，默认 `DATABASE_ENABLED=false`；需要数据库功能时可显式启用初始化。

## API 协议

`POST /api/chat/`：

```json
{"messages":[{"role":"user","content":"Terminal 桌面有哪些应用？"}]}
```

支持 `user` / `assistant` 多轮历史，最后一条必须为 `user`。官方 SDK 接收单次用户输入，因此历史按 `previous_context` JSON 数组保留每条 `role` / `content`，本轮问题放在 `input`，不会逐轮重放或额外调用模型。每次请求使用新的 Harness session ID。

返回协议保持为：

```json
{"role":"assistant","content":"……","timestamp":"2026-09-10T10:00:00+00:00"}
```

`POST /api/chat/?stream=true` 返回 Harness 工具状态映射的 SSE，以及运行完成后的最终文本：

```text
data: {"event":"tool","name":"desktop_apps","status":"running","message":"正在查询站内内容…"}

data: {"content":"Terminal","done":false}

data: {"content":"","done":true}
```

当前官方 SDK `0.1.5rc1` 公开持久会话通知，不转发 Harness 内部逐 token 的瞬态事件。因此工具进度可实时显示，回复文本在运行完成后一次发送，不模拟打字效果。只转发当前请求根会话的可见文本与站内工具状态；推理过程、子会话消息、工具参数和工具原始返回不进入前端。已开始的 SSE 遇到错误时发送 `{"error":"脱敏的用户提示","done":true}`；普通请求返回对应的 HTTP 错误和 `detail`。

缺少配置、认证失败、余额不足、限流、超时和中断不会被替换成模拟回复。每轮有默认 180 秒的总时限，浏览器取消请求会关闭 SDK runtime，避免遗留运行中的子进程。

## 访客模式（桌面隐藏空间）

隐藏空间不再由 Agent 解锁：桌面的「访客模式」窗口提交访客名与密码，`POST /api/visitor/login` 校验后才放行。账号来自 `VISITOR_ACCOUNTS_PATH` 指向的私有 JSON，以及 `DATABASE_ENABLED=true` 时的 `visitor_accounts` 表（含 `apps` 列：逗号分隔的授权应用 id；MySQL / PostgreSQL 都由 `app/database.py` 的 `normalize_database_url` 换成异步驱动，MySQL 需要 `aiomysql`）——**两份会合并读取**，同一个访客名同时出现在两边时直接拒绝（不猜用哪份密码），本地文件不存在就只读数据库。密码只以 PBKDF2-SHA256（600k 次迭代、每条随机盐）保存，明文不落盘、不进日志、不进模型上下文；未知访客名也会走一次同样的哈希计算，避免用响应时间探测账号是否存在。用 `python scripts/add-visitor.py <访客名> --generate --apps <应用 id>` 生成哈希与授权。

应用是**一个应用一个文件夹**，定义在 `VISITOR_APPS_DIR` 里（`<id>/app.json` 是元数据与能力声明，`<id>/` 放入口 HTML 与它引用的静态文件，`<id>/assets/` 放壁纸、图标等私有素材），只由后端读取。登录后：

- `GET /api/visitor/apps` 返回该访客被授权应用的**元数据**（标题、副标题、是否有壁纸/图标），不含内容；
- `GET /api/visitor/apps/{id}/assets/{kind}` 返回私有素材；要求 `X-Marcus-Visitor` 里的访客名存在、启用且被授予该应用，否则 401/403。
- **应用界面**：`GET .../apps/{id}/shell` 下发 HTML，`GET .../apps/{id}/{path}` 下发应用自带的 js/css/图片；在 `permissions` 里申请后，`GET/PUT/GET/DELETE .../apps/{id}/files[/{name}]` 做上传（请求体即文件字节）、列表、下载（`?inline=1` 内联）、删除，`GET/PUT/DELETE .../apps/{id}/data[/{key}]` 读写按「应用×访客」隔离的键值 JSON。数据在 `VISITOR_APP_DATA_DB`，文件在 `VISITOR_APP_FILES_DIR`。

这几个接口都要求内部令牌；只有登录接口另有限流窗口。应用清单字段与校验规则见 `app/services/visitor_apps.py` 与 [`docs/APP-DEVELOPMENT.md`](../docs/APP-DEVELOPMENT.md)，格式不对时整份注册表关闭（503），不会退化成「返回部分内容」。

访客名单缺失或格式不对时返回 503「尚未配置 / 暂不可用」，不会降级去读另一种来源；`DATABASE_ENABLED=true` 时数据库不可用同样直接失败，不会退回文件。

登录接口只接受 `username` 与 `password`（`extra=forbid`），并按客户端维度限流（默认 6 次/分钟、30 次/小时，与聊天额度分开计数），同一访客名的连续失败会触发 15 分钟锁定。校验成功后返回绑定当前浏览器会话、两分钟有效的 HMAC 凭证；Next 校验后写入 30 天 `HttpOnly`、`Secure`、`SameSite=Strict` 授权 Cookie，Cookie 里带着服务端签名的访客显示名。受保护内容和壁纸只通过校验 Cookie 的接口返回，浏览器本地存储不能授予访问权。聊天通道不再返回任何桌面指令。

## 运行范围

浏览器只能提交 `messages`，不能控制 `system`、`tools`、`provider`、模型地址、会话 ID 或其他 runtime 配置。服务端固定使用 `sdk-minimal` 加站内 patch；缺少 patch 时拒绝启动 Agent。

Harness home 默认在 `work/deepseek-harness-home`，runtime cwd 指向该目录，Agent 工作目录是其 `workspace` 子目录。它们与项目源代码、`backend/.env` 分开。Harness 运行记录可能保存在独立 home 内；本 API 不会恢复或暴露其他请求的记录。

## 测试

```bash
.venv/bin/python -m unittest discover -s tests -v
```

适配器测试使用 SDK runtime 替身，另有一项在临时 Harness home 启动真实 SDK，确认站内工具 schema 能被官方 runtime 接受。测试全部使用占位凭据，不发起模型请求。覆盖多轮角色数据、独立会话、真实通知协议映射、推理过滤、工具进度、缺少配置、脱敏错误、总时限与请求取消后的子进程关闭，以及访客登录的哈希校验、文件/数据库两种来源、失败锁定与接口行为，还有应用注册表校验、按账号授权、视图与私有素材接口。官方工具输出 schema 只支持受限子集，数值范围使用 `enum`，可空值使用 `oneOf`；不得直接加入 `minimum`、`maximum` 或 `type` 数组。

官方参考：[DeepSeek Harness](https://www.deepseek.com/harness/en/)、[Python SDK](https://github.com/deepseek-ai/deepseek-harness/blob/master/python/sdk/README.md)。
