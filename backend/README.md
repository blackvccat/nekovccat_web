# Nekovccat Backend - Python API

Python 后端服务，使用 FastAPI 构建，为前端提供 Agent 聊天功能。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

或使用虚拟环境：

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件并配置：

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

编辑 `.env` 文件，设置以下配置：

```bash
# 数据库配置
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/nekovccat_app

# Gemini API Key (必需)
GEMINI_API_KEY=your_gemini_api_key_here

# 其他配置（可选）
CORS_ORIGINS=["http://localhost:3000"]
ENVIRONMENT=development
DEBUG=true
```

**重要**: 如果没有配置 `GEMINI_API_KEY`，系统将使用模拟响应。

### 3. 启动服务

```bash
# 开发模式（自动重载）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或使用 Python 直接运行
python -m uvicorn app.main:app --reload
```

### 4. 访问 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📁 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── models/              # SQLAlchemy 模型
│   ├── schemas/             # Pydantic 数据验证
│   ├── api/                 # API 路由
│   │   └── routes/
│   │       ├── chat.py      # 聊天 API
│   │       └── health.py    # 健康检查
│   ├── services/            # 业务逻辑
│   │   ├── chat_service.py
│   │   └── ai_service.py
│   └── utils/               # 工具函数
├── requirements.txt
├── .env.example
└── README.md
```

## 🔧 开发

### 运行测试

```bash
# 待添加测试框架
pytest
```

### 代码格式化

```bash
# 使用 black
black app/

# 使用 isort
isort app/
```

## 📝 API 端点

### POST /api/chat/

处理聊天消息

**请求体：**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ]
}
```

**响应：**
```json
{
  "role": "assistant",
  "content": "Hello! Welcome to My World...",
  "timestamp": "2024-01-01T00:00:00"
}
```

## 🔌 集成 AI 服务

项目已集成 **Google Gemini API**，使用 `gemini-2.5-flash` 模型。

### 配置 Gemini API Key

1. 访问 [Google AI Studio](https://ai.google.dev/) 获取 API 密钥
2. 在 `.env` 文件中设置：

```bash
GEMINI_API_KEY=your_api_key_here
```

或在环境变量中设置：

```bash
export GEMINI_API_KEY=your_api_key_here  # Linux/Mac
set GEMINI_API_KEY=your_api_key_here      # Windows
```

### 其他 AI 服务集成

如果需要使用其他 AI 服务，可以在 `app/services/ai_service.py` 中修改：

1. **OpenAI**:
```python
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
response = await client.chat.completions.create(...)
```

2. **Anthropic Claude**:
```python
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
response = await client.messages.create(...)
```

## 🐳 Docker

使用 Docker Compose 启动（在项目根目录）：

```bash
docker-compose up backend
```

## 📚 相关文档

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)
- [Pydantic 文档](https://docs.pydantic.dev/)

