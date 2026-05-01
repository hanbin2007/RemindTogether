# CLAUDE.md

Claude Code 在本仓库工作时的常识备忘。

## 项目

群组提醒 web app（详见 `README.md` 和 `docs/`）。

- 状态：尚未编码。PRD / 架构 / 数据模型 / 实施计划已锁定（`docs/01..08`）
- 设计稿：25 屏在 `design/project/`
- 开发分支：`claude/understand-project-kmE5U`

## 服务器

- 公网 IP：`35.173.251.33`
- 配置：2 vCPU / 1.9 GiB RAM / 19 GB 盘（AWS EC2）
- OS：Ubuntu 26.04 LTS（kernel 7.0.0-1004-aws）
- SSH 用户：`ubuntu`（密码登录关闭，密钥登录）
- swap：1 GiB（`/swapfile`，已写 fstab）

### Phase 0 已装的软件栈

| 软件 | 版本 | 来源 | 备注 |
|---|---|---|---|
| Node.js | 22.22.1 | Ubuntu 26.04 默认 apt | LTS，比 PRD 写的 20 还新 |
| npm | 9.2.0 | Ubuntu apt | 拉了大量无用 recommend（mesa/alacritty/eslint/webpack/node-tap 等），可 `apt autoremove --purge` 清理 |
| pm2 | 6.0.14 | `npm i -g` |  |
| PostgreSQL | 18.3 | Ubuntu 26.04 默认 apt | PRD 写 16，实际更新；调优文件 `/etc/postgresql/18/main/conf.d/99-tune.conf` |
| Nginx | 1.28.3 | Ubuntu apt | vhost：`/etc/nginx/sites-available/rt.origenclub.cn`（HTTP→HTTPS 301 跳转） |
| Certbot | apt | Ubuntu apt | Let's Encrypt 证书：`/etc/letsencrypt/live/rt.origenclub.cn/`，到期 2026-07-30，certbot.timer 自动续期 |
| ufw | 0.36.2 | 已启用 | 入站允许 22/80/443，其余拒绝 |

### 域名 / SSL

- 公网域名：`rt.origenclub.cn`（DNS 在阿里云解析，A 记录直接指 35.173.251.33）
- HTTPS 已开通，HTTP/2，自动 80→443 跳转
- 证书续期：`sudo certbot renew --dry-run` 验证过

### PostgreSQL

- DB：`reminder_prod`（owner = `reminder_app`，UTF8）
- 用户：`reminder_app`，密码不入库（在服务器 `~/.env` 或 systemd EnvironmentFile 里）
- 调优（针对 1.9GB RAM）：`shared_buffers=128MB`、`effective_cache_size=512MB`、
  `work_mem=4MB`、`maintenance_work_mem=64MB`、`max_connections=30`、`wal_buffers=4MB`
- 仅监听 127.0.0.1（默认值），不对外暴露

## SSH / 网络

- sshd 仅监听 **22**
- ufw 仅放行 22、80、443
- AWS Security Group `launch-wizard-1`：入站 22、80、443 都已开
- EC2 公网 IP `35.173.251.33` 直接绑在 instance 上，**没有 ALB / CDN**

### Claude sandbox 用 chisel 隧道直连服务器（已搭好）

Sandbox 出口只允许 80/443，无法直连 22。架构：

```
sandbox  --(WSS)-->  https://rt.origenclub.cn/_chisel/  --(nginx WS proxy)-->
  127.0.0.1:8090 (chisel server)  --(local TCP)-->  127.0.0.1:22 (sshd)
```

**服务器侧**（一次性，已完成）：
- chisel 二进制：`/usr/local/bin/chisel` v1.10.1
- systemd unit：`chisel.service`（监听 127.0.0.1:8090）
- 认证文件：`/etc/chisel/auth.json`（user: `claude`, secret: 64-hex）
- nginx snippet：`/etc/nginx/snippets/chisel.conf`，已 include 进 vhost
- 路径：`/_chisel/`（必须带尾斜杠，因为 nginx 会 301）

**Sandbox 侧**（每次新会话）：
```
CHISEL_SECRET=<server side 输出的 64-hex> bash scripts/sandbox-tunnel.sh
```
脚本会下载 chisel 客户端、起 tunnel、配 SSH alias。之后用 `ssh rt` 直接登服务器。

⚠️ secret **不要进 git**。每次新会话用户贴一次到 Claude，Claude 写到 env var。
若怀疑泄露：在服务器 `sudo systemctl restart chisel` 前重新生成 auth.json。

### 关于"Envoy 503"的真相（之前误判）

