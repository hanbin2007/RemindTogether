# 管理后台 PRD

## 概览

**入口**：嵌入主应用，路由 `/admin/*`
**鉴权**：Users 表加 `is_admin` 字段，中间件检查；非管理员 302 到首页
**用户**：仅创始人/我自己，无需多角色权限

---

## 五大模块

### 1. 数据看板 Dashboard

| 指标 | 展示形式 |
|---|---|
| 用户增长 | 今日 / 7 日 / 30 日新注册数 + 折线图 |
| 活跃度 | DAU / MAU + 7 日留存曲线 |
| 提醒健康 | 总创建数、完成率、跳过率 |
| 拍拍活跃 | 今日拍拍总次数、最活跃发送者 Top 10 |
| 连胜分布 | 1-7 / 8-29 / 30+ 天各有多少用户 |
| 群组概况 | 总群数、平均成员数、最活跃群 Top 10 |

**实现要点**：
- 数据源直接查 PostgreSQL（轻量项目不上数据仓库）
- 缓存：每个指标 5 分钟（Next.js cache 或简单内存）
- 不用第三方分析工具，全自建

---

### 2. 用户管理 / 客服工具

**搜索**：按 email / display_name / user_id

**用户详情页展示**：
- 注册时间、最后登录、时区
- 所在群列表
- 提醒数（创建 / 完成 / 跳过）
- 连胜天数 + 保护卡余量
- 拍拍收发记录（最近 30 条）
- 是否被封禁

**操作**：
- 发送密码重置邮件
- 补发保护卡（+N 张）
- 手动调整连胜天数（修错误数据用）
- 封禁账号（软删除，禁登录）
- 解封账号
- 删除账号（硬删除，谨慎，需二次确认）

**审计**：所有 admin 操作写日志（AdminLog 表）

---

### 3. 内容审核

**用户侧（新增功能）**：
- 提醒和评论的 "···" 菜单加"举报"选项
- 举报理由：不实信息 / 骚扰 / 垃圾内容 / 其他
- 举报后内容继续显示（不立即隐藏）
- 用户看到提示："已收到，我们会处理"

**Reports 表结构**：
```
id              uuid pk
reporter_id     fk → users
content_type    enum (reminder | comment)
content_id      uuid
reason          text
status          enum (pending | resolved | dismissed)
created_at      timestamptz
resolved_by     fk → users (admin)
resolved_at     timestamptz
admin_note      text
```

**后台审核队列**：
- 按时间倒序排列
- 可按 status / content_type 筛选
- 每条显示：举报内容 + 上下文（原帖、评论）+ 举报人

**Admin 操作**（每条举报）：
- 删除内容 + 警告作者
- 删除内容 + 封禁作者
- 驳回举报（内容无问题）

---

### 4. 系统配置（Feature Flags / 限额）

**Config 表**：
```
key             text unique
value           jsonb
description     text
updated_at      timestamptz
updated_by      fk → users
```

**默认配置项**：

| key | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `poke_daily_limit_per_target` | int | 3 | 对同一人每日拍拍上限 |
| `streak_shield_earn_threshold` | int | 7 | N 天连胜奖励 1 张保护卡 |
| `streak_shield_max` | int | 5 | 保护卡最大持有数 |
| `group_max_members` | int | 50 | 单群最大成员数 |
| `invite_token_expire_hours` | int | 72 | 邀请链接有效期 |
| `feature_unlinked_poke` | bool | false | 允许不关联提醒的拍拍 |
| `feature_web_push` | bool | true | PWA Push 总开关 |

**实现要点**：
- 服务端有缓存（5 分钟），改完即生效不重启
- 配置改动写 AdminLog

---

### 5. 群组管理

**列表**：所有群，按成员数 / 创建时间 / 活跃度排序

**详情**：
- 群信息、群主、成员数、创建时间
- 成员列表（含角色）
- 提醒清单（最近 30 条）
- 群活跃度统计

**操作**：
- 解散群（触发 Socket.io 通知所有成员，所有数据软删除）
- 移除指定成员
- 转让群主（紧急情况用）

---

## AdminLog 表

记录所有 admin 操作，便于追溯：

```
id              uuid pk
admin_id        fk → users
action          text  例如 "ban_user", "update_config", "remove_content"
target_type     text  例如 "user", "group", "reminder"
target_id       uuid
payload         jsonb 操作前后的关键数据
created_at      timestamptz
```
</content>
</invoke>