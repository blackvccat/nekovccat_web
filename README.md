# Nekovccat Project

全栈项目，包含 Next.js 前端和 Python 后端，提供 Agent 聊天功能。

## 📁 项目结构

```
nexttest/
├── frontend/          # Next.js 前端（原 nekovccat_app）
├── backend/           # Python FastAPI 后端
├── docker-compose.yml # 统一开发环境
└── README.md          # 本文件
```

## 🚀 快速开始

### 方式一：使用 Docker Compose（推荐）

```bash
# 启动所有服务（数据库 + 后端）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式二：本地开发

#### 1. 启动数据库

```bash
docker-compose up postgres -d
```

#### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 配置数据库连接
uvicorn app.main:app --reload
```

#### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

## 🔧 环境配置

### 根目录 `.env`（可选）

```env
POSTGRES_PASSWORD=changeme
POSTGRES_PORT=5432
BACKEND_PORT=8000
FRONTEND_PORT=3000
ENVIRONMENT=development
DEBUG=true
```

### 前端环境变量

`frontend/.env.local`:
```env
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/nekovccat_app
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 后端环境变量

`backend/.env`:
```env
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/nekovccat_app
CORS_ORIGINS=["http://localhost:3000"]
ENVIRONMENT=development
DEBUG=true
```

## 📚 文档

- [前端文档](./frontend/README.md) - Next.js 前端说明
- [后端文档](./backend/README.md) - Python 后端说明
- [项目结构提案](./PROJECT_STRUCTURE_PROPOSAL.md) - 结构重组说明

## 🛠️ 开发工具

- **前端**: Next.js 16, React, TypeScript, Tailwind CSS
- **后端**: FastAPI, SQLAlchemy, Python 3.11+
- **数据库**: PostgreSQL 16
- **ORM**: Prisma (前端), SQLAlchemy (后端)

## 📝 下一步

1. ✅ 创建后端基础结构
2. ⏳ 集成 AI 服务（OpenAI/Claude）
3. ⏳ 实现聊天历史存储
4. ⏳ 添加用户认证
5. ⏳ 实现流式响应

## ✅ 项目结构

项目结构已完成重组，前后端分离清晰。

