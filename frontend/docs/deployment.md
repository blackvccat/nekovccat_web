# 部署文档

## 自托管服务器部署指南

本文档详细说明如何在自托管服务器上部署 Nekovccat App。

### 域名信息

- **生产域名**: https://nekovccat.origin.kim
- **数据库**: PostgreSQL（同服务器或独立服务器）

---

## 服务器准备

### 1. 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: 18.x LTS 或更高
- **PostgreSQL**: 16.x 或更高
- **内存**: 至少 2GB RAM（推荐 4GB+）
- **CPU**: 至少 2 核心
- **存储**: 至少 20GB 可用空间

### 2. 安装必要软件

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 安装 Nginx
sudo apt install nginx -y

# 安装 PM2（进程管理器）
sudo npm install -g pm2

# 安装 Git
sudo apt install git -y
```

---

## 数据库配置

### 1. 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 中执行
CREATE DATABASE nekovccat_app;
CREATE USER nekovccat_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE nekovccat_app TO nekovccat_user;
ALTER DATABASE nekovccat_app OWNER TO nekovccat_user;

# 退出
\q
```

### 2. 配置 PostgreSQL 连接（可选）

如果需要从远程连接数据库，编辑 `/etc/postgresql/16/main/postgresql.conf`:

```conf
listen_addresses = 'localhost'  # 或 '*' 允许所有，或特定 IP
```

编辑 `/etc/postgresql/16/main/pg_hba.conf`:

```
host    nekovccat_app    nekovccat_user    0.0.0.0/0    md5
```

重启 PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## 应用部署

### 1. 克隆项目

```bash
# 创建应用目录
sudo mkdir -p /var/www
cd /var/www

# 克隆项目（替换为你的仓库地址）
sudo git clone <your-repo-url> nekovccat
cd nekovccat/frontend

# 设置权限
sudo chown -R $USER:$USER /var/www/nekovccat
```

### 2. 安装依赖

```bash
cd /var/www/nekovccat/frontend
npm install --production
```

### 3. 配置环境变量

创建 `.env.production` 文件：

```bash
nano .env.production
```

内容：

```env
# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://nekovccat.origin.kim
PORT=3000

# 数据库配置
DATABASE_URL="postgresql://nekovccat_user:your_secure_password_here@localhost:5432/nekovccat_app?schema=public"

# 安全密钥（使用 openssl rand -base64 32 生成）
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://nekovccat.origin.kim"
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npm run db:migrate:deploy
```

### 5. 构建应用

```bash
npm run build
```

### 6. 使用 PM2 启动

```bash
# 启动应用
pm2 start npm --name "nekovccat-app" -- start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 执行输出的命令（通常是 sudo env PATH=...）
```

---

## Nginx 配置

### 1. 创建 Nginx 配置

创建 `/etc/nginx/sites-available/nekovccat.origin.kim`:

```bash
sudo nano /etc/nginx/sites-available/nekovccat.origin.kim
```

配置内容：

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name nekovccat.origin.kim;

    # Let's Encrypt 验证
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    # 重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name nekovccat.origin.kim;

    # SSL 证书路径（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/nekovccat.origin.kim/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nekovccat.origin.kim/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存（可选）
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
```

### 2. 启用站点

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/nekovccat.origin.kim /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## SSL 证书配置

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书（确保域名已解析到服务器 IP）
sudo certbot --nginx -d nekovccat.origin.kim

# 测试自动续期
sudo certbot renew --dry-run
```

Certbot 会自动配置 Nginx 的 SSL。

---

## 防火墙配置

```bash
# 启用 UFW
sudo ufw enable

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

---

## 日常维护

### 更新应用

```bash
cd /var/www/nekovccat/frontend

# 拉取最新代码
git pull origin main

# 安装新依赖
npm install --production

# 运行数据库迁移
npm run db:migrate:deploy

# 重新构建
npm run build

# 重启应用
pm2 restart nekovccat-app
```

### 查看日志

```bash
# 应用日志
pm2 logs nekovccat-app

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### 监控

```bash
# PM2 监控面板
pm2 monit

# 查看应用状态
pm2 status

# 查看资源使用
pm2 show nekovccat-app
```

---

## 备份策略

### 数据库备份

```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup-db.sh
```

内容：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
sudo -u postgres pg_dump nekovccat_app > $BACKUP_DIR/nekovccat_app_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/nekovccat_app_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: nekovccat_app_$DATE.sql.gz"
```

设置可执行并添加到 crontab:

```bash
sudo chmod +x /usr/local/bin/backup-db.sh

# 每天凌晨 2 点备份
sudo crontab -e
# 添加: 0 2 * * * /usr/local/bin/backup-db.sh
```

---

## 故障排查

### 应用无法启动

```bash
# 检查 PM2 状态
pm2 status
pm2 logs nekovccat-app

# 检查端口占用
sudo netstat -tulpn | grep 3000

# 检查环境变量
pm2 env nekovccat-app
```

### 数据库连接失败

```bash
# 测试数据库连接
psql -U nekovccat_user -d nekovccat_app -h localhost

# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 查看 PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Nginx 问题

```bash
# 测试配置
sudo nginx -t

# 检查 Nginx 状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## 安全建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置防火墙**
   - 只开放必要端口（22, 80, 443）
   - 使用 fail2ban 防止暴力破解

3. **数据库安全**
   - 使用强密码
   - 限制数据库访问 IP
   - 定期备份

4. **应用安全**
   - 使用环境变量管理密钥
   - 启用 HTTPS
   - 定期更新依赖

5. **监控和日志**
   - 设置日志轮转
   - 监控服务器资源
   - 设置告警

---

## 联系和支持

如有问题，请查看：
- 项目 README
- Next.js 文档
- Prisma 文档
- PostgreSQL 文档

