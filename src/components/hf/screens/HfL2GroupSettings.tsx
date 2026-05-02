/**
 * 1:1 port of `window.HfL2GroupSettings` (design/project/hf-screens-L2.jsx
 * lines 484-578). Pure presentational; takes typed props for everything
 * the design hardcodes:
 *
 *   - <Phone> wrapper                    → responsive max-width column
 *   - <window.HF.Icon ...>               → <HF.Icon ... />
 *   - <window.HF.Av ...>                 → <HF.Av ... />
 *   - hardcoded sample group / members   → typed props from the server
 *   - hardcoded "改名" button             → optional `renameSlot` (only
 *     rendered for owners — the actual RenameButton is a client
 *     component with its own action wiring)
 *   - hardcoded 4 rule toggles            → `rulesSlot` (GroupRulesToggles
 *     is a client component, so the page passes it in)
 *   - hardcoded "退出小群" CTA             → owner gets a 解散 form, others
 *     get the 退出 form, both wired via the form-action props
 *
 * className + inline styles + structure preserved byte-for-byte.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { HF } from "@/components/sketch/hf";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "群主",
  MEMBER: "成员",
};

export interface HfL2GroupSettingsMember {
  userId: string;
  displayName: string;
  role: string;
  /** Avatar palette slot (0..6). */
  slot: number;
}

export interface HfL2GroupSettingsProps {
  groupId: string;
  name: string;
  coverEmoji: string | null;
  memberCount: number;
  daysSinceCreated: number;
  members: HfL2GroupSettingsMember[];
  isOwner: boolean;
  backHref: string;
  inviteHref: string;
  /** Rules-toggle UI (page passes `<GroupRulesToggles>`). */
  rulesSlot: ReactNode;
  /** Rename trigger UI (page passes `<RenameButton>` for owners). */
  renameSlot?: ReactNode;
  /** href for the disband form (owner only). */
  disbandAction: string;
  /** href for the leave form (non-owner). */
  leaveAction: string;
}

export function HfL2GroupSettings({
  groupId: _groupId,
  name,
  coverEmoji,
  memberCount,
  daysSinceCreated,
  members,
  isOwner,
  backHref,
  inviteHref,
  rulesSlot,
  renameSlot,
  disbandAction,
  leaveAction,
}: HfL2GroupSettingsProps) {
  return (
    <div
      className="hf min-h-screen"
      style={{
        background: "var(--paper)",
        width: "100%",
        maxWidth: "var(--app-max-w)",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          height: "100%",
          overflow: "hidden",
          background: "var(--paper)",
        }}
      >
        {/* nav bar */}
        <div
          style={{
            padding: "12px 14px 8px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: "1.5px solid var(--line)",
          }}
        >
          <Link
            href={backHref}
            style={{ fontFamily: "var(--hand-2)", fontSize: 18 }}
            data-testid="settings-back"
          >
            ‹
          </Link>
          <div style={{ flex: 1 }}>
            <div className="h-meta">小群</div>
            <div className="h-row" style={{ fontSize: 16 }}>
              {name}
            </div>
          </div>
          <HF.Icon name="dots" size={18} />
        </div>

        <div style={{ padding: "12px 14px", overflow: "hidden" }}>
          {/* cover */}
          <div
            className="hf-box thick"
            style={{
              padding: "14px 12px",
              background: "var(--ok-soft)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transform: "rotate(-0.5deg)",
            }}
            data-testid="settings-cover"
          >
            <div style={{ fontSize: 32, transform: "rotate(-6deg)" }}>
              {coverEmoji ?? "📌"}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h-row" style={{ fontSize: 15 }}>
                {name}
              </div>
              <div className="h-meta">
                {memberCount} 人 · 共建 {daysSinceCreated} 天
              </div>
            </div>
            {renameSlot}
          </div>

          {/* members */}
          <div
            className="h-meta"
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>成员 · {members.length}</span>
            <Link
              href={inviteHref}
              style={{ color: "var(--claim)" }}
              data-testid="settings-invite-link"
            >
              + 邀请
            </Link>
          </div>
          <div
            className="hf-box"
            style={{ marginTop: 4, padding: "4px 10px" }}
            data-testid="settings-members"
          >
            {members.map((m, i, a) => (
              <div
                key={m.userId}
                className="hf-row"
                style={{
                  padding: "6px 0",
                  borderBottom:
                    i === a.length - 1
                      ? "none"
                      : "1.3px dashed var(--ink-faint)",
                }}
                data-testid={`settings-member-${m.userId}`}
              >
                <HF.Av name={m.displayName} size={28} i={m.slot} />
                <div style={{ flex: 1 }}>
                  <div className="h-row" style={{ fontSize: 14 }}>
                    {m.displayName}
                  </div>
                </div>
                <span className="hf-chip dim" style={{ fontSize: 11 }}>
                  {ROLE_LABEL[m.role] ?? "成员"}
                </span>
              </div>
            ))}
          </div>

          {/* rules */}
          <div className="h-meta" style={{ marginTop: 12 }}>
            群规则
          </div>
          {rulesSlot}

          {/* danger zone — owner sees 解散; non-owner sees 退出 */}
          {isOwner ? (
            <form
              action={disbandAction}
              method="get"
              className="hf-box dashed"
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderColor: "var(--poke)",
              }}
            >
              <button
                type="submit"
                data-testid="settings-disband"
                className="block w-full text-left"
              >
                <div
                  className="h-row"
                  style={{ fontSize: 14, color: "var(--poke)" }}
                >
                  解散小群
                </div>
                <div className="h-meta">所有数据会保留作回顾</div>
              </button>
            </form>
          ) : (
            <form
              action={leaveAction}
              method="post"
              className="hf-box dashed"
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderColor: "var(--poke)",
              }}
            >
              <button
                type="submit"
                data-testid="settings-leave"
                className="block w-full text-left"
              >
                <div
                  className="h-row"
                  style={{ fontSize: 14, color: "var(--poke)" }}
                >
                  退出小群
                </div>
                <div className="h-meta">你的打卡记录会保留</div>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
