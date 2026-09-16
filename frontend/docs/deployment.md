# 生产部署

当前站点使用 Next.js 服务器与 FastAPI / DeepSeek Harness，目标域名为 `https://example.com`。

部署步骤、systemd 服务模板、反向代理与证书处理说明已集中到 [deployment/README.md](../../deployment/README.md)。

旧版 Node 18、必需 PostgreSQL、仅前端 PM2 和 60 秒聊天代理超时的部署步骤已不适用。当前依赖要求 Node >= 20.9、Python 3.11/3.12，数据库可关闭；后端与同级 `agent/` 目录必须一起部署。
