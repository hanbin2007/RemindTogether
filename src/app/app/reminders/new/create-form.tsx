"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { HF, type IconName } from "@/components/sketch/hf";
import { HfL2AtPicker } from "@/components/hf/screens/HfL2AtPicker";
import { createReminderFullAction, type CreateFullState } from "./actions";

const initial: CreateFullState = { ok: false };

interface Group {
  id: string;
  name: string;
  coverEmoji: string | null;
}

interface Member {
  userId: string;
  displayName: string;
}

interface Props {
  groups: Group[];
  initialGroupId: string | null;
  /** Active members of the initial group, used by the @ assignee picker. */
  initialMembers: Member[];
}

const VISIBILITY: Array<{ ic: IconName; t: string; key: "PRIVATE" | "GROUP" | "PUBLIC" }> = [
  { ic: "lock", t: "只有我", key: "PRIVATE" },
  { ic: "users", t: "共享", key: "GROUP" },
  { ic: "megaphone", t: "公开", key: "PUBLIC" },
];

interface FieldProps {
  icon: IconName;
  label: string;
  v: React.ReactNode;
  sub?: React.ReactNode;
  hl?: boolean;
  testid?: string;
  onClick?: () => void;
}

/**
 * Direct port of HfCreate's Field helper (design lines 79-99). Same
 * inline styles + structure; we just allow click-to-edit.
 */