之前从 Claude sandbox 测公网 80/443 时拿到 Envoy 503，**根因不是 AWS 这边的代理**，
而是 Claude sandbox 自己的出口代理（也是 Envoy 实现）：当目标端口没人监听时，
sandbox 的 Envoy 会返回 "upstream connect error: Connection refused" 形式的 503。
现在 nginx 起来 + SSL 装好后，已经验证从 sandbox 直接拿到 nginx 的 200 响应，
没有任何中间代理。

### 关于 sandbox 看到的 TLS 证书

从 Claude sandbox 用 openssl 看 `https://rt.origenclub.cn` 的证书会显示
`Anthropic sandbox-egress-production TLS Inspection CA` 颁发的中间人证书 ——
这是 sandbox 出口的 TLS Inspection。实际公网用户看到的是 Let's Encrypt 证书。

### 不能让 Claude sandbox 直接 SSH

- Claude sandbox 出口仅允许 80/443
- sshd 占用 22，挪到 443 测过：被 sandbox 自己的 Envoy 当成 HTTP 拒掉
- 不值得为此动 AWS 网络拓扑

### 工作流（已确定）

Claude 不直连服务器。所有需要在服务器上执行的命令：
1. Claude 写出命令块
2. 用户在本地 ssh session 里粘贴执行
3. 用户把输出贴回 Claude

⚠️ 注意：用户的终端把 `http://...` / `<域名>` 这类 URL/域名自动包成 `<...>`，
导致 bash 当成重定向。Claude 写命令时**避免裸域名/URL**，改用变量拼接：
```
A=rt; B=origenclub; T=cn; DOMAIN="$A.$B.$T"
P=http; URL="${P}://${DOMAIN}/"
```

## 工作流

- Claude 不能从 sandbox 直接登服务器执行命令时，把命令贴出来由用户在终端执行，
  输出回贴。
- 所有提交到本仓库的代码改动，发到分支 `claude/understand-project-kmE5U`。
- 不要主动 `git push` 到其他分支；不要 `--force` 推送。

## 测试要求（项目级硬要求）

**每个 Phase 验收前必须配套测试**。目标：尽可能 100% 覆盖**实际用户体验**。

### 三层

1. **单元**（vitest）—— service layer、validator、纯逻辑（连胜计算、拍拍限额等）
2. **集成**（vitest + 测试 DB `reminder_test`）—— API routes、Prisma、Socket.io 事件
3. **E2E**（@playwright/test）—— **重点**，跑真浏览器，覆盖 PRD 里每条 user journey

### 覆盖门槛

- service / validator / API：行覆盖 ≥ 95%
- 每条 PRD user journey 至少一个 Playwright 测试，包括但不限于：
  - 注册 → 邮箱验证 → 创建第一条提醒
  - 创建群 → 邀请链接 → 第二个用户注册并加入
  - 群提醒 → 完成 → 加油榜实时刷新（双窗口验证 Socket.io）
  - 拍拍：发起 → 限额 4 次第 4 次拒绝 → 收方看到全屏
  - 连胜：完成日 → +1；漏一日 → 消保护卡；保护卡为 0 时 → 断
  - 离线 → 重连 → 数据自动刷新
- 不接受"为覆盖率而测"的空壳

### "实际用户体验" 的意思

❌ 不要：测 mock 之间互相调用、测 `expect(addOne(2)).toBe(3)` 这种
✅ 要：Playwright 真正点击按钮、填表、看 toast、看动画、看实时推送

### 每个 Phase 验收清单（强制）

- [ ] 新增代码全部带 unit test
- [ ] 该 Phase 的 API 全部带 integration test
- [ ] 该 Phase 的核心 user flow 全部带 Playwright E2E
- [ ] 在服务器上 `pnpm test`（含 e2e）跑通
- [ ] coverage 报告满足门槛
- [ ] **测试不通过 = Phase 不算完**，不进入下一 Phase

### 工具栈

- `vitest` — 单元 + 集成
- `@playwright/test` — E2E + 双客户端 Socket.io 测试
- `pg-mem` 或 `reminder_test` 真实 DB — 集成测试
- `msw` — mock 外部 HTTP（邮件 / Web Push 上游）
- CI：Phase 10 部署前加 GitHub Actions，PR 必须绿才能合到 main

## 进度

