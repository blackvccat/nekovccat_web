# 环境变量配置说明

## 📍 配置文件位置

**API Key 配置文件位置：** `backend/.env`

## 🔧 配置步骤

### 1. 创建 `.env` 文件

在 `backend` 目录下创建 `.env` 文件：

**Windows PowerShell:**
```powershell
cd backend
New-Item -Path .env -ItemType File
```

**Windows CMD:**
```cmd
cd backend
type nul > .env
```

**Linux/Mac:**
```bash
cd backend
touch .env
```

### 2. 编辑 `.env` 文件

在 `.env` 文件中添加以下内容：

```bash
# ============================================
# Google Gemini API Key (必需)
# ============================================
# 获取方式: 访问 https://ai.google.dev/
# 1. 登录 Google 账号
# 2. 点击 "Get API Key"
# 3. 创建新的 API 密钥
# 4. 复制密钥并粘贴到下方
GEMINI_API_KEY=your_gemini_api_key_here

# ============================================
# 数据库配置
# ============================================
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/nekovccat_app

# ============================================
# CORS 配置（可选）
# ============================================
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]

# ============================================
# 应用配置（可选）
# ============================================
ENVIRONMENT=development
DEBUG=true
HOST=0.0.0.0
PORT=8000
```

### 3. 替换 API Key

将 `your_gemini_api_key_here` 替换为你从 Google AI Studio 获取的实际 API 密钥。

## 📝 完整配置示例

```bash
# Gemini API Key
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 数据库
DATABASE_URL=postgresql://postgres:changeme@localhost:5432/nekovccat_app

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# 环境
ENVIRONMENT=development
DEBUG=true
```

## ⚠️ 重要提示

1. **不要将 `.env` 文件提交到 Git**
   - `.env` 文件通常已在 `.gitignore` 中
   - 只提交 `.env.example` 作为模板

2. **API Key 安全**
   - 不要分享你的 API Key
   - 不要在代码中硬编码 API Key
   - 使用环境变量或 `.env` 文件

3. **配置文件路径**
   - 确保 `.env` 文件位于 `backend/` 目录下
   - 与 `app/` 目录同级

## 🔍 验证配置

启动后端服务后，如果看到以下警告，说明 API Key 未配置：

```
警告: 未配置 GEMINI_API_KEY，将使用模拟响应
```

如果配置正确，该警告不会出现，系统将使用真实的 Gemini API。

## 📚 相关链接

- [Google AI Studio](https://ai.google.dev/) - 获取 API Key
- [FastAPI 配置文档](https://fastapi.tiangolo.com/advanced/settings/)

