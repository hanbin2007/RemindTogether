# 实施计划

按依赖顺序，每个阶段结束后都有可运行可测试的产物。

---

## Phase 0 · 基础设施（半天）

**目标**：服务器环境就绪，能跑 Hello World

- [ ] 解决 SSH 接入（开 22 端口 / 改端口 / 用跳板）
- [ ] 系统更新：`apt update && apt upgrade`
- [ ] 安装：Node.js 20 LTS（nvm）、PostgreSQL 16、Nginx、PM2、git、build-essential
- [ ] 创建 `app` 用户（不用 root 跑 Node）
- [ ] PostgreSQL 调优（参考 `07-DEPLOYMENT.md`）
- [ ] 创建数据库：`reminder_prod`、`reminder_app` user
- [ ] 配置防火墙：仅开 22, 80, 443
- [ ] 配置域名 DNS → 服务器 IP
- [ ] 配置 Nginx + Certbot SSL（Let's Encrypt）

**验收**：`https://yourdomain.com` 能返回 Nginx 默认页

---

## Phase 1 · 项目骨架（半天）

**目标**：Next.js + Socket.io + Prisma 跑起来，能数据库读写

- [ ] `npx create-next-app@latest reminder-app --ts --tailwind --app`
- [ ] 装依赖：`prisma`, `@prisma/client`, `socket.io`, `socket.io-client`, `next-auth@beta`, `@auth/prisma-adapter`, `bcrypt`, `web-push`, `pino`, `zod`
- [ ] 配置 `output: 'standalone'`
- [ ] 写 `server.js`（custom server with Socket.io）
- [ ] 写完整 `prisma/schema.prisma`（参考 `04-DATA-MODEL.md`）
- [ ] `prisma migrate dev` 建初始 migration
- [ ] 写 seed 脚本（admin user、初始 Config 项）
- [ ] PM2 配置 `ecosystem.config.js`
- [ ] Nginx 配置 reverse proxy + WebSocket upgrade
- [ ] 部署测试

**验收**：浏览器访问能看到 Next.js 默认页，Socket.io 能握手

---

## Phase 2 · Auth & 用户系统（1 天）

**目标**：邮箱注册、登录、邀请 token

- [ ] Auth.js v5 配置（credentials provider + Prisma adapter）
- [ ] 注册页 `/auth/signup`：邮箱、密码、显示名
- [ ] 邮件验证（用 Resend / Postmark / SMTP）
- [ ] 登录页 `/auth/login`
- [ ] 密码重置流（请求邮件 → 链接 → 重设）
- [ ] 邀请 token 流：未注册用户 → 注册 → 自动加入群
- [ ] 中间件：保护 `/app/*` 和 `/admin/*`
- [ ] 时区检测：注册时自动取 `Intl.DateTimeFormat().resolvedOptions().timeZone`，存 Users.timezone

**验收**：能注册、登录、登出；通过邀请链接注册能自动入群

---

## Phase 3 · 核心 CRUD APIs（2 天）

**目标**：提醒、群组、成员的全套 CRUD

### Reminders API
- `POST /api/reminders` 创建（私人或群组）
- `GET /api/reminders?scope=today|private|group:xxx` 列表
- `GET /api/reminders/:id` 详情
- `PATCH /api/reminders/:id` 编辑（鉴权）
- `DELETE /api/reminders/:id` 软删除（鉴权）
- `POST /api/reminders/:id/complete` 完成（含 mediaUrl, note）
- `POST /api/reminders/:id/skip` 跳过日
- `POST /api/reminders/:id/claim` 认领
- `DELETE /api/reminders/:id/claim` 取消认领
- `POST /api/reminders/:id/comments` 评论
- `POST /api/reminders/:id/reactions` emoji 反应

### Groups API
- `POST /api/groups` 创建群
- `GET /api/groups` 我的群列表
- `GET /api/groups/:id` 详情
- `PATCH /api/groups/:id` 编辑（owner only）
- `POST /api/groups/:id/invites` 生成邀请 token
- `POST /api/groups/:id/join?token=xxx` 通过 token 加入
- `DELETE /api/groups/:id/members/:userId` 移除成员（owner only）
- `POST /api/groups/:id/leave` 退群
- `DELETE /api/groups/:id` 解散群（owner only）

### Tags API
- `GET /api/tags` 列表
- `POST /api/tags` 创建
- `PATCH /api/tags/:id` 编辑
- `DELETE /api/tags/:id` 删除

**关键实现要点**：
- 所有 API 走 **service layer**，不在 route handler 里直接 prisma 调用
- 私人提醒强制鉴权：`creator_id === session.user.id`
- 群组提醒鉴权：`groupMember(group_id, session.user.id)` 必须存在
- Zod 校验所有入参

**验收**：postman 跑全套接口通过；私人/群组隔离测试通过

---

## Phase 4 · Socket.io 实时层（1 天）

**目标**：所有写操作触发实时事件

- [ ] Socket.io 握手 + 自动 join rooms
- [ ] PG LISTEN/NOTIFY 跨进程 pub/sub
- [ ] 在所有 mutation API 里调 `broadcast(room, event, payload)`
- [ ] 客户端 `useSocketEvent` hook
- [ ] 各页面订阅相关事件，触发 React Query 失效
- [ ] 重连后全量刷新当前页