function Field({ icon, label, v, sub, hl, testid, onClick }: FieldProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      data-hl={hl ? "true" : undefined}
      className="hf-box w-full text-left"
      style={{
        padding: "8px 10px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: hl ? "var(--claim-soft)" : "var(--paper)",
        borderColor: hl ? "var(--claim)" : "var(--line)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          fontSize: 14,
          border: "1.4px solid var(--line)",
          background: "var(--paper)",
          borderRadius: "8px 5px 9px 4px / 4px 9px 5px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HF.Icon name={icon} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="h-meta">{label}</div>
        <div className="h-row" style={{ fontSize: 16 }}>
          {v}
        </div>
      </div>
      {sub && (
        <div
          className="h-meta"
          style={{ textAlign: "right", maxWidth: 110 }}
        >
          {sub}
        </div>
      )}
    </button>
  );
}

/**
 * Direct port of HfCreate (design/project/hf-screens-B.jsx lines 7-77).
 * Mechanical replacements only:
 *   - <Phone> + dimmed-today bg          → page chrome
 *   - <window.HF.Icon ...>               → <HF.Icon ... />
 *   - hardcoded sample values            → controlled state
 *   - hardcoded "12 人能看见" / "@阿莫"   → real group + member counts
 *
 * Inner JSX (className + inline styles + structure) preserved verbatim.
 */
export function CreateReminderForm({
  groups,
  initialGroupId,
  initialMembers,
}: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createReminderFullAction,
    initial,
  );
  const [title, setTitle] = useState("");
  const [vis, setVis] = useState<"PRIVATE" | "GROUP" | "PUBLIC">(
    initialGroupId ? "GROUP" : "PRIVATE",
  );
  const [groupId, setGroupId] = useState<string | null>(initialGroupId);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState<string>("");
  const [showWhen, setShowWhen] = useState(false);
  const [showGroupPick, setShowGroupPick] = useState(false);
  const [showAssigneePick, setShowAssigneePick] = useState(false);

  if (state.ok && state.reminderId) {
    setTimeout(() => router.push(`/app/reminders/${state.reminderId}`), 0);
  }

  const selectedGroup = groups.find((g) => g.id === groupId);
  const selectedAssignee = initialMembers.find((m) => m.userId === assigneeId);
  const memberCount = initialMembers.length;

  const whenText = (() => {
    if (!dueAt) return "—";
    const d = new Date(dueAt);
    return d.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  return (
    <form
      action={(fd) => {
        fd.set("title", title);
        fd.set("visibility", vis === "PUBLIC" ? "GROUP" : vis);
        if (vis !== "PRIVATE" && groupId) fd.set("groupId", groupId);
        if (assigneeId) fd.set("assigneeId", assigneeId);
        if (dueAt) fd.set("dueAt", new Date(dueAt).toISOString());
        return action(fd);
      }}
      className="hf-box thick"
      data-testid="create-reminder-form"
      style={{
        background: "var(--paper)",
        padding: "10px 14px 14px",
        borderRadius: "20px 18px 22px 16px / 16px 22px 18px 20px",
        boxShadow: "0 -8px 0 rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 4,
          background: "var(--ink-faint)",
          borderRadius: 2,
          margin: "0 auto 8px",
        }}
      />
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="h-h2">新提醒</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="hf-btn ghost"
            style={{ padding: "4px 10px", fontSize: 13 }}
            data-testid="create-cancel"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={pending || !title.trim()}
            className="hf-btn primary"
            style={{ padding: "6px 12px", fontSize: 13 }}
            data-testid="create-submit"
          >
            {pending ? "创建…" : "创建"}
          </button>
        </div>
      </div>

      {/* big title input */}
      <div
        style={{
          marginTop: 8,
          padding: "8px 0",
          borderBottom: "1.3px dashed var(--ink-faint)",
        }}
      >
        <input
          autoFocus
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="想做什么？"
          maxLength={140}
          required
          data-testid="create-title"
          className="h-h1"
          style={{
            fontSize: 24,
            background: "transparent",
            border: "none",
            outline: "none",
            width: "100%",
            color: "var(--ink)",
          }}
        />
        <div className="h-meta" style={{ marginTop: 6 }}>
          试试一句话：
          <span style={{ color: "var(--claim)" }}>
            {" "}明天 8 点 提醒 @朋友 在 #群名
          </span>
        </div>
      </div>

      {/* fields */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <Field
          icon="calendar"
          label="时间"
          v={whenText}
          sub={dueAt ? "可改重复" : "选个时间"}
          testid="create-when-toggle"
          onClick={() => setShowWhen((s) => !s)}
        />
        {showWhen && (
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            data-testid="create-when"
            className="hf-box"
            style={{
              padding: "8px 10px",
              fontFamily: "var(--mono)",
              fontSize: 14,
              border: "1.6px solid var(--line)",
              background: "var(--paper)",
            }}
          />
        )}

        <Field
          icon="handshake"
          label="分享到"
          v={
            vis === "PRIVATE"
              ? "—"
              : selectedGroup
                ? `#${selectedGroup.name}`
                : "选个群"
          }
          sub={
            vis !== "PRIVATE" && memberCount > 0
              ? `${memberCount} 人能看见`
              : undefined
          }
          hl={vis !== "PRIVATE"}
          testid="create-share-toggle"
          onClick={() => setShowGroupPick((s) => !s)}
        />
        {showGroupPick && (
          <select
            value={groupId ?? ""}
            onChange={(e) => {
              setGroupId(e.target.value || null);
              if (e.target.value && vis === "PRIVATE") setVis("GROUP");
            }}
            data-testid="create-group-select"
            className="hf-box"
            style={{
              padding: "8px 10px",
              fontFamily: "var(--hand)",
              fontSize: 16,
              border: "1.6px solid var(--line)",
              background: "var(--paper)",
            }}
          >
            <option value="">— 选个群 —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.coverEmoji ?? "📌"} {g.name}
              </option>
            ))}
          </select>
        )}

        <Field
          icon="point"
          label="指派给"
          v={selectedAssignee ? `@${selectedAssignee.displayName}` : "—"}
          sub={selectedAssignee ? "到点温柔提醒" : "群里的成员"}
          hl={Boolean(selectedAssignee)}
          testid="create-assignee-toggle"
          onClick={() => setShowAssigneePick((s) => !s)}
        />
        {initialMembers.length > 0 && groupId && (
          <HfL2AtPicker
            open={showAssigneePick}
            onClose={() => setShowAssigneePick(false)}
            groupId={groupId}
            groupName={selectedGroup?.name}
            members={initialMembers.map((m) => ({
              userId: m.userId,
              displayName: m.displayName,
            }))}
            onPick={(userId) => setAssigneeId(userId)}
          />
        )}

        <Field
          icon="pin"
          label="位置"
          v="—"
          sub="到了再提醒"
          testid="create-location"
        />
        <Field
          icon="paperclip"
          label="附件"
          v="—"
          sub="点击添加"
          testid="create-attachments"
        />
      </div>

      {/* visibility */}
      <div className="hf-box dim" style={{ marginTop: 10, padding: 8 }}>
        <div className="h-meta" style={{ marginBottom: 6 }}>
          谁能看到
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {VISIBILITY.map((opt) => {
            const sel = vis === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setVis(opt.key);
                  if (opt.key === "PRIVATE") setGroupId(null);
                }}
                data-testid={`create-vis-${opt.key}`}
                data-active={sel ? "true" : undefined}
                className="hf-chip"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  gap: 4,
                  background: sel ? "var(--ink)" : "var(--paper)",
                  color: sel ? "white" : "var(--ink)",
                  fontSize: 13,
                }}
              >
                <HF.Icon name={opt.ic} size={12} /> {opt.t}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="h-meta"
        style={{ marginTop: 8, textAlign: "center" }}
      >
        @ 选人 · # 选群 · / 时间 · ! 高优先
      </div>

      {state.fieldError && (
        <div
          data-testid="create-error"
          className="h-meta rt-nudge"
          style={{ marginTop: 8, color: "var(--poke)" }}
        >
          {state.fieldError}
        </div>
      )}
    </form>
  );
}