- [x] **Phase 0 · 基础设施**：全部完成（系统、swap、Node/npm/pm2、PostgreSQL、Nginx + SSL、ufw、DNS）
- [x] **Phase 1 · 项目骨架**：全部完成
  - Next.js 16.2.4 + TS + Tailwind 4 + App Router
  - 自定义 `server.js`（HTTP + Socket.io + pino，graceful shutdown）
  - Prisma 6 schema 全 20 个模型 + initial migration（已应用到 reminder_prod）
  - PM2 fork 模式（systemd 自启已配，开机恢复）
  - Nginx 反代 :3000 + WebSocket upgrade（/_chisel 隧道仍正常）
- [x] **Phase 2 · Auth & 用户系统**：全部完成
  - 数据：`EmailVerification`、`PasswordReset`、`MailLog` 三张表（migration 已部署）
  - `src/lib/{password,random,env,mailer}.ts`：bcryptjs cost 12、base64url token、
    DevMailer（写 MailLog）+ SmtpMailer 占位（等 SMTP 凭证后接 nodemailer）
  - `src/services/auth/`：createUser、verifyCredentials、邮件验证
    issue/consume、密码重置 request/consume（防 enumeration + consume 时
    invalidate 同用户其它 outstanding token）、邀请 issue/preview/consume
    （已是成员幂等、支持 re-join）
  - NextAuth v5（credentials + JWT 策略，DB session 在 v5 credentials provider
    下不稳定）。Edge-safe 拆分：`src/lib/auth/config.shared.ts`（无 DB）给
    middleware 用，`src/lib/auth/config.ts`（含 Credentials authorize）给
    handler / server actions / server components 用。
  - 页面 + Server Actions：`/auth/{signup,login,verify-email,forgot,reset}`、
    `/app`（受保护占位）、`/invite/[token]`（匿名/已登录两条路）
  - 注册时自动捕获时区（`Intl.DateTimeFormat().resolvedOptions().timeZone`）
- [x] **UI 设计语言（Phase 2 起对齐设计稿）**：手绘 sketch 风
  - 字体：Caveat（手写标题）+ Kalam（手写正文）+ JetBrains Mono（chrome）
    via `next/font`，Inter 仅作 fallback
  - 调色板沉淀到 `src/app/globals.css` 的 `@theme inline`：
    `--rt-paper #faf7f1`、`--rt-ink #1a1a1a`、`--rt-poke`（戳红）、
    `--rt-claim`（认领蓝）、`--rt-done`（完成绿）、`--rt-highlight`（高亮黄）
  - 原语：`.rt-box`（不规则手绘圆角）、`.rt-btn`（hover 轻抬+微旋、
    active 反向）、`.rt-input`（暖色 focus ring）、`.rt-squig`（手绘
    波浪下划线）、`.rt-hl`（高亮笔）
  - 微动画 ≤360 ms：`rt-fade-up`（页面入场）、`rt-nudge`（错误轻抖）、
    `rt-check-draw`（验证成功对勾画线）。`prefers-reduced-motion` 全部尊重
  - 复用组件：`src/components/sketch/{auth-shell,field,notice}.tsx`
- [x] **Phase 3 · 核心 CRUD APIs**：全部完成
  - 基础设施：`src/lib/api/{errors,handler}.ts` 统一抛/接 `HttpError`
    家族（401/403/404/409/422/429/500）；`src/lib/auth/guards.ts` 提供
    `requirePrincipal` / `requireAdmin`
  - 服务层（route handler 保持瘦身，所有鉴权 + 业务规则在 service 内）：
    - `services/tags.ts`：list/create/update/delete，按用户隔离
    - `services/groups.ts`：create/list/get（含成员）/update（owner only）
      /removeMember/leave（owner 不能直接退）/disband（级联 leftAt）/
      issueInviteForGroup/joinGroupByToken（受 `GroupMaxMembers` 配置约束）
    - `services/reminders.ts`：CRUD（PRIVATE/GROUP visibility，groupId
      约束）+ scope=today\|private\|group:UUID 列表 + complete（非
      RRULE 自动 DONE）+ skip + claim/unclaim（仅 GROUP）+ comment +
      reaction（同 emoji 幂等）。`assertReminderAccess` 暴露
      `isCreator`/`isGroupOwner`/`canWriteContent` 让上层不重复实现规则
  - 16 个新增路由（App Router、`runtime: nodejs`、`force-dynamic`）：
    `/api/{tags,tags/[id],groups,groups/[id],groups/[id]/leave,
    groups/[id]/members/[userId],groups/[id]/invites,groups/[id]/join,
    reminders,reminders/[id],reminders/[id]/{complete,skip,claim,
    comments,reactions}}`
  - **测试基线**累计：
    - 22 unit + 53 integration（new: tags 7、groups 14、reminders 17）
    - 46 e2e local（含 api-phase3.spec.ts 8 个全链路：private 隔离、
      团队 invite→join→reminder→claim→complete、非成员 403、validation
      422、tag 用户隔离、群 disband 权限）
    - 25 e2e `@smoke` 跑生产（含新 5 个 API 401 守门测试）