**验收**：两台浏览器同时打开同一群，A 操作 B 实时看到

---

## Phase 5 · 拍拍系统（半天）

- [ ] `POST /api/pokes` 发拍拍
  - 校验：必须关联 reminder_id（除非用户开了 unlinked 开关 + 全局 feature flag 也开）
  - 校验：今天对此人 < 3 次（事务里 SELECT FOR UPDATE）
  - 写 Poke + Notification + 触发 Socket.io + Web Push
- [ ] `GET /api/pokes/inbox` 收件箱
- [ ] `PATCH /api/pokes/:id/read` 标记已读
- [ ] `GET /api/pokes/quota?to_user_id=xxx` 查询今日余量

**验收**：超过 3 次返回 429；收方实时收到

---

## Phase 6 · 连胜 & 保护卡（1 天）

- [ ] Cron 任务：每小时检查所有用户是否到了"今天的午夜"（按各自时区）
  - 到了 → 检查昨天有无 Completion
  - 有 → InsertStreakDay(DONE)
  - 无 → 看 ShieldCard 余量
    - 余量 > 0 → -1，Insert(PROTECTED)
    - 余量 = 0 → Insert(MISSED)，断连胜
- [ ] 完成提醒时：检查是否触发 7/30 天里程碑 → 发 `streak:milestone`
- [ ] 保护卡获取：连胜满 7 天 → +1（封顶 5）
- [ ] `GET /api/me/streak` 查连胜状态
- [ ] `POST /api/me/skip-today` 跳过日（不消耗保护卡，记 SKIPPED）

**验收**：手动测试三种场景（完成 / 漏 + 有保护卡 / 漏 + 无保护卡）

---

## Phase 7 · Web Push & PWA（1 天）

- [ ] 生成 VAPID 密钥对，存到环境变量
- [ ] 写 `manifest.webmanifest`、应用图标
- [ ] Service Worker：
  - 缓存策略（Workbox 或手写）
  - `push` 事件 → 显示通知
  - `notificationclick` → 跳转到对应页
- [ ] 客户端：请求订阅、上报 endpoint
- [ ] 服务端：`POST /api/push/subscribe` 存订阅
- [ ] 触发逻辑：拍拍、提醒到期、连胜里程碑触发 push
- [ ] 处理 push 错误：410 Gone → 删除订阅

**验收**：在 Chrome 关闭 tab 后仍能收到推送；iOS Safari 添加到主屏后能收到

---

## Phase 8 · 管理后台（2 天）

参考 `02-ADMIN-PRD.md` 实现：

- [ ] `/admin` 中间件：检查 `is_admin`
- [ ] `/admin` 数据看板（5-6 个核心指标 + 折线图）
- [ ] `/admin/users` 列表 + 搜索 + 详情 + 操作
- [ ] `/admin/reports` 举报队列 + 处理
- [ ] `/admin/config` 配置编辑（form + 保存即生效）
- [ ] `/admin/groups` 群组管理
- [ ] AdminLog 审计日志
- [ ] 用户侧加举报入口

**验收**：admin 能完成五大模块的所有操作；非 admin 访问 302

---

## Phase 9 · 前端屏幕对接（3-4 天）

把设计稿 25 个屏从静态原型迁移到真实 API：

### 核心 9 屏
- [ ] 今天 → 真实数据：今日提醒 + 今日小赢 + 拍拍提醒
- [ ] 私人清单
- [ ] 群组列表
- [ ] 群组详情（含加油榜实时刷新）
- [ ] 创建提醒（底部 sheet）
- [ ] 邀请页
- [ ] 拍拍流（含限额提示）
- [ ] 提醒详情（评论、反应、热力图）
- [ ] 个人主页 + 通知

### 二级 16 屏
按设计稿分组实现，所有交互对接 API + Socket.io

**验收**：
- 完整跑通"晨间被拍 → 完成 → 庆祝 → 分享"链路
- 移动端在 iPhone Safari + Android Chrome 视觉无差异
- PWA 安装到主屏后体验顺畅

---

## Phase 10 · 部署优化与上线（1 天）

- [ ] PM2 cluster 配置 + 内存自动重启
- [ ] Nginx gzip / brotli / 静态文件长缓存
- [ ] 数据库慢查询日志开启
- [ ] 应用日志写文件 + logrotate
- [ ] 健康检查 cron（curl + 失败邮件告警）
- [ ] 备份：每日 pg_dump 到 S3 / 备份盘
- [ ] 域名、SSL 自动续期（certbot timer）
- [ ] PWA Lighthouse 跑分

**验收**：生产环境跑通，监控/告警/备份就绪

---

## 总工时预估

| 阶段 | 工时 | 累计 |
|---|---|---|
| 0 基础设施 | 0.5d | 0.5d |
| 1 项目骨架 | 0.5d | 1d |
| 2 Auth | 1d | 2d |
| 3 核心 CRUD | 2d | 4d |
| 4 Socket.io | 1d | 5d |
| 5 拍拍 | 0.5d | 5.5d |
| 6 连胜 | 1d | 6.5d |
| 7 Push & PWA | 1d | 7.5d |
| 8 管理后台 | 2d | 9.5d |
| 9 前端屏对接 | 3-4d | 13.5d |
| 10 部署优化 | 1d | 14.5d |

**单人节奏：约 3 周**（含来回沟通和测试）
</content>
</invoke>