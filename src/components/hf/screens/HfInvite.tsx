/**
 * 1:1 port of `window.HfInvite` from
 * design/project/hf-screens-B.jsx (lines 102-194). The JSX below is a
 * literal copy with the standard mechanical replacements:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - hardcoded sample data            → typed props (real data)
 *
 * The "通讯录里也用 Reminder 的" list in the design is rendered as a
 * placeholder card (暂不可用) — our app doesn't have contacts yet.
 *
 * The QR + link card's interactive bits (issue + copy/share) live in
 * `<InviteIssueCard>` (client) so we can keep useActionState wiring
 * for the existing `issueInviteAction`. Layout (hf-box shell, QR
 * placeholder) stays in this server component.
 *
 * Pages: src/app/app/groups/[id]/invite/page.tsx fetches data and
 * renders this.
 */
import Link from "next/link";
import { Phone, HF } from "@/components/hf";
import { InviteIssueCard } from "./HfInvite.client";

export interface HfInviteProps {
  groupId: string;
  groupName: string;
  memberCount: number;
  /** Pre-fetched invite URL (or null if not yet generated). */
  inviteUrl: string | null;
  /** Whether the optional "附近的人" feature is enabled. */
  nearbyEnabled?: boolean;
}

const APPS: { l: string; ic: "chat" | "phone" | "wifi" | "mail" }[] = [
  { l: "微信", ic: "chat" },
  { l: "通讯录", ic: "phone" },
  { l: "AirDrop", ic: "wifi" },
  { l: "邮件", ic: "mail" },
];

export function HfInvite({
  groupId,
  groupName,
  memberCount,
  inviteUrl,
  nearbyEnabled = true,
}: HfInviteProps) {
  return (
    <Phone>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--paper)",
        }}
      >
        <div
          style={{
            padding: "14px 14px 4px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Link
            href={`/app/groups/${groupId}`}
            className="hf-btn ghost"
            style={{ padding: "4px 8px", fontSize: 14 }}
          >
            ‹
          </Link>
          <div className="h-meta" style={{ marginLeft: "auto" }}>
            {groupName} · {memberCount} 人
          </div>
        </div>

        <div style={{ padding: "4px 18px 0" }}>
          <div className="h-display">叫上他们</div>
          <div className="h-body">加进来，今天起的提醒他们都看得见</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 30px" }}>
          {/* QR + link */}
          <div
            className="hf-box"
            style={{ padding: 12, display: "flex", gap: 12 }}
            data-testid="invite-issue"
          >
            <div
              className="hf-box tight"
              style={{
                width: 90,
                height: 90,
                padding: 6,
                background: "var(--paper)",
                flexShrink: 0,
              }}
              aria-label="二维码占位"
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundImage:
                    "radial-gradient(circle, var(--ink) 1.4px, transparent 1.4px)",
                  backgroundSize: "6px 6px",
                }}
              />
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              <InviteIssueCard
                groupId={groupId}
                groupName={groupName}
                initialUrl={inviteUrl}
              />
            </div>
          </div>

          {/* via apps */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 14,
              justifyContent: "space-between",
            }}
          >
            {APPS.map((a, i) => (
              <div key={a.l} style={{ textAlign: "center", flex: 1 }}>
                <div
                  className="hf-box"
                  style={{
                    width: 50,
                    height: 50,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: i % 2 ? "rotate(-2deg)" : "rotate(2deg)",
                  }}
                >
                  <HF.Icon name={a.ic} size={22} />
                </div>
                <div className="h-meta" style={{ marginTop: 4 }}>
                  {a.l}
                </div>
              </div>
            ))}
          </div>

          {/* people on app — placeholder, contacts not yet implemented */}
          <div className="h-meta" style={{ marginTop: 16 }}>
            通讯录里也用 Reminder 的
          </div>
          <div
            className="hf-box dashed dim"
            style={{
              marginTop: 6,
              padding: 12,
              textAlign: "center",
            }}
          >
            <div
              className="h-body"
              style={{ color: "var(--ink-mute)", fontStyle: "italic" }}
            >
              （暂不可用）
            </div>
          </div>

          {/* nearby */}
          <div
            className="hf-box dashed"
            style={{
              marginTop: 14,
              padding: 12,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span style={{ display: "inline-flex" }}>
              <HF.Icon name="wifi" size={22} />
            </span>
            <div style={{ flex: 1 }}>
              <div className="h-row">附近的人</div>
              <div className="h-meta">把手机靠近朋友自动加入</div>
            </div>
            <span className="hf-chip done">
              {nearbyEnabled ? "在找" : "关"}
            </span>
          </div>
        </div>
      </div>
    </Phone>
  );
}
