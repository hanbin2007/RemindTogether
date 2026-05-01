# 数据模型

## ER 概览

```
                        ┌─────────┐
                        │  Users  │
                        └────┬────┘
                ┌────────────┼────────────┐
                │            │            │
        ┌───────▼─────┐  ┌───▼────┐  ┌───▼──────┐
        │ GroupMembers│  │Reminder│  │  Pokes   │
        └───────┬─────┘  └───┬────┘  └──────────┘
                │            │
            ┌───▼────┐   ┌───┴────────┐
            │ Groups │   │  Claims    │
            └────────┘   │ Completions│
                         │  Comments  │
                         │ Reactions  │
                         └────────────┘
```

---

## Prisma Schema 草案

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ────────────────────────────────────────────
// Users & Auth
// ────────────────────────────────────────────

model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String
  displayName     String
  avatarUrl       String?
  timezone        String    @default("UTC")
  isAdmin         Boolean   @default(false)
  isBanned        Boolean   @default(false)
  bannedReason    String?
  emailVerifiedAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  ownedGroups       Group[]            @relation("GroupOwner")
  memberships       GroupMember[]
  remindersCreated  Reminder[]         @relation("ReminderCreator")
  claims            Claim[]
  completions       Completion[]
  comments          Comment[]
  reactions         Reaction[]
  pokesSent         Poke[]             @relation("PokeFrom")
  pokesReceived     Poke[]             @relation("PokeTo")
  streakDays        StreakDay[]
  shieldCard        ShieldCard?
  pokeSetting       PokeSetting?
  tags              Tag[]
  pushSubscriptions PushSubscription[]
  notifications     Notification[]
  reportsFiled      Report[]           @relation("Reporter")
  reportsResolved   Report[]           @relation("Resolver")
  adminLogs         AdminLog[]

  @@index([email])
  @@index([isAdmin])
}

// ────────────────────────────────────────────
// Groups & Membership
// ────────────────────────────────────────────

model Group {
  id          String        @id @default(uuid())
  name        String
  coverEmoji  String?
  ownerId     String
  isDisbanded Boolean       @default(false)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  owner       User          @relation("GroupOwner", fields: [ownerId], references: [id])
  members     GroupMember[]
  reminders   Reminder[]
  invites     InviteToken[]

  @@index([ownerId])
}

model GroupMember {
  groupId   String
  userId    String
  role      GroupRole @default(MEMBER)
  joinedAt  DateTime  @default(now())
  leftAt    DateTime?

  group     Group     @relation(fields: [groupId], references: [id])
  user      User      @relation(fields: [userId], references: [id])

  @@id([groupId, userId])
  @@index([userId])
}

enum GroupRole {
  OWNER
  MEMBER
}

// ────────────────────────────────────────────
// Reminders & Related
// ────────────────────────────────────────────

model Reminder {
  id           String           @id @default(uuid())
  title        String
  description  String?
  creatorId    String
  groupId      String?          // null = 私人
  visibility   ReminderVisibility
  dueAt        DateTime?
  repeatRule   String?          // RRULE 字符串
  status       ReminderStatus   @default(ACTIVE)
  isPinned     Boolean          @default(false)
  isDeleted    Boolean          @default(false)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  creator      User             @relation("ReminderCreator", fields: [creatorId], references: [id])
  group        Group?           @relation(fields: [groupId], references: [id])
  claims       Claim[]
  completions  Completion[]
  comments     Comment[]
  reactions    Reaction[]
  pokes        Poke[]
  tags         ReminderTag[]

  @@index([creatorId])
  @@index([groupId])
  @@index([dueAt])
  @@index([status])
}

enum ReminderVisibility {
  PRIVATE
  GROUP
}

enum ReminderStatus {
  ACTIVE
  DONE
  SKIPPED
}

