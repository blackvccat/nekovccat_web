# 本地环境配置

复制 `backend/.env.example` 为 `backend/.env`，在本机填写密钥。`.env` 已被 Git 忽略，不要将真实密钥加入源码或前端环境变量。

| 配置 | 用途 |
| --- | --- |
| `DEEPSEEK_API_KEY` | Harness 调用 DeepSeek 的服务端密钥 |
| `DEEPSEEK_BASE_URL` | 官方地址 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 默认 `deepseek-v4-pro` |
| `DEEPSEEK_REASONING_EFFORT` | 默认 `low` |
| `DSH_HOME` | 可选；独立的 Harness home，默认项目下 `work/deepseek-harness-home` |
| `DSH_PATCH_PATH` | 可选；默认项目下 `agent/website.patch.yml`，必须存在 |
| `DSH_REQUEST_TIMEOUT_SECONDS` | 包含整轮工具执行的总时限，默认 180 秒 |
| `DSH_MAX_TOKENS` | 模型单次输出 token 上限，默认 4096 |
| `RELATIONSHIP_PRIVATE_PATH` | 被 Git 忽略的私有 JSON，包含五题答案与受保护内容 |
| `CORS_ORIGINS` | JSON 数组形式的允许来源 |
| `DATABASE_ENABLED` | 默认 `false`，站内聊天无需数据库 |

修改 `.env` 后重启后端。SDK 将凭据通过子进程环境传入官方 runtime，浏览器不接触密钥。API 仅允许项目配置的站内工具；不要启用 SDK 默认 shell 或其他本机操作工具。

`/api/health` 成功表示 FastAPI 可访问，确认整个 Agent 链路需发送真实聊天请求。官方 SDK 仍处于开发预览，升级时应同时测试 runtime、patch 和站内工具插件。
