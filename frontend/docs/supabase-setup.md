# Supabase 设置指南

本文档详细说明如何在项目中使用 Supabase 作为数据库。

## 📋 什么是 Supabase？

Supabase 是一个开源的 Firebase 替代品，基于 PostgreSQL 构建，提供：

- 🆓 **免费层**：500MB 数据库，2GB 带宽，50,000 月度活跃用户
- 🚀 **开箱即用**：无需配置服务器，几分钟即可开始
- 🔒 **自动备份**：每日自动备份，支持时间点恢复
- 📊 **实时功能**：内置实时订阅和 WebSocket 支持
- 🔐 **安全性**：自动 SSL/TLS 加密，内置行级安全策略
- 📈 **可扩展**：基于 PostgreSQL，支持企业级规模

## 🚀 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 "Start your project" 注册账号（免费）
3. 创建新项目：
   - **项目名称**：`marcus`（或自定义）
   - **数据库密码**：设置一个强密码（**重要：请保存此密码**）
   - **区域**：选择离你最近的区域
     - 中国用户建议选择：`Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)`
4. 等待项目创建完成（约 1-2 分钟）

### 2. 获取数据库连接字符串

#### 方法 1：通过 Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **Database**
4. 在 "Connection string" 部分：
   - 选择 **URI** 标签
   - 选择连接模式：
     - **Transaction mode**（推荐用于应用运行）
     - **Session mode**（用于迁移）
   - 点击 "Copy" 复制连接字符串

#### 方法 2：手动构建

连接字符串格式：

```
# Transaction Mode（连接池）
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1

# Session Mode（直接连接）
postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

其中：
- `[YOUR-PASSWORD]`：你的数据库密码
- `db.xxx.supabase.co`：你的项目数据库地址（在 Dashboard → Settings → Database 中可以找到）

### 3. 配置环境变量

创建或更新 `.env.local` 文件：

```env
# Supabase 数据库连接
# Transaction Mode - 推荐用于应用运行（使用连接池，性能更好）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

**重要提示：**
- 将 `[YOUR-PASSWORD]` 替换为你的实际数据库密码
- 将 `db.xxx.supabase.co` 替换为你的项目数据库地址
- 永远不要提交 `.env.local` 到 Git

## 🔄 连接模式说明

### Transaction Mode（推荐用于应用运行）

**特点：**
- 使用 PgBouncer 连接池
- 连接数有限（通常 1-2 个）
- 性能更好，资源占用更少
- 适合应用日常运行

**连接字符串：**
```
postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

**使用场景：**
- ✅ 应用运行时查询
- ✅ API 路由中的数据库操作
- ✅ 服务器组件中的数据获取

### Session Mode（用于迁移和一次性操作）

**特点：**
- 直接连接到 PostgreSQL
- 不使用连接池
- 支持所有 PostgreSQL 功能（包括某些 Prisma 迁移需要的功能）

**连接字符串：**
```
postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

**使用场景：**
- ✅ 运行 Prisma 迁移
- ✅ 使用 Prisma Studio
- ✅ 一次性数据库操作
- ✅ 数据库备份和恢复

## 📦 使用 Prisma 与 Supabase

### 1. 生成 Prisma Client

```bash
npm run db:generate
```

### 2. 运行数据库迁移

**重要：运行迁移时需要使用 Session Mode**

临时修改 `.env.local`：

```env
# 迁移时使用 Session Mode
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

然后运行迁移：

```bash
# 创建迁移
npm run db:migrate

# 或直接推送 schema（开发环境）
npm run db:push
```

迁移完成后，改回 Transaction Mode：

```env
# 应用运行时使用 Transaction Mode
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

### 3. 使用 Prisma Studio

Prisma Studio 也需要 Session Mode：

```env
# 临时切换到 Session Mode
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

然后运行：

```bash
npm run db:studio
```

### 4. 在代码中使用

```typescript
import { prisma } from '@/lib/db'

// 查询数据
const users = await prisma.user.findMany()

// 创建数据
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
})
```

## 🛠️ Supabase Dashboard 功能

### SQL Editor

1. 进入 **SQL Editor**
2. 可以直接执行 SQL 查询
3. 查看查询历史
4. 保存常用查询

### Table Editor

1. 进入 **Table Editor**
2. 可视化查看和编辑数据
3. 支持筛选、排序、搜索
4. 可以直接编辑数据

### Database

1. 进入 **Database** → **Tables**
2. 查看表结构
3. 管理索引和外键
4. 查看表关系图

### API

Supabase 还提供了自动生成的 REST API 和 GraphQL API：

1. 进入 **Settings** → **API**
2. 查看 API 密钥和端点
3. 可以配合 Supabase Client 使用

## 🔒 安全最佳实践

### 1. 保护数据库密码

- ✅ 使用环境变量存储密码
- ✅ 永远不要提交 `.env.local` 到 Git
- ✅ 定期轮换密码

### 2. 使用 Row Level Security (RLS)

Supabase 支持行级安全策略：

1. 在 Supabase Dashboard 中启用 RLS
2. 创建安全策略
3. 限制数据访问权限

### 3. 连接池配置

- 生产环境使用 Transaction Mode（连接池）
- 设置合理的 `connection_limit`
- 监控连接使用情况

### 4. 备份策略

- Supabase 自动每日备份
- 可以手动创建备份
- 支持时间点恢复

## 📊 监控和性能

### 查看数据库使用情况

1. 进入 **Project Settings** → **Usage**
2. 查看数据库大小、带宽使用情况
3. 监控 API 请求数量

### 性能分析

1. 进入 **Database** → **Performance**
2. 查看慢查询
3. 分析查询性能

### 日志

1. 进入 **Logs**
2. 查看数据库日志
3. 监控错误和警告

## 🚨 常见问题

### Q: 迁移失败怎么办？

**A:** 确保使用 Session Mode 运行迁移：

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

### Q: 连接数限制错误？

**A:** 使用 Transaction Mode 连接池，并设置合理的 `connection_limit`。

### Q: 如何备份数据？

**A:** 
1. 在 Dashboard 中手动创建备份
2. 使用 `pg_dump` 命令
3. Supabase 自动每日备份

### Q: 免费层限制是什么？

**A:** 
- 500MB 数据库存储
- 2GB 带宽
- 50,000 月度活跃用户
- 2 个项目

### Q: 如何升级到付费计划？

**A:** 
1. 进入 **Project Settings** → **Billing**
2. 选择适合的计划
3. 按需付费或订阅

## 📚 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase + Prisma 指南](https://supabase.com/docs/guides/integrations/prisma)
- [Supabase 定价](https://supabase.com/pricing)
- [Supabase Discord 社区](https://discord.supabase.com)

## 🔗 下一步

- [部署文档](./deployment.md) - 了解如何部署应用
- [Prisma 文档](https://www.prisma.io/docs) - 深入学习 Prisma

