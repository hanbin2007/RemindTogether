# 部署指南（2核2G 服务器）

## 服务器信息

- IP: 35.173.251.33
- 配置: 2 vCPU / 2GB RAM
- 推测系统: Ubuntu / Debian（待 SSH 登录确认）

---

## Phase 0：基础环境

### 1. 系统更新

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential ufw
```

### 2. 防火墙

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 创建 app 用户

```bash
sudo adduser --disabled-password --gecos "" app
sudo usermod -aG sudo app  # 可选，看你需求
sudo mkdir -p /home/app/.ssh
sudo cp ~/.ssh/authorized_keys /home/app/.ssh/
sudo chown -R app:app /home/app/.ssh
sudo chmod 700 /home/app/.ssh
sudo chmod 600 /home/app/.ssh/authorized_keys
```

后续都用 `app` 用户操作（除了系统级别的安装）。

---

## Phase 1：Node.js（用 nvm）

```bash
# 切换到 app 用户
sudo su - app

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20
node --version  # v20.x

npm install -g pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Phase 2：PostgreSQL 16（调优）

### 安装

```bash
# Ubuntu 24.04 自带的是 PG 16
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 调优配置

编辑 `/etc/postgresql/16/main/postgresql.conf`：

```conf
# Memory (针对 2GB 总内存)
shared_buffers = 128MB                # 默认 128MB → 保持
effective_cache_size = 512MB          # 系统总缓存预估
maintenance_work_mem = 32MB
work_mem = 8MB                        # 默认 4MB

# Connections
max_connections = 30                  # 默认 100 太多

# Write-ahead log
wal_buffers = 4MB
synchronous_commit = on
checkpoint_completion_target = 0.9

# Cost-based optimizer
random_page_cost = 1.1                # SSD 假设
effective_io_concurrency = 200        # SSD

# Logging（生产开启慢查询）
log_min_duration_statement = 200      # 200ms 以上的查询
log_connections = off
log_disconnections = off

# Listen
listen_addresses = 'localhost'        # 仅本机访问
```

应用：
```bash
sudo systemctl restart postgresql
```

### 创建数据库和用户

```bash
sudo -u postgres psql <<EOF
CREATE USER reminder_app WITH PASSWORD '<改成强密码>';
CREATE DATABASE reminder_prod OWNER reminder_app;
GRANT ALL PRIVILEGES ON DATABASE reminder_prod TO reminder_app;
EOF
```

`DATABASE_URL=postgresql://reminder_app:<密码>@localhost:5432/reminder_prod?schema=public`

---

## Phase 3：Nginx + SSL

### 安装

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 配置（`/etc/nginx/sites-available/reminder`）

```nginx
upstream nextjs {
  server 127.0.0.1:3000;
  keepalive 64;
}

server {
  listen 80;
  server_name yourdomain.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name yourdomain.com;

  # certbot 会自动填这些
  # ssl_certificate ...
  # ssl_certificate_key ...

  client_max_body_size 10M;  # 提醒图片上传

  # gzip
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss text/javascript;

  # 静态资源直出，长缓存
  location /_next/static/ {
    proxy_pass http://nextjs;
    proxy_cache_valid 200 365d;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Service Worker — 不缓存
  location = /sw.js {
    proxy_pass http://nextjs;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  # WebSocket 升级
  location /socket.io/ {
    proxy_pass http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 60s;
  }

  # 主应用
  location / {
    proxy_pass http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### 启用 + SSL

```bash
sudo ln -s /etc/nginx/sites-available/reminder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Let's Encrypt
sudo certbot --nginx -d yourdomain.com
sudo systemctl enable certbot.timer  # 自动续期
```

---

## Phase 4：部署应用

### 拉代码

```bash
cd /home/app
git clone <repo> reminder-app
cd reminder-app
npm ci --omit=dev
npx prisma migrate deploy
npx prisma db seed
npm run build
```

### PM2 配置（`ecosystem.config.js`）

```js
module.exports = {
  apps: [{
    name: 'reminder',
    script: './server.js',
    instances: 2,                    // cluster 跑满 2 核
    exec_mode: 'cluster',
    max_memory_restart: '500M',      // 超过 500MB 自动重启
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/home/app/logs/reminder-error.log',
    out_file: '/home/app/logs/reminder-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    kill_timeout: 5000,
  }]
}
```

### 启动 + 自启

```bash
mkdir -p /home/app/logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 复制输出的 sudo 命令运行
```

---

## Phase 5：备份

### 数据库每日备份

`/home/app/scripts/backup-db.sh`：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/home/app/backups
mkdir -p $BACKUP_DIR
pg_dump reminder_prod | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# 保留 7 天
find $BACKUP_DIR -name "db-*.sql.gz" -mtime +7 -delete

# 可选：rsync / aws s3 cp 到外部
```

### Cron

```cron
0 3 * * * /home/app/scripts/backup-db.sh >> /home/app/logs/backup.log 2>&1
*/5 * * * * curl -fsS https://yourdomain.com/api/health > /dev/null || echo "Health check failed at $(date)" >> /home/app/logs/health.log
```

---

## Phase 6：监控

### PM2 监控

```bash
pm2 monit       # 实时
pm2 status      # 进程状态
pm2 logs        # 日志
```

### 内存使用监控

```bash
# 看进程内存
ps aux --sort=-%mem | head -10

# 看 PG 连接数
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# 系统总览
free -h
df -h
```

---

## 故障 Playbook

### 内存爆了

1. `pm2 list` 看哪个进程占内存
2. 单个 Node 进程超 500MB → PM2 应自动重启
3. PG 连接数过多 → 重启 PG 或杀僵尸连接

### 磁盘满了

1. `du -sh /var/log/*` `du -sh /home/app/logs/*` 看谁占的
2. 清旧日志 / 清备份

### Socket.io 跨进程不通

1. 确认 PG NOTIFY 在跑：`SELECT * FROM pg_listening_channels();`
2. 看应用日志是否有 LISTEN 失败

### SSL 过期

certbot timer 应该自动续，手动：`sudo certbot renew`

---

## 环境变量清单（`.env.production`）

```bash
# Database
DATABASE_URL=postgresql://reminder_app:xxx@localhost:5432/reminder_prod

# Auth.js
AUTH_SECRET=<openssl rand -hex 32>
AUTH_URL=https://yourdomain.com

# Email (邮件验证 + 密码重置)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@yourdomain.com

# Web Push (VAPID)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@yourdomain.com

# App
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
```

生成 VAPID 密钥：
```bash
npx web-push generate-vapid-keys
```
</content>
</invoke>