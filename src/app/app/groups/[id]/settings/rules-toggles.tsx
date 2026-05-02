"use client";

import { useState } from "react";

const RULES = [
  { key: "skipNotLose", t: "跳过日不算输", on: true },
  { key: "hideStreakBreaks", t: "隐藏连续没做几天", on: true },
  { key: "allowPokes", t: "允许互相拍拍", on: true },
  { key: "weeklyRecap", t: "每周日发复盘", on: false },
];

/**
 * Direct port of the rules section from HfL2GroupSettings (lines
 * 540-567). Toggle markup is byte-identical to the design — we just
 * lift the on/off state into local React state. Phase 11 will
 * persist via PATCH /api/groups/:id (group rules schema TBD).
 */
export function GroupRulesToggles({
  groupId,
  canEdit,
}: {
  groupId: string;
  canEdit: boolean;
}) {
  const [state, setState] = useState(
    Object.fromEntries(RULES.map((r) => [r.key, r.on])),
  );

  const toggle = (k: string) => {
    if (!canEdit) return;
    setState((s) => ({ ...s, [k]: !s[k] }));
  };

  return (
    <div
      className="hf-box"
      style={{ marginTop: 4, padding: "4px 12px" }}
      data-testid="settings-rules"
    >
      {RULES.map((r, i, a) => {
        const on = state[r.key];
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => toggle(r.key)}
            disabled={!canEdit}
            data-testid={`settings-rule-${r.key}`}
            data-on={on ? "true" : "false"}
            className="hf-row w-full text-left"
            style={{
              padding: "8px 0",
              borderBottom:
                i === a.length - 1
                  ? "none"
                  : "1.3px dashed var(--ink-faint)",
              cursor: canEdit ? "pointer" : "default",
            }}
          >
            <div className="h-row" style={{ flex: 1, fontSize: 14 }}>
              {r.t}
            </div>
            <div
              style={{
                width: 32,
                height: 18,
                borderRadius: 10,
                border: "1.5px solid var(--line)",
                background: on ? "var(--ok)" : "var(--paper-2)",
                position: "relative",
                transition: "background 160ms ease-out",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 1,
                  left: on ? 15 : 1,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "1.4px solid var(--line)",
                  background: "var(--paper)",
                  transition: "left 160ms ease-out",
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

