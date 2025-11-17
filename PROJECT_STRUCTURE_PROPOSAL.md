# 项目结构重组方案

## 📁 建议的新项目结构

```
nexttest/
├── frontend/                    # Next.js 前端（原 nekovccat_app）
│   ├── src/
│   ├── prisma/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/                     # Python 后端（新建）
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── docker-compose.yml           # 统一管理前后端和数据库
├── .env.example                 # 共享环境变量示例
├── .gitignore                   # 根目录 Git 配置
└── README.md                    # 项目总说明
```

## 🎯 重组优势

1. **清晰的职责分离**：前后端独立，便于维护
2. **统一的开发环境**：docker-compose 一键启动所有服务
3. **共享配置**：数据库连接等配置统一管理
4. **便于扩展**：未来可以轻松添加其他服务（如 Redis、消息队列等）
5. **符合 Monorepo 最佳实践**

## 📋 执行步骤

1. ✅ 创建 `backend/` 目录和基础结构
2. ✅ 创建根目录 `docker-compose.yml`（整合前后端）
3. ✅ 创建根目录 `.env.example` 和 `README.md`
4. ✅ 将 `nekovccat_app/` 重命名为 `frontend/`（已完成）
5. ✅ 更新所有路径引用（已完成）

## 🔄 迁移注意事项

- 更新 `package.json` 中的脚本路径
- 更新 `tsconfig.json` 中的路径别名
- 更新文档中的路径引用
- Git 历史会保留（使用 `git mv`）

