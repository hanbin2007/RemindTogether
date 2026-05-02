import Link from "next/link";
import { listUsers, listUsersQuerySchema } from "@/services/admin/users";

export const dynamic = "force-dynamic";

interface SP {
  q?: string;
  isBanned?: string;
  isAdmin?: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const query = listUsersQuerySchema.parse({
    q: sp.q || undefined,
    isBanned: sp.isBanned || undefined,
    isAdmin: sp.isAdmin || undefined,
  });
  const users = await listUsers(query);

  return (
    <div data-testid="admin-users">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        用户
      </h1>
      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="邮箱 / 显示名"
          data-testid="users-q"
          className="rt-input flex-1 min-w-[180px]"
        />
        <select
          name="isBanned"
          defaultValue={sp.isBanned ?? ""}
          data-testid="users-isBanned"
          className="rt-input w-32"
        >
          <option value="">全部状态</option>
          <option value="true">已封禁</option>
          <option value="false">活跃</option>
        </select>
        <select
          name="isAdmin"
          defaultValue={sp.isAdmin ?? ""}
          data-testid="users-isAdmin"
          className="rt-input w-32"
        >
          <option value="">全部角色</option>
          <option value="true">管理员</option>
          <option value="false">普通</option>
        </select>
        <button type="submit" className="rt-btn rt-btn-primary">
          搜索
        </button>
      </form>

      <table className="mt-6 w-full text-sm" data-testid="users-table">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
            <th className="py-2">用户</th>
            <th className="py-2">注册时间</th>
            <th className="py-2">状态</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="py-6 text-center font-[family-name:var(--font-kalam)] text-rt-ink-mute"
                data-testid="users-empty"
              >
                没有匹配的用户
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-dashed border-rt-ink-faint"
                data-testid={`users-row-${u.id}`}
              >
                <td className="py-2 align-top">
                  <div className="font-[family-name:var(--font-caveat)] font-semibold text-rt-ink text-lg">
                    {u.displayName}
                  </div>
                  <div className="font-mono text-[11px] text-rt-ink-mute">
                    {u.email}
                  </div>
                </td>
                <td className="py-2 align-top font-mono text-[11px] text-rt-ink-soft">
                  {u.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="py-2 align-top">
                  <div className="flex flex-wrap gap-1">
                    {u.isAdmin && (
                      <span
                        className="rt-box-tight bg-[color:var(--rt-claim-soft,#dde6f4)] px-2 py-0.5 text-[11px]"
                        style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
                      >
                        admin
                      </span>
                    )}
                    {u.isBanned && (
                      <span
                        data-testid={`users-row-${u.id}-banned`}
                        className="rt-box-tight bg-[color:var(--rt-poke-soft,#f7e3df)] px-2 py-0.5 text-[11px] text-[color:var(--rt-poke)]"
                        style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
                      >
                        banned
                      </span>
                    )}
                    {u.emailVerifiedAt && (
                      <span
                        className="rt-box-tight bg-[color:var(--rt-done-soft,#e6f3e6)] px-2 py-0.5 text-[11px]"
                        style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
                      >
                        ✓ email
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 align-top text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    data-testid={`users-row-${u.id}-detail`}
                    className="rt-squig text-rt-ink"
                  >
                    详情
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