// 多人可认领同一条提醒
model Claim {
  id         String   @id @default(uuid())
  reminderId String
  userId     String
  claimedAt  DateTime @default(now())

  reminder   Reminder @relation(fields: [reminderId], references: [id])
  user       User     @relation(fields: [userId], references: [id])

  @@unique([reminderId, userId])
  @@index([userId])
}

// 完成记录（一条提醒可被同一人多次完成，如重复提醒）
model Completion {
  id          String   @id @default(uuid())
  reminderId  String
  userId      String
  completedAt DateTime @default(now())
  mediaUrl    String?
  note        String?

  reminder    Reminder @relation(fields: [reminderId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@index([reminderId])
  @@index([userId, completedAt])
}

model Comment {
  id         String   @id @default(uuid())
  reminderId String
  userId     String
  content    String
  isDeleted  Boolean  @default(false)
  createdAt  DateTime @default(now())

  reminder   Reminder @relation(fields: [reminderId], references: [id])
  user       User     @relation(fields: [userId], references: [id])

  @@index([reminderId])
}

model Reaction {
  id         String   @id @default(uuid())
  reminderId String
  userId     String
  emoji      String
  createdAt  DateTime @default(now())

  reminder   Reminder @relation(fields: [reminderId], references: [id])
  user       User     @relation(fields: [userId], references: [id])

  @@unique([reminderId, userId, emoji])
}

// ────────────────────────────────────────────
// Pokes (拍拍 — 独立消息系统)
// ────────────────────────────────────────────

model Poke {
  id         String   @id @default(uuid())
  fromId     String
  toId       String
  reminderId String?  // 可选；用户开关允许时可为 null
  tone       PokeTone
  message    String?
  sentAt     DateTime @default(now())
  readAt     DateTime?

  from       User     @relation("PokeFrom", fields: [fromId], references: [id])
  to         User     @relation("PokeTo",   fields: [toId],   references: [id])
  reminder   Reminder? @relation(fields: [reminderId], references: [id])

  @@index([toId, sentAt])
  @@index([fromId, toId, sentAt])  // 限额查询用
}

enum PokeTone {
  ALMOST    // 差一点点
  THINKING  // 想到你了
  NO_RUSH   // 不急慢慢来
}

// 用户对拍拍的偏好设置
model PokeSetting {
  userId            String  @id
  allowUnlinkedPoke Boolean @default(false)
  doNotDisturb      Boolean @default(false)
  user              User    @relation(fields: [userId], references: [id])
}

// ────────────────────────────────────────────
// Streaks & Shield Cards
// ────────────────────────────────────────────

model StreakDay {
  id        String          @id @default(uuid())
  userId    String
  date      DateTime        @db.Date
  status    StreakDayStatus

  user      User            @relation(fields: [userId], references: [id])

  @@unique([userId, date])
  @@index([userId, date])
}

enum StreakDayStatus {
  DONE
  SKIPPED
  PROTECTED
  MISSED
}

model ShieldCard {
  userId        String   @id
  count         Int      @default(0)
  lastEarnedAt  DateTime?

  user          User     @relation(fields: [userId], references: [id])
}

// ────────────────────────────────────────────
// Tags
// ────────────────────────────────────────────

model Tag {
  id       String        @id @default(uuid())
  userId   String
  name     String
  iconName String        // 对应 hf-icons 里的 svg name
  color    String

  user     User          @relation(fields: [userId], references: [id])
  reminders ReminderTag[]

  @@unique([userId, name])
}

model ReminderTag {
  reminderId String
  tagId      String

  reminder   Reminder @relation(fields: [reminderId], references: [id])
  tag        Tag      @relation(fields: [tagId], references: [id])

  @@id([reminderId, tagId])
}

// ────────────────────────────────────────────
// Invites
// ────────────────────────────────────────────

model InviteToken {
  id            String    @id @default(uuid())
  groupId       String
  token         String    @unique
  createdById   String
  expiresAt     DateTime
  usedByUserId  String?
  usedAt        DateTime?
  createdAt     DateTime  @default(now())

  group         Group     @relation(fields: [groupId], references: [id])

  @@index([token])
}

// ────────────────────────────────────────────
// Push Notifications
// ────────────────────────────────────────────

model PushSubscription {
  id        String   @id @default(uuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  payload   Json
  readAt    DateTime?
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id])

  @@index([userId, readAt, createdAt])
}

enum NotificationType {
  POKE_RECEIVED
  REMINDER_DUE
  REMINDER_COMPLETED_BY_OTHER
  REMINDER_CLAIMED_BY_OTHER
  GROUP_INVITED
  STREAK_MILESTONE
  COMMENT_NEW
  REACTION_NEW
}

// ────────────────────────────────────────────
// Moderation (举报系统)
// ────────────────────────────────────────────

model Report {
  id           String       @id @default(uuid())
  reporterId   String
  contentType  ContentType
  contentId    String
  reason       String
  status       ReportStatus @default(PENDING)
  createdAt    DateTime     @default(now())
  resolvedById String?
  resolvedAt   DateTime?
  adminNote    String?

  reporter     User         @relation("Reporter", fields: [reporterId], references: [id])
  resolver     User?        @relation("Resolver", fields: [resolvedById], references: [id])

  @@index([status, createdAt])
  @@index([contentType, contentId])
}

enum ContentType {
  REMINDER
  COMMENT
}

enum ReportStatus {
  PENDING
  RESOLVED
  DISMISSED
}

// ────────────────────────────────────────────
// Admin Config & Audit
// ────────────────────────────────────────────

model Config {
  key         String   @id
  value       Json
  description String?
  updatedAt   DateTime @updatedAt
  updatedBy   String?
}

model AdminLog {
  id         String   @id @default(uuid())
  adminId    String
  action     String   // e.g. "ban_user", "update_config"
  targetType String   // e.g. "user", "group", "reminder"
  targetId   String?
  payload    Json?
  createdAt  DateTime @default(now())

  admin      User     @relation(fields: [adminId], references: [id])

  @@index([adminId, createdAt])
  @@index([action])
}
```

---

## 关键查询模式

### 1. 拍拍限额检查（事务）

```sql
BEGIN;
SELECT COUNT(*) FROM "Poke"
  WHERE from_id = $1 AND to_id = $2
    AND sent_at >= date_trunc('day', NOW() AT TIME ZONE $tz);
-- 若 < 3，则 INSERT
COMMIT;
```

### 2. 群组提醒列表（含权限）

```ts
// 必须先校验用户是该群成员
prisma.reminder.findMany({
  where: {
    groupId,
    isDeleted: false,
    visibility: 'GROUP',
  },
  include: {
    creator: { select: { id, displayName, avatarUrl } },
    claims: true,
    completions: { take: 1, orderBy: { completedAt: 'desc' } },
  }
})
```

### 3. 加油榜（本周完成数排序）

```sql
SELECT u.id, u.display_name, COUNT(c.id) AS done_count
FROM "User" u
JOIN "GroupMember" gm ON gm.user_id = u.id
LEFT JOIN "Completion" c ON c.user_id = u.id
  AND c.completed_at >= date_trunc('week', NOW())
  AND EXISTS (
    SELECT 1 FROM "Reminder" r
    WHERE r.id = c.reminder_id AND r.group_id = $1
  )
WHERE gm.group_id = $1 AND gm.left_at IS NULL
GROUP BY u.id
ORDER BY done_count DESC;
```

### 4. 连胜计算（用 PG 窗口函数）

每日定时任务（cron）凌晨在用户时区 00:30 跑：
- 检查昨天有无 `Completion`
- 有 → INSERT StreakDay (DONE)
- 无 → 看 ShieldCard 余量，>0 → 消耗一张 → INSERT (PROTECTED)；否则 INSERT (MISSED)
</content>
</invoke>