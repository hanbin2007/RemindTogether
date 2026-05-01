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
- 当前已装：仅 git、ufw；Node / PostgreSQL / Nginx / Docker 均未装

## SSH 端口约定（重要）

为了让 Claude Code sandbox 能直接 SSH 到服务器（sandbox 出口仅允许 80/443），
sshd 同时监听 **22 和 443**：

- `Port 22` —— 兜底，本地或 18.206.107.29 等正常网络可达
- `Port 443` —— Claude sandbox 用这个端口连
- 配置文件：`/etc/ssh/sshd_config.d/99-port443.conf`
- ufw 已放行 22、443
- AWS Security Group 必须同时放行 22、443 入站

### 后续 TODO（部署 HTTPS 时）

到 Phase 7 / Phase 10 部署 Nginx + Certbot 时，443 要还给 HTTPS。届时二选一：

1. **简单**：把 sshd 从 443 挪走（仅留 22），sandbox 失去直连能力 ——
   改成 "用户在本地 SSH，把命令贴回 Claude" 的工作流
2. **优雅**：装 `sslh`，让 443 同时承载 HTTPS 和 SSH（基于协议探测分流）

## 工作流

- Claude 不能从 sandbox 直接登服务器执行命令时，把命令贴出来由用户在终端执行，
  输出回贴。
- 所有提交到本仓库的代码改动，发到分支 `claude/understand-project-kmE5U`。
- 不要主动 `git push` 到其他分支；不要 `--force` 推送。

## 阻塞 / 待解

- AWS Security Group 是否放行 22、443 入站 —— 待 AWS 控制台确认
- 公网 80/443 之前返回 Envoy 503，但本机无监听 —— 怀疑前置 ALB/代理，
  待 `curl -s4 https://api.ipify.org` 确认公网 IP 是否直连
- GitHub repo 已建（`hanbin2007/remindtogether`），无需再建