- [x] **Phase 4 · Socket.io 实时层**：全部完成
  - 入口：`server.js` → `server.ts`，PM2 通过 `node --import tsx` 启动
    （fork 模式不能 require shell wrapper）；esbuild 启动开销 < 100 ms
  - `src/lib/socket/`：
    - `auth.ts` 在 WS 握手时用 `next-auth/jwt` 解 cookie 拿 userId
    - `init.ts` 鉴权中间件 + 自动 join `user:<id>` 与所有活跃
      `group:<id>` room（连接时 read-once，后续 join/leave 由对应
      broadcast 事件维护）
    - `pubsub.ts` 独立 pg client 走 `LISTEN rt_socket`；任意 worker
      `pg_notify('rt_socket', ...)` 后所有订阅者本地 io re-emit
      （单进程也走一圈 round trip，方便后面切 cluster 不改代码）
    - `broadcast.ts` 类型化 `RtEvent` 枚举 + `groupRoom/userRoom` 助手 +
      fire-and-forget `broadcast()`（吞错；canonical state 在 PG）
  - 服务层挂钩：reminders 全部 mutation（create/update/delete/complete/
    claim/unclaim/comment/reaction）+ groups（join/leave/remove/disband）
    在落库后 broadcast 对应 RtEvent 到 group room
  - 客户端：`src/lib/socket/client.ts` 单例 + `src/hooks/use-socket.ts`
    （`useSocketEvent` / `useSocketStatus`）；`/app/realtime` debug 面板
    展示实时事件流（手动验证 + Playwright 锚点）
  - **测试**：
    - 2 integration（broadcast → PG NOTIFY → socket.io 端到端、跨房隔离）
    - 3 e2e（chromium 单跑，webkit 跳）：成员实时收 reminder:created、
      claim+complete 双窗口同步、非成员零事件
- [x] **Phase 5 · 拍拍系统**：全部完成
  - `src/services/pokes.ts`：sendPoke 校验自戳 / 接收方 ban / 链接策略
    （unlinked 需要 `poke.allowUnlinked` 全局 + 接收方 PokeSetting
    双开）+ doNotDisturb；事务里 `SELECT FOR UPDATE` 锁接收方 User
    行做 quota（默认 3/天/对，admin 可改 `poke.dailyLimitPerRecipient`）；
    成功后同事务写 Poke + Notification，事务外 broadcast
    `poke:received` + `notification:new` 到 `user:<recipient>`
  - listInbox / markPokeRead（仅接收方，幂等）/ getPokeQuota
  - 4 路由：`POST /api/pokes`、`GET /api/pokes(/inbox)`、
    `PATCH /api/pokes/[id]/read`、`GET /api/pokes/quota`
  - 测试：14 integration（链接/未链接/DND/限额/Config 覆盖/接收方分桶/
    收件箱顺序/unread 过滤/recipient-only mark-read）+ 6 e2e
    （chromium 双窗口验证 PRD 验收：实时收 poke:received，4 次 429）
- [ ] Phase 6：连胜 & 保护卡

### 部署目录结构

- 仓库：`/home/ubuntu/app`（git clone of `hanbin2007/RemindTogether`，分支
  `claude/understand-project-kmE5U`）
- `.env`（仅生产，不入 git）：`DATABASE_URL`、`NEXT_PUBLIC_BASE_URL` 等
- 日志：`/home/ubuntu/app/logs/{out,error}.log`，PM2 自动写
- 进程：`pm2 list` 看状态，`pm2 logs remindtogether` 看实时
- systemd 单元：`pm2-ubuntu.service`（开机自启 PM2 daemon）

### 部署流程（Phase 2 起每次发版）

```
ssh rt
cd ~/app
git pull
pnpm install --frozen-lockfile     # 仅在 lockfile 变化时
pnpm exec prisma migrate deploy    # 仅在新增 migration 时
pnpm exec prisma generate          # 仅在 schema 变化时
pnpm build
pm2 reload remindtogether          # 0-downtime
```

## 阻塞 / 待解

- npm 装时拉的 X11/mesa/alacritty/eslint 等 recommend 占了 ~600MB 磁盘，
  装完所有应用依赖后跑 `sudo apt autoremove --purge -y` 回收
- GitHub repo 已建（`hanbin2007/remindtogether`），无需再建
