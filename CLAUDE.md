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

## 进度

- [x] **Phase 0 · 基础设施**：全部完成（系统、swap、Node/npm/pm2、PostgreSQL、Nginx + SSL、ufw、DNS）
- [ ] Phase 1 起：项目骨架（Next.js + Socket.io + Prisma）

## 阻塞 / 待解

- npm 装时拉的 X11/mesa/alacritty/eslint 等 recommend 占了 ~600MB 磁盘，
  装完所有应用依赖后跑 `sudo apt autoremove --purge -y` 回收
- GitHub repo 已建（`hanbin2007/remindtogether`），无需再建
