/**
 * 1:1 port of `window.HfL2GroupInvite` (design/project/hf-screens-L2.jsx
 * lines 663-733). The JSX below is a literal copy with mechanical
 * replacements only:
 *
 *   - <Phone> wrapper                  → <Phone> (responsive, no bezel)
 *   - <window.HF.Icon ...>             → <HF.Icon ... />
 *   - <window.HF.Av ...>               → <HF.Av ... />
 *   - hardcoded sample data             → typed props (real data)
 *   - hardcoded "再看看 / 加入小群" CTA  → <actions> render slot so the
 *     page can mount different action sets per auth state (anonymous
 *     gets signup/login links; logged-in gets the JoinForm; already-
 *     member gets a single "再看看" back link).
 *
 * Class names + inline styles + structure preserved byte-for-byte.
 *
 * Used by: src/app/invite/[token]/page.tsx
 */
import { Phone, HF } from "@/components/hf";
import type { ReactNode } from "react";

export interface HfL2GroupInviteMember {
  /** Display name (1-2 chars rendered inside the avatar). */
  name: string;
  /** Avatar palette slot (0..7). */
  slot: number;
}

export interface HfL2GroupInviteWeeklyReminder {
  title: string;
  /** Count of distinct members who completed it this week. */
  doersCount: number;
  /** Whether the inviter has it in their done bucket — drives the
   *  "checked" leading box in the row. False = open / partial. */
  done: boolean;
}

export interface HfL2GroupInviteProps {
  /** Display name of the inviter (e.g. "阿May"). */
  inviterDisplayName: string;
  /** Group name shown as the hero display title. */
  groupName: string;
  /** Total active members. */
  memberCount: number;
  /** Days since the group was created. */
  daysActive: number;
  /** Up to 5 active member avatars rendered under "里面都有谁". */
  members: HfL2GroupInviteMember[];
  /** Up to 3 reminders rendered under "本周大家在做". */
  weeklyReminders: HfL2GroupInviteWeeklyReminder[];
  /** Bottom action bar — caller decides which buttons render. */
  actions: ReactNode;
  /** Optional banner above the actions (e.g. "邀请已过期" warning). */
  notice?: ReactNode;
}

export function HfL2GroupInvite({
  inviterDisplayName,
  groupName,
  memberCount,
  daysActive,
  members,
  weeklyReminders,
  actions,
  notice,
}: HfL2GroupInviteProps) {
  return (
    <Phone>
      <div
        data-testid="invite-landing"
        style={{
          height: "100%",
          background: "var(--paper)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* hero */}
        <div
          style={{
            padding: "24px 22px 16px",
            background: "var(--claim-soft)",
            borderBottom: "1.5px solid var(--line)",
          }}
        >
          <div className="h-meta" data-testid="invite-inviter">
            {inviterDisplayName} 邀请你加入
          </div>
          <div
            className="h-display"
            style={{ fontSize: 28, marginTop: 4 }}
            data-testid="invite-group-name"
          >
            {groupName}
          </div>
          <div
            className="hf-chip"
            style={{ marginTop: 6, fontSize: 12 }}
          >
            <HF.Icon name="users" size={11} /> {memberCount} 个朋友 · 已经{" "}
            {daysActive} 天
          </div>
        </div>

        <div
          style={{
            padding: "14px 18px",
            overflowY: "auto",
            paddingBottom: 30,
          }}
        >
          {/* who's here */}
          <div className="h-meta">里面都有谁</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            {members.map((p, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <HF.Av name={p.name} size={36} i={p.slot} />
                <div
                  className="h-meta"
                  style={{ fontSize: 11, marginTop: 2 }}
                >
                  {p.name}
                </div>
              </div>
            ))}
          </div>

          {/* rules at a glance */}
          <div className="h-meta" style={{ marginTop: 14 }}>
            这个群的脾气
          </div>
          <div
            className="hf-box dashed"
            style={{
              marginTop: 4,
              padding: 12,
              background: "var(--paper-2)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--hand-2)",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              · 跳过日{" "}
              <b style={{ color: "var(--ok)" }}>不算输</b>
              <br />
              · 不显示谁连续没做
              <br />
              · 拍拍是友好的，不是催
              <br />
              · 完成会一起庆祝 🎉
            </div>
          </div>

          {/* what they're doing */}
          {weeklyReminders.length > 0 && (
            <>
              <div className="h-meta" style={{ marginTop: 14 }}>
                本周大家在做
              </div>
              <div
                className="hf-box"
                style={{ marginTop: 4, padding: "6px 12px" }}
              >
                {weeklyReminders.map((it, i, a) => (
                  <div
                    key={i}
                    className="hf-row"
                    style={{
                      padding: "7px 0",
                      borderBottom:
                        i === a.length - 1
                          ? "none"
                          : "1.3px dashed var(--ink-faint)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span className={`hf-check ${it.done ? "done" : ""}`} />
                    <div
                      className="h-row"
                      style={{ flex: 1, fontSize: 14 }}
                    >
                      {it.title}
                    </div>
                    <span className="h-meta">{it.doersCount} 人在做</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div
            className="h-meta"
            style={{
              textAlign: "center",
              marginTop: 16,
              fontStyle: "italic",
            }}
          >
            想清楚再点 — 你随时可以退
          </div>

          {notice && <div style={{ marginTop: 10 }}>{notice}</div>}

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
            }}
          >
            {actions}
          </div>
        </div>
      </div>
    </Phone>
  );
}
