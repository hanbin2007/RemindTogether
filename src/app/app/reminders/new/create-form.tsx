"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/sketch/icon";
import { createReminderFullAction, type CreateFullState } from "./actions";

const initial: CreateFullState = { ok: false };

interface Props {
  groups: Array<{ id: string; name: string; coverEmoji: string | null }>;
  initialGroupId: string | null;
}

const VISIBILITY: Array<{ key: "PRIVATE" | "GROUP"; ic: IconName; label: string }> = [
  { key: "PRIVATE", ic: "lock", label: "只有我" },
  { key: "GROUP", ic: "users", label: "共享" },
];

/**
 * Mirrors HfCreate. Big handwritten title input, then 5 typed fields
 * (time / share-to / assign-to / location / attachments — only the
 * functional ones submit to the API), then a visibility chip group.
 *
 * For now: only title + visibility + group binding land in the DB. The
 * cosmetic fields (location, attachments) remain placeholders so the
 * design renders 1:1 without breaking the schema.
 */
export function CreateReminderForm({ groups, initialGroupId }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createReminderFullAction,
    initial,
  );
  const [vis, setVis] = useState<"PRIVATE" | "GROUP">(
    initialGroupId ? "GROUP" : "PRIVATE",
  );
  const [groupId, setGroupId] = useState<string | null>(initialGroupId);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState<string>("");
  const [showWhen, setShowWhen] = useState(false);

  if (state.ok && state.reminderId) {
    // After creation the action revalidates; navigate to detail.
    setTimeout(() => {
      router.push(`/app/reminders/${state.reminderId}`);
    }, 0);
  }

  const groupLabel = (() => {
    if (vis !== "GROUP") return "—";
    const g = groups.find((g) => g.id === groupId);
    return g ? `#${g.name}` : "选个群";
  })();

  return (
    <form
      action={(fd) => {
        fd.set("title", title);
        fd.set("visibility", vis);
        if (vis === "GROUP" && groupId) fd.set("groupId", groupId);
        if (dueAt) fd.set("dueAt", dueAt);
        return action(fd);
      }}
      className="rt-box rt-box-thick p-3.5"
      data-testid="create-reminder-form"
      style={{
        borderRadius: "20px 18px 22px 16px / 16px 22px 18px 20px",
      }}
    >
      <div className="flex items-center mb-2">
        <h2 className="rt-h-h2">新提醒</h2>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            data-testid="create-cancel"
            onClick={() => router.back()}
            className="rt-btn rt-btn-ghost"
            style={{ padding: "4px 10px", fontSize: 13 }}
          >
            取消
          </button>
          <button
            type="submit"
            data-testid="create-submit"
            disabled={pending || !title.trim()}
            className="rt-btn rt-btn-primary"
            style={{ padding: "6px 12px", fontSize: 13 }}
          >
            {pending ? "创建…" : "创建"}
          </button>
        </div>
      </div>

      {/* big handwritten title */}
      <div
        className="py-2"
        style={{ borderBottom: "1.3px dashed var(--rt-ink-faint)" }}
      >
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="想做什么？"
          maxLength={140}
          required
          data-testid="create-title"
          className="w-full rt-h-h1 bg-transparent outline-none"
          style={{ fontSize: 24, color: "var(--rt-ink)" }}
        />
      </div>

      {/* fields */}
      <div className="mt-2 flex flex-col gap-1.5">
        <FieldRow icon="calendar" label="时间">
          <button
            type="button"
            onClick={() => setShowWhen((s) => !s)}
            className="text-left w-full rt-h-row"
            data-testid="create-when-toggle"
            style={{ fontSize: 16 }}
          >
            {dueAt ? new Date(dueAt).toLocaleString("zh-CN") : "—"}
          </button>
        </FieldRow>
        {showWhen && (
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            data-testid="create-when"
            className="rt-input"
          />
        )}

        <FieldRow icon="handshake" label="分享到" hl={vis === "GROUP"}>
          <p className="rt-h-row" style={{ fontSize: 16 }}>
            {groupLabel}
          </p>
        </FieldRow>

        {vis === "GROUP" && (
          <select
            value={groupId ?? ""}
            onChange={(e) => setGroupId(e.target.value || null)}
            data-testid="create-group-select"
            required
            className="rt-input"
          >
            <option value="">选个群</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.coverEmoji ?? "📌"} {g.name}
              </option>
            ))}
          </select>
        )}

        <FieldRow icon="point" label="指派给">
          <p className="rt-h-row" style={{ fontSize: 16 }}>
            —
          </p>
        </FieldRow>
        <FieldRow icon="pin" label="位置">
          <p className="rt-h-row" style={{ fontSize: 16 }}>
            —
          </p>
        </FieldRow>
        <FieldRow icon="paperclip" label="附件">
          <p className="rt-h-row" style={{ fontSize: 16 }}>
            点击添加
          </p>
        </FieldRow>
      </div>

      {/* visibility chips */}
      <div
        className="rt-box rt-box-dim mt-2.5 p-2"
        data-testid="create-visibility"
      >
        <p className="rt-h-meta mb-1.5">谁能看到</p>
        <div className="flex gap-1">
          {VISIBILITY.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => {
                setVis(v.key);
                if (v.key === "PRIVATE") setGroupId(null);
              }}
              data-testid={`create-vis-${v.key}`}
              data-active={vis === v.key ? "true" : undefined}
              className={`rt-chip flex-1 justify-center gap-1 ${
                vis === v.key ? "rt-chip-fill" : ""
              }`}
              style={{ fontSize: 13 }}
            >
              <Icon name={v.ic} size={12} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {state.fieldError && (
        <p
          data-testid="create-error"
          className="rt-h-meta mt-2"
          style={{ color: "var(--rt-poke)" }}
        >
          {state.fieldError}
        </p>
      )}
    </form>
  );
}

function FieldRow({
  icon,
  label,
  hl = false,
  children,
}: {
  icon: IconName;
  label: string;
  hl?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rt-box flex items-center gap-2.5 p-2"
      style={{
        background: hl ? "var(--rt-claim-soft)" : undefined,
        borderColor: hl ? "var(--rt-claim)" : undefined,
      }}
    >
      <span
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 28,
          height: 28,
          border: "1.4px solid var(--rt-ink)",
          background: "var(--rt-paper)",
          borderRadius: "8px 5px 9px 4px / 4px 9px 5px 8px",
        }}
      >
        <Icon name={icon} size={14} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="rt-h-meta">{label}</p>
        <div>{children}</div>
      </div>
    </div>
  );
}
