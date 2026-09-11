# Nekovccat Backend

FastAPI 通过官方 `deepseek-harness-sdk` 运行 DeepSeek Harness。SDK 管理原生 `dsh` 子进程，使用 `deepseek-v4-pro` 执行真实 Agent 工具循环。项目的 `agent/website.patch.yml` 只允许 `site_info`、`desktop_apps` 和 `girlfriend_mode` 三个受限站内工具。

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
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8010
```

- API 健康检查：`http://127.0.0.1:8010/api/health`
- Swagger 文档：`http://127.0.0.1:8010/docs`
- Harness 子进程：由 API 按请求创建，完成、失败、超时或断开后关闭

`/api/health` 只报告 FastAPI 存活；验证 AI 必须实际调用聊天接口。当前聊天不保存到 PostgreSQL，默认 `DATABASE_ENABLED=false`；需要数据库功能时可显式启用初始化。

## API 协议

`POST /api/chat/`：

```json
{"messages":[{"role":"user","content":"My World 有哪些应用？"}]}
```

支持 `user` / `assistant` 多轮历史，最后一条必须为 `user`。官方 SDK 接收单次用户输入，因此历史按 `previous_context` JSON 数组保留每条 `role` / `content`，本轮问题放在 `input`，不会逐轮重放或额外调用模型。每次请求使用新的 Harness session ID。

返回协议保持为：

```json
{"role":"assistant","content":"……","timestamp":"2026-09-10T10:00:00+00:00"}
```

`POST /api/chat/?stream=true` 返回 Harness 工具状态映射的 SSE，以及运行完成后的最终文本：

```text
data: {"event":"tool","name":"desktop_apps","status":"running","message":"正在查询站内内容…"}

data: {"content":"My World","done":false}

data: {"content":"","done":true}
```

当前官方 SDK `0.1.5rc1` 公开持久会话通知，不转发 Harness 内部逐 token 的瞬态事件。因此工具进度可实时显示，回复文本在运行完成后一次发送，不模拟打字效果。只转发当前请求根会话的可见文本与站内工具状态；推理过程、子会话消息、工具参数和工具原始返回不进入前端。已开始的 SSE 遇到错误时发送 `{"error":"脱敏的用户提示","done":true}`；普通请求返回对应的 HTTP 错误和 `detail`。

缺少配置、认证失败、余额不足、限流、超时和中断不会被替换成模拟回复。每轮有默认 180 秒的总时限，浏览器取消请求会关闭 SDK runtime，避免遗留运行中的子进程。

## My World 隐藏彩蛋

用户明确提出开启彩蛋后，Agent 使用受限工具依次验证五个问题。答案与彩蛋内容从 `RELATIONSHIP_PRIVATE_PATH` 指向的私有 JSON 读取，不写入源码、前端包、系统提示、工具描述或工具返回。缺少私有配置时拒绝解锁。

只有当前请求根会话的真实 `girlfriend_mode` 工具结果返回 `unlocked: true`、`progress: 5`，并且整轮正常完成后，SSE 才会在最终回复文本之后、`done` 之前返回 `{"event":"desktop","action":"unlock-girlfriend"}`。浏览器应等正常 `done` 后再应用主题。普通 JSON 响应仅在同样成功时增加 `desktop_action: "unlock-girlfriend"`，其他情况继续返回原先三个字段。助手声称成功、错误答案、题目未答全、工具失败、未完成回复、取消请求和其他会话均不会提交主题切换。

验证成功后，后端签发与当前聊天会话绑定、两分钟有效的 HMAC 凭证；Next 校验后写入 30 天 `HttpOnly`、`Secure`、`SameSite=Strict` 授权 Cookie。受保护内容和壁纸只通过校验 Cookie 的接口返回，浏览器本地存储不能授予访问权。

## 运行范围

浏览器只能提交 `messages`，不能控制 `system`、`tools`、`provider`、模型地址、会话 ID 或其他 runtime 配置。服务端固定使用 `sdk-minimal` 加站内 patch；缺少 patch 时拒绝启动 Agent。

Harness home 默认在 `work/deepseek-harness-home`，runtime cwd 指向该目录，Agent 工作目录是其 `workspace` 子目录。它们与项目源代码、`backend/.env` 分开。Harness 运行记录可能保存在独立 home 内；本 API 不会恢复或暴露其他请求的记录。

## 测试

```bash
.venv/bin/python -m unittest discover -s tests -v
```

适配器测试使用 SDK runtime 替身，另有一项在临时 Harness home 启动真实 SDK，确认站内工具 schema 能被官方 runtime 接受。测试全部使用占位凭据，不发起模型请求。覆盖多轮角色数据、独立会话、真实通知协议映射、推理过滤、工具进度、五题验证后的桌面事件、缺少配置、脱敏错误、总时限与请求取消后的子进程关闭。官方工具输出 schema 只支持受限子集，数值范围使用 `enum`，可空值使用 `oneOf`；不得直接加入 `minimum`、`maximum` 或 `type` 数组。

官方参考：[DeepSeek Harness](https://www.deepseek.com/harness/en/)、[Python SDK](https://github.com/deepseek-ai/deepseek-harness/blob/master/python/sdk/README.md)。
