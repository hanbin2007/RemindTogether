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
| Nginx | 1.28.3 | Ubuntu apt | 待配 reverse proxy |
| ufw | 0.36.2 | 已启用 | 入站允许 22/80/443，其余拒绝 |

### PostgreSQL

- DB：`reminder_prod`（owner = `reminder_app`，UTF8）
- 用户：`reminder_app`，密码不入库（在服务器 `~/.env` 或 systemd EnvironmentFile 里）
- 调优（针对 1.9GB RAM）：`shared_buffers=128MB`、`effective_cache_size=512MB`、
  `work_mem=4MB`、`maintenance_work_mem=64MB`、`max_connections=30`、`wal_buffers=4MB`
- 仅监听 127.0.0.1（默认值），不对外暴露

## SSH / 网络

- sshd 仅监听 **22**
- ufw 仅放行 22
- AWS Security Group 入站 22 已开（用户本地 IP 可登）

### 为什么不能让 Claude sandbox 直接 SSH

- Claude sandbox 出口仅允许 80/443
- 该服务器公网 80/443 不直达 EC2，而是经由 AWS ALB / Envoy 七层代理
- 把 sshd 挪到 443 测试过：Envoy 把 SSH 握手当成 HTTP，返回 `HTTP/1.1 400`
- 走 80/443 的 SSH 隧道方案在当前 AWS 拓扑下不可行
  （除非改 ALB / 加 NLB TCP passthrough，工程量太大）

### 工作流（已确定）

Claude 不直连服务器。所有需要在服务器上执行的命令：
1. Claude 写出命令块
2. 用户在本地 ssh session 里粘贴执行
3. 用户把输出贴回 Claude

## 工作流

- Claude 不能从 sandbox 直接登服务器执行命令时，把命令贴出来由用户在终端执行，
  输出回贴。
- 所有提交到本仓库的代码改动，发到分支 `claude/understand-project-kmE5U`。
- 不要主动 `git push` 到其他分支；不要 `--force` 推送。

## 进度

- [x] **Phase 0 · 基础设施**（部分）：系统更新、swap、Node/npm/pm2、PostgreSQL（建库 + 调优）、Nginx、ufw
- [ ] Phase 0 余项：DNS / SSL（Certbot）—— 阻塞于 ALB 路径未明
- [ ] Phase 1 起：项目骨架

## 阻塞 / 待解

- 公网 80/443 流量经由 AWS ALB/Envoy（已确认非直连），需要在 AWS 控制台
  搞清楚：是 ALB 还是 CloudFront？target group 指向哪？后续装 Nginx 时
  要么改 ALB 转发到本机 Nginx（推荐），要么干脆把 ALB 移除让 EIP 直连
- npm 装时拉的 X11/mesa/alacritty/eslint 等 recommend 占了 ~600MB 磁盘，
  装完所有依赖后跑 `sudo apt autoremove --purge -y` 回收
- GitHub repo 已建（`hanbin2007/remindtogether`），无需再建
