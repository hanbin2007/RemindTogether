# 技术架构

## 技术栈

| 层 | 选型 | 版本 | 理由 |
|---|---|---|---|
| 前端框架 | Next.js (App Router) | 15.x | SSR + API routes 一体，SEO 友好 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 实时通信 | Socket.io | 4.x | 全双工，挂在 Next.js custom server |
| 数据库 | PostgreSQL | 16.x | 关系数据，复杂查询（连胜/榜单） |
| ORM | Prisma | 5.x | 类型安全、迁移管理 |
| 认证 | Auth.js (NextAuth v5) | 5.x | 邮箱+密码，session 存 PG |
| Push | Web Push API + VAPID | - | 标准 PWA 推送 |
| 文件存储 | 本地磁盘（v1）/ S3 兼容（v2） | - | v1 简单，v2 弹性 |
| 进程管理 | PM2 | 5.x | cluster 模式 + 内存监控 + 自动重启 |
| 反向代理 | Nginx | 1.24+ | SSL 终结、gzip、静态文件 |
| 日志 | pino + pm2 logrotate | - | 轻量结构化日志 |

**不使用**：
- ❌ Docker（2GB 内存吃不消容器 overhead）
- ❌ Redis（用 PostgreSQL 存 session 和限流计数）
- ❌ Elasticsearch（用 PostgreSQL 全文搜索）
- ❌ 第三方分析（自建轻量看板）

---

## 进程拓扑

```
┌─────────────────────────────────────────────────┐
│  Internet                                       │
└────────────────────┬────────────────────────────┘
                     │ HTTPS (443)
                     ▼
┌─────────────────────────────────────────────────┐
│  Nginx (reverse proxy + SSL termination)       │
│  - gzip                                         │
│  - WebSocket upgrade for /socket.io/*           │
│  - 静态文件直出（/_next/static/*）              │
└────────────────────┬────────────────────────────┘
                     │ HTTP (3000)
                     ▼
┌─────────────────────────────────────────────────┐
│  Next.js custom server (PM2 cluster ×2)        │
│  - HTTP server (Next.js handler)                │
│  - Socket.io server (同进程)                    │
│  - 内存上限 500MB/进程，超出自动重启            │
└────────────────────┬────────────────────────────┘
                     │ TCP (5432)
                     ▼
┌─────────────────────────────────────────────────┐
│  PostgreSQL 16 (本机)                           │
│  - shared_buffers = 128MB                       │
│  - max_connections = 30                         │
└─────────────────────────────────────────────────┘
```

---

## 内存预算（2GB 服务器）

```
组件                       内存
────────────────────────────────
OS + 系统服务              ~200MB
Nginx                      ~50MB
PostgreSQL（调优后）       ~350MB
Next.js + Socket.io ×2     ~900MB（450 × 2）
PM2 守护进程               ~50MB
预留缓冲                   ~450MB
────────────────────────────────
合计                       ~2000MB
```

---

## 实时通信架构

### Socket.io 同进程部署

不另起 Socket.io 服务器，挂在 Next.js custom server 上：

```js
// server.js (custom Next.js server)
const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res))
  const io = new Server(server, {
    path: '/socket.io',
    cors: { origin: process.env.NEXT_PUBLIC_BASE_URL }
  })

  // attach Socket.io handlers
  require('./lib/socket').init(io)

  server.listen(3000)
})
```

### Cluster 模式下的 Socket.io 痛点

PM2 cluster ×2 会导致 Socket.io 跨进程通信问题（连接到 worker A 的用户收不到 worker B 推的消息）。

**v1 解决方案**：用 PostgreSQL `LISTEN/NOTIFY` 做跨进程 pub/sub。已经有 PG 了，零额外依赖。

**v2 升级路径**：如果用户量起来，加 Redis adapter（`@socket.io/redis-adapter`）。

```
进程A 收到事件 → 写 PG NOTIFY → 进程B LISTEN 到 → 推给本进程内的连接
```

---

## PWA 配置

- `manifest.webmanifest`：app 名、图标（192/512px）、theme_color、display: standalone
- Service Worker：
  - 缓存静态资源（offline-first）
  - 处理 Web Push
  - 后台同步（v2）
- 引导用户"添加到主屏"（iOS Push 前提）

---

## Auth.js 配置要点

- Provider：`credentials`（邮箱+密码）+ 邮件验证
- Adapter：`@auth/prisma-adapter`，session 存 PG
- 密码哈希：`bcrypt`（cost 12）
- Session：JWT 短期 + refresh，或 DB session
- 中间件保护：`/admin/*` 检查 `is_admin`

---

## 关键安全考虑

| 风险 | 缓解措施 |
|---|---|
| 私人提醒泄露到群组视图 | 所有查询强制走 service layer，禁止直接 ORM 调用 |
| 拍拍刷屏 | 服务端按 `(from_id, to_id, date)` 计数，超 3 拒绝 |
| 邀请 token 暴力破解 | token 用 `crypto.randomBytes(32)`，72h 过期 |
| 管理员误操作 | 关键操作（封禁、解散群、删账号）二次确认 + AdminLog |
| Web Push VAPID 私钥泄露 | 仅服务端存，环境变量 + 定期轮换 |
| SQL 注入 | Prisma 自动参数化，禁用 `$queryRawUnsafe` |
| XSS | Next.js 默认转义；用户输入富文本走 sanitize |

---

## 监控

v1 简单做：
- PM2 内置监控（`pm2 monit`）
- Nginx access log
- pino 结构化日志写文件，logrotate 轮转
- 简单 cron 跑健康检查（curl 自家 API + 写日志）

v2 可加：Grafana + Prometheus，或托管的 Datadog / Sentry
</content>
</invoke>