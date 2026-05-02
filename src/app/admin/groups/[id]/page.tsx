import Link from "next/link";
import { getGroupDetail } from "@/services/admin/groups";
import {
  disbandAction,
  removeMemberAction,
  transferOwnerAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await getGroupDetail(id);

  return (
    <div data-testid="admin-group-detail">
      <Link href="/admin/groups" className="rt-squig text-rt-ink-soft text-sm">
        ← 群组列表
      </Link>
      <h1
        data-testid="group-name"
        className="mt-2 font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none"
      >
        {group.coverEmoji ? `${group.coverEmoji} ` : ""}{group.name}
      </h1>
      <p className="mt-1 font-mono text-[11px] text-rt-ink-mute">
        群主：{group.owner.displayName} · {group.owner.email}
        {group.isDisbanded && (
          <span data-testid="group-disbanded" className="ml-2 text-[color:var(--rt-poke)]">
            （已解散）
          </span>
        )}
      </p>

      {!group.isDisbanded && (
        <form action={disbandAction} className="mt-4">
          <input type="hidden" name="groupId" value={group.id} />
          <button
            type="submit"
            data-testid="action-disband"
            className="rt-btn rt-btn-poke"
          >
            强制解散
          </button>
        </form>
      )}

      <h2 className="mt-8 font-[family-name:var(--font-caveat)] font-bold text-2xl">
        成员（{group.members.length}）
      </h2>
      <table className="mt-2 w-full text-sm" data-testid="group-members">
        <tbody>
          {group.members.map((m) => (
            <tr
              key={m.userId}
              className="border-t border-dashed border-rt-ink-faint"
              data-testid={`member-${m.userId}`}
            >
              <td className="py-2">
                <div className="font-[family-name:var(--font-caveat)] font-semibold">
                  {m.user.displayName} {m.role === "OWNER" && (
                    <span className="text-xs text-rt-ink-mute">[OWNER]</span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-rt-ink-mute">
                  {m.user.email}
                </div>
              </td>
              <td className="py-2 text-right">
                {!group.isDisbanded && m.role !== "OWNER" && (
                  <>
                    <form
                      action={transferOwnerAction}
                      className="inline-block mr-2"
                    >
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="newOwnerId" value={m.userId} />
                      <button
                        type="submit"
                        data-testid={`action-transfer-${m.userId}`}
                        className="rt-btn"
                      >
                        转让群主
                      </button>
                    </form>
                    <form
                      action={removeMemberAction}
                      className="inline-block"
                    >
                      <input type="hidden" name="groupId" value={group.id} />
                      <input type="hidden" name="userId" value={m.userId} />
                      <button
                        type="submit"
                        data-testid={`action-remove-${m.userId}`}
                        className="rt-btn"
                      >
                        移除
                      </button>
                    </form>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-8 font-[family-name:var(--font-caveat)] font-bold text-2xl">
        提醒（最新 50）
      </h2>
      {group.reminders.length === 0 ? (
        <p className="font-[family-name:var(--font-kalam)] text-rt-ink-mute">
          还没有提醒
        </p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {group.reminders.map((r) => (
            <li
              key={r.id}
              className="rt-box-tight bg-rt-paper-2 px-3 py-2"
              style={{ borderRadius: "8px 6px 9px 5px / 5px 9px 6px 8px" }}
            >
              <span className="font-[family-name:var(--font-caveat)] font-semibold">
                {r.title}
              </span>
              <span className="ml-2 font-mono text-[10px] text-rt-ink-mute">
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
