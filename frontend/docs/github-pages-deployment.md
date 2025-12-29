# GitHub Pages 部署指南

本指南说明如何将前端应用部署到 GitHub Pages。

## 📋 前置要求

1. GitHub 仓库已启用 GitHub Pages
2. 仓库设置为公开（Public）或 GitHub Pro 账户
3. 后端 API 服务器已部署并可访问

## 🚀 自动部署（推荐）

项目已配置 GitHub Actions，当 `frontend/` 目录下的文件发生变更时，会自动构建并部署到 GitHub Pages。

### 启用 GitHub Pages

1. 进入 GitHub 仓库设置：`Settings` → `Pages`
2. 在 "Source" 部分选择：**GitHub Actions**
3. 保存设置

### 配置环境变量（可选）

如果需要配置后端 API URL，可以在仓库设置中添加 Secrets：

1. 进入 `Settings` → `Secrets and variables` → `Actions`
2. 点击 `New repository secret`
3. 添加以下密钥（可选）：
   - `NEXT_PUBLIC_API_URL`: 后端 API 地址（默认：`https://nekovccat.origin.kim`）

## 🔧 手动部署

如果需要手动触发部署：

1. 进入 GitHub 仓库的 `Actions` 标签页
2. 选择 `Deploy Frontend to GitHub Pages` 工作流
3. 点击 `Run workflow` → `Run workflow`

## 📝 部署配置说明

### Base Path

GitHub Pages 部署使用 base path：`/nekovccat_web`

这意味着应用将部署在：`https://blackvccat.github.io/nekovccat_web`

### 静态导出

- GitHub Pages 只支持静态文件，因此使用 Next.js 的静态导出功能
- API 路由不会在 GitHub Pages 上运行
- 前端会调用配置的后端 API 服务器

### 环境变量

在 GitHub Actions 工作流中配置的环境变量：

- `GITHUB_PAGES`: 设置为 `true` 启用 GitHub Pages 模式
- `BASE_PATH`: 应用的 base path（`/nekovccat_web`）
- `ASSET_PREFIX`: 静态资源前缀（`/nekovccat_web`）
- `NEXT_PUBLIC_API_URL`: 后端 API 地址

## 🐛 故障排除

### 构建失败

1. 检查 GitHub Actions 日志
2. 确认 Node.js 版本兼容（使用 Node.js 20）
3. 检查依赖是否正确安装

### 页面无法访问

1. 确认 GitHub Pages 已启用
2. 检查 base path 是否正确
3. 查看浏览器控制台的错误信息

### API 请求失败

1. 确认后端 API 服务器正在运行
2. 检查 `NEXT_PUBLIC_API_URL` 环境变量配置
3. 确认 CORS 设置允许来自 GitHub Pages 域名的请求

## 📚 相关文档

- [Next.js 静态导出文档](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## ⚠️ 注意事项

1. **API 路由限制**: GitHub Pages 不支持 Next.js API 路由，所有 API 调用会转发到配置的后端服务器
2. **图片优化**: GitHub Pages 模式下图片优化被禁用（`images.unoptimized: true`）
3. **构建时间**: 每次推送都会触发构建，可能需要几分钟
4. **域名**: 默认部署在 `https://[username].github.io/[repository-name]`

## 🔄 更新部署

部署会在以下情况自动触发：

- 推送到 `main` 分支
- `frontend/` 目录下的文件发生变更
- 手动触发工作流

部署完成后，访问：`https://blackvccat.github.io/nekovccat_web`

