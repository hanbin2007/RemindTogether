import Link from "next/link";
import { listGroups, listGroupsQuerySchema } from "@/services/admin/groups";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; isDisbanded?: string }>;
}) {
  const sp = await searchParams;
  const query = listGroupsQuerySchema.parse({
    q: sp.q || undefined,
    isDisbanded: sp.isDisbanded || undefined,
  });
  const groups = await listGroups(query);

  return (
    <div data-testid="admin-groups">
      <h1 className="font-[family-name:var(--font-caveat)] font-bold text-rt-ink text-[40px] leading-none">
        群组
      </h1>
      <form className="mt-4 flex flex-wrap gap-2" method="get">
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="群名"
          data-testid="groups-q"
          className="rt-input flex-1 min-w-[180px]"
        />
        <select
          name="isDisbanded"
          defaultValue={sp.isDisbanded ?? ""}
          className="rt-input w-32"
        >
          <option value="">全部</option>
          <option value="false">活跃</option>
          <option value="true">已解散</option>
        </select>
        <button type="submit" className="rt-btn rt-btn-primary">
          搜索
        </button>
      </form>
      <table className="mt-6 w-full text-sm" data-testid="groups-table">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-rt-ink-mute">
            <th className="py-2">群名</th>
            <th className="py-2">群主</th>
            <th className="py-2">成员</th>
            <th className="py-2">提醒</th>
            <th className="py-2">状态</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-6 text-center font-[family-name:var(--font-kalam)] text-rt-ink-mute"
              >
                没有匹配的群
              </td>
            </tr>
          ) : (
            groups.map((g) => (
              <tr
                key={g.id}
                className="border-t border-dashed border-rt-ink-faint"
                data-testid={`groups-row-${g.id}`}
              >
                <td className="py-2 font-[family-name:var(--font-caveat)] font-semibold text-lg">
                  {g.coverEmoji ?? ""} {g.name}
                </td>
                <td className="py-2 font-mono text-[11px]">
                  {g.owner.displayName}
                  <br />
                  <span className="text-rt-ink-mute">{g.owner.email}</span>
                </td>
                <td className="py-2">{g._count.members}</td>
                <td className="py-2">{g._count.reminders}</td>
                <td className="py-2">
                  {g.isDisbanded ? (
                    <span className="text-[color:var(--rt-poke)]">已解散</span>
                  ) : (
                    "活跃"
                  )}
                </td>
                <td className="py-2 text-right">
                  <Link
                    href={`/admin/groups/${g.id}`}
                    data-testid={`groups-row-${g.id}-detail`}
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
