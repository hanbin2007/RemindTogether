# Socket.io 实时事件清单

## Room 设计

每个用户连接后默认加入两类 room：

| Room 名 | 加入条件 | 用途 |
|---|---|---|
| `user:{userId}` | 自动（基于 session） | 私人通知（拍拍、邀请） |
| `group:{groupId}` | 用户是该群成员 | 群组事件广播 |

**连接握手**：
```js
io.use(async (socket, next) => {
  const session = await getSessionFromCookie(socket.request)
  if (!session) return next(new Error('unauthorized'))
  socket.userId = session.userId
  socket.join(`user:${session.userId}`)
  // 加入所有该用户所在群的 room
  const groups = await getUserGroups(session.userId)
  groups.forEach(g => socket.join(`group:${g.id}`))
  next()
})
```

---

## 事件清单

### 服务端 → 客户端

| 事件 | 触发场景 | 推送 room | Payload |
|---|---|---|---|
| `reminder:created` | 群组新提醒 | `group:{id}` | `{ reminder, by }` |
| `reminder:updated` | 群组提醒被编辑 | `group:{id}` | `{ reminderId, changes }` |
| `reminder:deleted` | 群组提醒被删 | `group:{id}` | `{ reminderId }` |
| `reminder:completed` | 有人完成 | `group:{id}` | `{ reminderId, by, completion }` |
| `reminder:claimed` | 有人认领 | `group:{id}` | `{ reminderId, by }` |
| `reminder:unclaimed` | 取消认领 | `group:{id}` | `{ reminderId, by }` |
| `comment:new` | 新评论 | `group:{id}` | `{ reminderId, comment }` |
| `reaction:new` | 新 emoji 反应 | `group:{id}` | `{ reminderId, reaction }` |
| `poke:received` | 收到拍拍 | `user:{toId}` | `{ poke, from }` |
| `notification:new` | 任何新通知 | `user:{userId}` | `{ notification }` |
| `streak:milestone` | 连胜 7/30 天 | `user:{userId}` | `{ days, type }` |
| `group:member_joined` | 新成员加入 | `group:{id}` | `{ user }` |
| `group:member_left` | 成员退出 | `group:{id}` | `{ userId }` |
| `group:disbanded` | 群被解散 | `group:{id}` | `{ reason }` |

### 客户端 → 服务端

客户端主要通过 REST API 触发事件，**不主动 emit Socket.io 事件**。这样所有写操作都走 API 鉴权层。

唯一例外：
- `presence:ping` — 心跳，告知"我在线"（用于显示在线状态，可选 v2）

---

## 跨进程广播（PG LISTEN/NOTIFY）

PM2 cluster ×2 时，Socket.io 默认只在本进程内广播。需要跨进程 pub/sub。

### 实现方式

```ts
// lib/socket-pubsub.ts
import { Pool } from 'pg'
import { Server } from 'socket.io'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function setupCrossProcessPubsub(io: Server) {
  const client = await pool.connect()
  await client.query('LISTEN socket_broadcast')

  client.on('notification', (msg) => {
    if (msg.channel !== 'socket_broadcast') return
    const { room, event, payload } = JSON.parse(msg.payload!)
    io.to(room).emit(event, payload)
  })
}

// 发送方（任意进程都能调）
export async function broadcast(room: string, event: string, payload: any) {
  await pool.query(`SELECT pg_notify('socket_broadcast', $1)`, [
    JSON.stringify({ room, event, payload })
  ])
}
```

### 流程

```
进程 A 处理 POST /api/reminders/:id/complete
  ↓
broadcast('group:abc', 'reminder:completed', {...})
  ↓
PG NOTIFY socket_broadcast {...}
  ↓
进程 B (LISTEN socket_broadcast) 收到
  ↓
io.to('group:abc').emit('reminder:completed', {...})
  ↓
进程 B 内连接到 group:abc 的客户端收到
```

**优点**：零额外依赖（已经有 PG）、适合中小规模
**缺点**：消息大小限制 8KB（payload 太大需走 DB 二次拉取）

---

## 客户端订阅模式

```tsx
// hooks/useRealtime.ts
'use client'
import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = io({ path: '/socket.io', withCredentials: true })
  }
  return socket
}

export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  useEffect(() => {
    const s = getSocket()
    s.on(event, handler)
    return () => { s.off(event, handler) }
  }, [event, handler])
}
```

```tsx
// 在群详情页订阅
useSocketEvent('reminder:completed', (data) => {
  // 刷新列表 / 显示动画
  queryClient.invalidateQueries(['group', groupId, 'reminders'])
})
```

---

## 重连和补偿

- Socket.io 自动重连（默认指数退避）
- 重连后客户端调一次 `GET /api/sync?since={lastEventTimestamp}` 拉补偿数据
- 服务端基于 `updated_at` 字段返回断线期间变更
- 这部分 v1 可以简化：重连后直接全量刷新当前页面数据

---

## Web Push（推送通知）

Web Push 和 Socket.io 是**互补关系**：
- Socket.io：app 在前台/打开时实时
- Web Push：app 关闭时也能收到通知

触发逻辑（伪代码）：
```ts
async function notifyPokeReceived(toUserId: string, poke: Poke) {
  // 1. 实时推送（如果在线）
  await broadcast(`user:${toUserId}`, 'poke:received', { poke })

  // 2. 写入 Notification 表
  await prisma.notification.create({...})

  // 3. Web Push（如果用户授权了）
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: toUserId }
  })
  for (const sub of subs) {
    await webpush.sendNotification(sub, JSON.stringify({
      title: `${poke.from.displayName} 想到你了`,
      body: poke.message ?? '差一点点～',
      data: { type: 'poke', pokeId: poke.id }
    })).catch(handlePushError)  // 410 Gone → 删除订阅
  }
}
```
</content>
</invoke>