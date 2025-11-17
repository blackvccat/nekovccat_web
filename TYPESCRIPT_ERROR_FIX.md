# TypeScript 错误修复指南

## 问题描述

IDE 显示 TypeScript 错误，提示找不到 `react` 和 `next/navigation` 模块，但错误路径指向旧的 `nekovccat_app` 目录。

## 原因

这是 IDE（VS Code）的 TypeScript 语言服务器缓存问题，仍在引用已重命名的旧目录。

## 解决方案

### 方案 1：重启 TypeScript 服务器（推荐）

在 VS Code 中：
1. 按 `Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac)
2. 输入 "TypeScript: Restart TS Server"
3. 选择并执行

### 方案 2：重新加载窗口

在 VS Code 中：
1. 按 `Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac)
2. 输入 "Developer: Reload Window"
3. 选择并执行

### 方案 3：关闭并重新打开项目

1. 关闭 VS Code
2. 重新打开项目根目录（`nexttest`）
3. 确保工作区指向正确的目录

### 方案 4：清理并重新安装依赖

```bash
cd frontend
rm -rf node_modules .next
npm install
```

### 方案 5：检查工作区设置

确保 VS Code 工作区指向项目根目录 `nexttest`，而不是 `nekovccat_app`。

## 已实施的修复

1. ✅ 创建了 `frontend/.vscode/settings.json` 排除旧目录
2. ✅ 更新了 `tsconfig.json` 排除旧目录
3. ✅ 确保依赖已正确安装

## 验证

修复后，错误应该消失。如果仍然存在：

1. 检查 `frontend/node_modules/react` 是否存在
2. 检查 `frontend/node_modules/next` 是否存在
3. 运行 `cd frontend && npm install` 重新安装依赖

