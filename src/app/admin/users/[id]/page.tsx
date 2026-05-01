import Link from "next/link";
import { getUserDetail } from "@/services/admin/users";
import {
  banAction,
  demoteAction,
  forceVerifyAction,
  issueResetAction,
  promoteAction,
  resendVerifyAction,
  unbanAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserDetail(id);

  return (
    <div data-testid="admin-user-detail">
      <Link href="/admin/users" className="rt-squig text-rt-ink-soft text-sm">
        ← 用户列表
      </Link>
      <h1
        data-testid="user-displayName"
        className="mt-2 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none"
      >
        {user.displayName}
      </h1>
      <p
        data-testid="user-email"
        className="mt-1 font-mono text-[12px] uppercase tracking-wide text-rt-ink-mute"
      >
        {user.email}
      </p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["拥有的群", user._count.ownedGroups],
          ["参与的群", user._count.memberships],
          ["创建的提醒", user._count.remindersCreated],
          ["完成数", user._count.completions],
          ["发出的拍拍", user._count.pokesSent],
          ["收到的拍拍", user._count.pokesReceived],
          ["push 订阅", user._count.pushSubscriptions],
          ["保护卡", user.shieldCard?.count ?? 0],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rt-box-tight bg-rt-paper-2 p-3"
            style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
              {label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-2xl">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rt-box p-5 space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rt-ink-mute">
            状态
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-sm">
            <span data-testid="status-admin">
              {user.isAdmin ? "✓ admin" : "普通用户"}
            </span>
            <span data-testid="status-banned">
              {user.isBanned
                ? `✗ 已封禁（${user.bannedReason ?? "未注明"}）`
                : "活跃"}
            </span>
            <span data-testid="status-email">
              {user.emailVerifiedAt
                ? `✓ email 已验证`
                : "email 未验证"}
            </span>
          </div>
        </div>

        <hr className="border-dashed border-rt-ink-faint" />

        <div className="flex flex-wrap gap-2">
          {user.isBanned ? (
            <form action={unbanAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                data-testid="action-unban"
                className="rt-btn"
              >
                解除封禁
              </button>
            </form>
          ) : (
            <form action={banAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="text"
                name="reason"
                placeholder="原因（可选）"
                data-testid="action-ban-reason"
                className="rt-input w-44"
              />
              <button
                type="submit"
                data-testid="action-ban"
                className="rt-btn rt-btn-poke ml-2"
              >
                封禁
              </button>
            </form>
          )}

          {user.isAdmin ? (
            <form action={demoteAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                data-testid="action-demote"
                className="rt-btn"
              >
                取消管理员
              </button>
            </form>
          ) : (
            <form action={promoteAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button
                type="submit"
                data-testid="action-promote"
                className="rt-btn"
              >
                提升管理员
              </button>
            </form>
          )}

          {!user.emailVerifiedAt && (
            <>
              <form action={forceVerifyAction}>
                <input type="hidden" name="userId" value={user.id} />
                <button
                  type="submit"
                  data-testid="action-force-verify"
                  className="rt-btn"
                >
                  强制标记已验证
                </button>
              </form>
              <form action={resendVerifyAction}>
                <input type="hidden" name="userId" value={user.id} />
                <button
                  type="submit"
                  data-testid="action-resend-verify"
                  className="rt-btn"
                >
                  重发验证邮件
                </button>
              </form>
            </>
          )}

          <form action={issueResetAction}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              data-testid="action-issue-reset"
              className="rt-btn"
            >
              发起密码重设
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
