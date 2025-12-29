# Nekovccat Project

全栈项目，包含 Next.js 前端和 Python 后端，提供 Agent 聊天功能和沉浸式 3D 体验。

## ✨ 项目特色

- 🎨 **3D 可视化** - 使用 Three.js 和 React Three Fiber 构建沉浸式 3D 场景
- 🤖 **AI 聊天** - 集成 Google Gemini API，提供智能对话功能
- 🎮 **交互式体验** - 第一人称视角控制和全景背景
- 🚀 **现代化技术栈** - Next.js 16、TypeScript、FastAPI

## 📁 项目结构

```
nexttest/
├── frontend/          # Next.js 前端（原 nekovccat_app）
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/              # 3D 场景组件
│   │   │   │   ├── city-scene.tsx           # 城市 3D 场景
│   │   │   │   ├── first-person-controls.tsx # 第一人称控制器
│   │   │   │   └── controls-hint.tsx       # 控制提示
│   │   │   └── layout/
│   │   │       └── panorama-background.tsx # 全景背景
│   │   ├── models/              # 3D 模型
│   │   │   └── city.jsx         # 城市 GLB 模型加载器
│   │   └── app/                 # Next.js App Router
│   └── public/
│       └── city.glb             # 3D 城市模型文件
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

## 🛠️ 技术栈

### 前端技术

- **框架**: Next.js 16 (App Router), React 18, TypeScript 5
- **3D 渲染**: 
  - [Three.js](https://threejs.org/) - 3D 图形库
  - [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) - React 的 Three.js 渲染器
  - [@react-three/drei](https://github.com/pmndrs/drei) - Three.js 实用工具库
- **样式**: Tailwind CSS 4
- **数据库**: PostgreSQL 16 (Supabase)
- **ORM**: Prisma 5.20.0
- **验证**: Zod

### 后端技术

- **框架**: FastAPI
- **数据库**: PostgreSQL 16
- **ORM**: SQLAlchemy
- **AI 服务**: Google Gemini API (gemini-2.5-flash)
- **语言**: Python 3.11+

## 🎮 3D 功能特性

本项目使用 **Three.js** 构建了丰富的 3D 交互体验：

### 核心 3D 组件

1. **城市 3D 场景** (`city-scene.tsx`)
   - 加载 GLB 格式的 3D 城市模型
   - 实现体积雾效果（FogExp2）
   - 环境光照和阴影系统
   - 支持动画播放

2. **第一人称控制器** (`first-person-controls.tsx`)
   - WASD 键位移动控制
   - 鼠标视角控制（指针锁定）
   - 平滑的相机移动和旋转
   - 自动旋转功能

3. **全景背景** (`panorama-background.tsx`)
   - 360° 全景图渲染
   - 纹理优化和缓存
   - 支持 EXR/HDR 格式
   - 自动纹理尺寸限制

### 3D 资源

- **城市模型**: `public/city.glb` - 完整的 3D 城市场景
- **环境贴图**: `public/env/` - HDR/EXR 环境贴图文件

### 使用示例

```typescript
// 在页面中使用 3D 场景
import CityScene from '@/components/3d/city-scene'

export default function Page() {
  return <CityScene />
}
```

### 性能优化

- 纹理缓存机制
- 自动 Mipmap 生成
- 纹理尺寸限制（最大 4096x4096）
- 各向异性过滤优化
- 按需加载和 Suspense 边界

## 📝 项目状态

### 已完成功能

- ✅ 项目结构搭建（前后端分离）
- ✅ Three.js 3D 场景集成
- ✅ 城市 3D 模型加载和渲染
- ✅ 第一人称控制器实现
- ✅ 全景背景系统
- ✅ AI 聊天功能（Google Gemini）
- ✅ 流式响应支持
- ✅ 数据库配置（Prisma + Supabase）
- ✅ Docker 开发环境

### 计划功能

- ⏳ 用户认证系统
- ⏳ 聊天历史持久化
- ⏳ 更多 3D 场景和交互
- ⏳ 性能监控和优化
- ⏳ 单元测试和 E2E 测试
- ⏳ CI/CD 配置

## 📚 相关文档

- [前端文档](./frontend/README.md) - Next.js 前端详细说明
- [后端文档](./backend/README.md) - Python FastAPI 后端说明
- [Three.js 官方文档](https://threejs.org/docs/)
- [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber)
- [React Three Drei 文档](https://github.com/pmndrs/drei)

## 🎯 快速体验 3D 功能

1. 启动前端开发服务器：
```bash
cd frontend
npm install
npm run dev
```

2. 访问包含 3D 场景的页面（如首页或 my-world 页面）

3. 使用以下控制方式：
   - **鼠标移动**: 控制视角
   - **W/A/S/D**: 前后左右移动
   - **Space/Shift**: 上下移动
   - **ESC**: 退出指针锁定

---

**项目维护者**: Nekovccat Team  
**最后更新**: 2024

