# Nekovccat App - 企业级 Next.js 应用

这是一个企业级 Next.js 项目，采用现代化的技术栈和最佳实践构建，适用于生产环境。

## 📚 技术栈

- **Next.js 16.0.1** - React 全栈框架（App Router）
- **React 19.2.0** - UI 库
- **TypeScript 5** - 类型安全的 JavaScript
- **Supabase** - 开源 PostgreSQL 云数据库（基于 PostgreSQL）
- **Prisma 5.20.0** - 类型安全的 ORM
- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **Zod** - TypeScript 优先的 Schema 验证
- **ESLint** - 代码质量检查工具

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- Supabase 账号（免费注册）
- npm 或 yarn

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 设置 Supabase 数据库

**创建 Supabase 项目：**

1. 访问 [Supabase](https://supabase.com) 并注册账号
2. 创建新项目，选择区域（建议选择离你最近的区域）
3. 等待项目创建完成（约 1-2 分钟）

**获取数据库连接字符串：**

1. 进入项目设置 → Database
2. 找到 "Connection string" → "URI"
3. 复制连接字符串（格式类似：`postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`）

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase 数据库连接（生产环境）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# 本地开发（可选，使用 Docker 本地 PostgreSQL）
# DATABASE_URL="postgresql://postgres:changeme@localhost:5432/nekovccat_app?schema=public"
```

> **注意**：Supabase 连接字符串中的 `[YOUR-PASSWORD]` 需要替换为你在创建项目时设置的数据库密码。

**使用连接池（推荐生产环境）：**

Supabase 提供了两种连接字符串：
- **Session mode**（直接连接）：适合迁移和一次性操作
- **Transaction mode**（连接池）：适合应用运行（推荐）

推荐使用 Transaction mode 的连接字符串，它使用 PgBouncer 连接池，性能更好。

### 4. 初始化数据库

**使用 Supabase 时，有两种方式运行迁移：**

**方式 1：使用 Session Mode（推荐用于迁移）**

临时修改 `.env.local` 为 Session Mode：

```env
# 迁移时使用 Session Mode（直接连接）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

然后运行：

```bash
# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移（会创建迁移文件）
npm run db:migrate

# 查看迁移状态
npm run db:migrate:deploy
```

迁移完成后，改回 Transaction Mode：

```env
# 应用运行时使用 Transaction Mode（连接池）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**方式 2：使用 Supabase Dashboard SQL Editor**

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 运行 Prisma 生成的 SQL 迁移文件（在 `prisma/migrations/` 目录中）

**验证数据库连接：**

```bash
# 打开 Prisma Studio 查看数据库（需要 Session Mode）
npm run db:studio
```

### 5. 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
frontend/
├── app/                          # Next.js App Router
│   ├── api/                     # API 路由
│   │   └── health/              # 健康检查端点
│   │       └── route.ts
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页
│   ├── loading.tsx              # 全局加载状态
│   ├── error.tsx                # 全局错误边界
│   ├── not-found.tsx            # 404 页面
│   └── globals.css              # 全局样式
│
├── components/                   # 组件库
│   ├── ui/                      # 基础 UI 组件
│   │   ├── button.tsx
│   │   └── index.ts
│   ├── layout/                  # 布局组件
│   │   ├── header.tsx
│   │   └── footer.tsx
│   ├── features/                # 功能模块组件（按需创建）
│   └── shared/                  # 共享组件
│       ├── loading.tsx
│       └── error-boundary.tsx
│
├── lib/                          # 工具库
│   ├── db/                      # 数据库配置
│   │   └── index.ts             # Prisma 客户端单例
│   └── utils/                   # 工具函数
│       ├── index.ts             # 通用工具（cn, 等）
│       ├── constants.ts         # 常量定义
│       └── validation.ts        # Zod 验证 Schema
│
├── hooks/                        # 自定义 React Hooks
│   └── use-debounce.ts
│
├── types/                        # TypeScript 类型定义
│   └── index.ts                 # 全局类型导出
│
├── prisma/                       # Prisma 配置
│   └── schema.prisma            # 数据库模式
│
├── public/                       # 静态资源
│
├── docker-compose.yml            # Docker 配置（PostgreSQL）
├── .env.example                  # 环境变量示例
├── .prettierrc                   # Prettier 代码格式化配置
├── .gitignore                    # Git 忽略文件
├── next.config.ts                # Next.js 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json                  # 项目依赖
```

## 🛠️ 可用命令

### 开发

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
```

### 代码质量

```bash
npm run lint         # 运行 ESLint
npm run lint:fix     # 自动修复 ESLint 错误
npm run type-check   # 类型检查（不生成文件）
```

### 数据库

```bash
npm run db:generate        # 生成 Prisma Client
npm run db:push            # 推送 schema 变更（开发）
npm run db:migrate         # 创建并应用迁移
npm run db:migrate:deploy  # 应用迁移（生产）
npm run db:studio          # 打开 Prisma Studio
npm run db:seed            # 运行数据库种子
```

### Docker

```bash
npm run docker:up      # 启动 PostgreSQL 容器
npm run docker:down    # 停止容器
npm run docker:logs    # 查看容器日志
```

## 💾 数据库配置

### Supabase - 推荐数据库解决方案

本项目使用 **Supabase** 作为数据库，它是基于 PostgreSQL 的开源云数据库平台。

✅ **为什么选择 Supabase？**
- 🆓 **免费层** - 提供慷慨的免费额度（500MB 数据库，2GB 带宽）
- 🚀 **开箱即用** - 无需配置服务器，几分钟即可开始使用
- 🔒 **自动备份** - 每日自动备份，支持时间点恢复
- 📊 **实时功能** - 内置实时订阅和 WebSocket 支持
- 🔐 **安全性** - 自动 SSL/TLS 加密，内置行级安全策略
- 📈 **可扩展** - 基于 PostgreSQL，支持企业级规模和性能
- 🛠️ **开发工具** - 内置 SQL 编辑器、API 文档、数据库管理界面

✅ **企业级特性**
- 支持复杂事务和 ACID 特性
- 强大的并发控制和连接池
- 自动备份和恢复
- 监控和性能分析
- 全球 CDN 加速

### 环境变量配置

**生产环境（Supabase）：**
```env
# Supabase 连接字符串（Transaction mode - 推荐用于应用）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# 或使用 Session mode（用于迁移和一次性操作）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

**本地开发（可选）：**
```env
# 使用 Docker 本地 PostgreSQL
DATABASE_URL="postgresql://postgres:changeme@localhost:5432/nekovccat_app?schema=public"
```

### 获取 Supabase 连接字符串

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **Database**
4. 在 "Connection string" 部分，选择：
   - **URI** 标签页
   - **Transaction mode**（推荐用于应用运行）
   - 复制连接字符串
5. 替换 `[YOUR-PASSWORD]` 为你的数据库密码

### Supabase 连接模式说明

**Transaction Mode（推荐用于应用）**
- 使用 PgBouncer 连接池
- 适合应用运行时的数据库操作
- 连接字符串包含 `pgbouncer=true`

**Session Mode（用于迁移）**
- 直接连接到 PostgreSQL
- 适合运行 Prisma 迁移
- 不使用连接池

**最佳实践：**
- 应用运行：使用 Transaction Mode
- 运行迁移：使用 Session Mode（临时切换）

### 数据库管理

**Supabase Dashboard：**
- 访问 [Supabase Dashboard](https://app.supabase.com) 查看和管理数据库
- 使用 SQL Editor 执行查询
- 查看数据库表结构和数据

**Prisma Studio：**
```bash
npm run db:studio
```
访问 http://localhost:5555 查看和管理数据库

**本地开发选项：**
如果需要本地开发，可以使用 Docker：
```bash
npm run docker:up
```
然后在 `.env.local` 中使用本地数据库连接字符串。

## 🎯 核心概念

### App Router

Next.js 16 使用 App Router 架构，基于 React Server Components：

- `app/` 目录中的文件结构定义了路由
- `layout.tsx` 用于共享 UI（如导航栏、页脚）
- `page.tsx` 是页面的 UI 组件
- `loading.tsx` 和 `error.tsx` 用于加载和错误状态

### 服务器组件 vs 客户端组件

默认情况下，所有组件都是**服务器组件**：

- ✅ 在服务器上渲染，减少客户端 JavaScript 包大小
- ✅ 可以直接访问后端资源（数据库、API 等）
- ✅ 更好的 SEO 和初始加载性能

需要交互时使用 `"use client"` 指令创建客户端组件。

### Prisma ORM

使用 Prisma 进行类型安全的数据库访问：

```typescript
import { prisma } from '@/lib/db'

// 查询用户
const users = await prisma.user.findMany()

// 创建用户
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
})
```

## 📖 开发指南

### 添加新页面

在 `app/` 目录下创建新文件夹：

```
app/
  └── about/
      └── page.tsx    # 创建 /about 路由
```

### 添加新组件

**UI 组件** → `components/ui/`
**布局组件** → `components/layout/`
**功能组件** → `components/features/[feature-name]/`
**共享组件** → `components/shared/`

### 添加数据库模型

在 `prisma/schema.prisma` 中定义模型，然后运行：

```bash
npm run db:migrate
```

### 添加 API 路由

在 `app/api/` 目录下创建路由：

```
app/api/
  └── users/
      └── route.ts    # GET /api/users, POST /api/users
```

## 🌐 部署

### 自托管服务器部署

本项目将部署在自托管服务器上，域名：**nekovccat.origin.kim**

#### 服务器要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: 18.x 或更高版本
- **PostgreSQL**: 16.x 或更高版本
- **内存**: 至少 2GB RAM
- **存储**: 至少 20GB 可用空间

#### 部署步骤

**1. 服务器准备**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 安装 PM2（进程管理器）
sudo npm install -g pm2
```

**2. 配置 PostgreSQL**

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE nekovccat_app;
CREATE USER nekovccat_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nekovccat_app TO nekovccat_user;
\q
```

**3. 配置 Nginx（反向代理）**

创建 `/etc/nginx/sites-available/nekovccat.origin.kim`:

```nginx
server {
    listen 80;
    server_name nekovccat.origin.kim;

    # 重定向到 HTTPS（如果使用 SSL）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nekovccat.origin.kim;

    # SSL 证书配置（使用 Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/nekovccat.origin.kim/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nekovccat.origin.kim/privkey.pem;

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/nekovccat.origin.kim /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**4. 配置 SSL 证书（Let's Encrypt）**

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d nekovccat.origin.kim

# 自动续期（已自动配置）
```

**5. 部署应用**

```bash
# 克隆项目
git clone <your-repo-url> /var/www/nekovccat_app
cd /var/www/frontend/nekovccat_app

# 安装依赖
npm install --production

# 配置环境变量
nano .env.production
```

`.env.production` 内容：

```env
# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://nekovccat.origin.kim
PORT=3000

# 数据库配置
DATABASE_URL="postgresql://nekovccat_user:your_secure_password@localhost:5432/nekovccat_app?schema=public"
```

**6. 构建和启动**

```bash
# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npm run db:migrate:deploy

# 构建应用
npm run build

# 使用 PM2 启动应用
pm2 start npm --name "nekovccat-app" -- start
pm2 save
pm2 startup
```

**7. 防火墙配置**

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

#### 环境变量配置

**生产环境（`.env.production`）：**

```env
# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://nekovccat.origin.kim
PORT=3000

# Supabase 数据库配置（Transaction Mode - 推荐）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# 安全密钥（生成随机字符串：openssl rand -base64 32）
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://nekovccat.origin.kim"
```

> **注意**：运行 Prisma 迁移时，建议临时切换到 Session Mode 连接字符串（移除 `pgbouncer=true` 参数）。

#### 维护命令

```bash
# 查看应用状态
pm2 status
pm2 logs nekovccat-app

# 重启应用
pm2 restart nekovccat-app

# 更新应用
cd /var/www/frontend/nekovccat_app
git pull
npm install --production
npm run db:migrate:deploy
npm run build
pm2 restart nekovccat-app

# 查看数据库
npm run db:studio
```

#### 监控和日志

```bash
# PM2 监控
pm2 monit

# 查看日志
pm2 logs nekovccat-app --lines 100

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Docker 部署（可选）

如果使用 Docker Compose 部署整个应用栈：

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/nekovccat_app
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: nekovccat_app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🔒 安全最佳实践

1. **环境变量** - 永远不要提交 `.env.local` 到 Git
2. **数据库连接** - 生产环境使用 SSL 连接
3. **API 密钥** - 使用环境变量管理敏感信息
4. **输入验证** - 使用 Zod 验证所有用户输入
5. **SQL 注入** - Prisma 自动防止 SQL 注入

## 📚 学习资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [Supabase 官方文档](https://supabase.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

## 📝 项目状态

- [x] 项目结构搭建
- [x] Supabase + Prisma 配置
- [x] 基础组件库
- [x] 类型定义
- [x] 错误处理和加载状态
- [x] Docker 配置
- [ ] 认证系统（NextAuth.js）
- [ ] 单元测试
- [ ] E2E 测试
- [ ] CI/CD 配置

---

**项目维护者**：[你的名字]  
**最后更新**：2024

