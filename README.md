# Reminder App · 交付包

这是 Reminder（群组提醒 app）项目的完整 PRD + 架构 + 实施计划交付包。基于设计稿和多轮 PRD 讨论整理。

## 目录结构

```
reminder-handoff/
├── README.md                  ← 你正在看的这个
├── docs/
│   ├── 01-PRD.md             主应用 PRD（产品需求）
│   ├── 02-ADMIN-PRD.md       管理后台 PRD
│   ├── 03-ARCHITECTURE.md    技术架构（栈、部署、内存预算）
│   ├── 04-DATA-MODEL.md      数据模型 + Prisma schema 草案
│   ├── 05-REALTIME-EVENTS.md Socket.io 实时事件清单
│   ├── 06-IMPLEMENTATION-PLAN.md  实施步骤
│   ├── 07-DEPLOYMENT.md      2核2G 服务器部署指南
│   └── 08-OPEN-QUESTIONS.md  未决事项 / 待确认
└── design/
    ├── README.md             原始设计稿说明
    └── ...                   25 个屏的 React/HTML 设计稿
```

## 阅读顺序建议

1. **先读 `docs/01-PRD.md`** — 产品长什么样
2. **再读 `docs/03-ARCHITECTURE.md`** — 用什么技术做
3. **再读 `docs/04-DATA-MODEL.md`** — 数据怎么存
4. **最后读 `docs/06-IMPLEMENTATION-PLAN.md`** — 怎么一步步做

## 当前状态

- [x] PRD 锁定（主应用 + 管理后台）
- [x] 技术栈选型确定
- [x] 数据模型设计完成
- [x] 25 个屏设计稿就绪
- [ ] 服务器 SSH 接入（22 端口被防火墙挡住，待解决）
- [ ] GitHub 仓库（未提供 token，待补）
- [ ] 代码实施（未开始）

## 服务器信息

- IP: 35.173.251.33
- 配置: 2 vCPU / 2GB RAM
- 80 端口已有服务（待确认是什么）
- 22 端口超时（需要开放给 SDK 出口 IP，或临时 0.0.0.0/0）
</content>
</invoke>