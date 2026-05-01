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

## 阻塞 / 待解

- 公网 80/443 流量经由 AWS ALB/Envoy（已确认非直连），需要在 AWS 控制台
  搞清楚：是 ALB 还是 CloudFront？target group 指向哪？后续装 Nginx 时
  要么改 ALB 转发到本机 Nginx（推荐），要么干脆把 ALB 移除让 EIP 直连
- GitHub repo 已建（`hanbin2007/remindtogether`），无需再建
