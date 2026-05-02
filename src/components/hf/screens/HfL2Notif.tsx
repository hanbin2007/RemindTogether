/**
 * 1:1 port of `window.HfL2Notif` (design/project/hf-screens-L2.jsx
 * lines 982-1079) — the notification *preferences* settings page (DND
 * window, ringtone, poke caps), not the inbox list. The inbox list
 * lives in `HfL2NotifList.tsx`.
 *
 * Mechanical replacements:
 *   - <Phone> wrapper                   → <Phone>
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *   - hardcoded "22:30 / 7:30" times     → typed `dnd` props
 *   - hardcoded "小铃铛" radio selection  → typed `sound` prop + form
 *   - hardcoded toggle states              → typed `pokePrefs` prop +
 *     hidden form fields
 *   - 周一-五 "active" 周末 "inactive"     → typed `dndDays` mask (UI-
 *     only for now: schema doesn't store per-day windows; the array
 *     just renders in the same shape as the design)
 *
 * className + inline styles + structure preserved byte-for-byte.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Phone, HF } from "@/components/hf";

export type HfL2NotifSoundKey =
  | "default"
  | "bird"
  | "wood"
  | "vibrate"
  | "silent";

export interface HfL2NotifSoundOption {
  key: HfL2NotifSoundKey;
  /** Display label (e.g. "小铃铛 ♪"). */
  label: string;
  /** Sub-line under the label (e.g. "默认 · 温柔"). */
  sub: string;
}

export const HF_L2_NOTIF_SOUNDS: HfL2NotifSoundOption[] = [
  { key: "default", label: "小铃铛 ♪", sub: "默认 · 温柔" },
  { key: "bird", label: "小鸟 ♬", sub: "清晨" },
  { key: "wood", label: "木鱼 ♩", sub: "稳" },
  { key: "vibrate", label: "震动而已", sub: "静音" },
  { key: "silent", label: "什么都不响", sub: "只看屏幕" },
];

export interface HfL2NotifProps {
  /** Where the back arrow points. */
  backHref: string;
  /** DND window. `null` on either field disables the window. */
  dnd: {
    start: string | null; // "HH:MM"
    end: string | null;
  };
  /** 7-bit array (Mon..Sun) of "DND active" flags. UI-only for now. */
  dndDays: boolean[];
  /** Currently selected ringtone key. */
  sound: HfL2NotifSoundKey;
  /** Booleans for the four "朋友拍我" toggles. */
  pokePrefs: {
    fullScreen: boolean; // 响一下 + 全屏
    vibrateOnly: boolean; // 只震动
    skipDuringDnd: boolean; // 勿扰时段不通知
    capPerDay: boolean; // 每天最多收 N 次拍拍
  };
  /** Daily cap when `pokePrefs.capPerDay` is true. */
  capPerDayValue: number;
  /**
   * Save form action — wraps the entire form. The page wires this to
   * `updateNotifPrefsAction` so all knobs commit together via a single
   * 保存 button. (Design has no save button; we add one to keep the
   * server-action contract simple. Cosmetically it sits in the design's
   * own paper area.)
   */
  formAction: (formData: FormData) => Promise<void> | void;
  /** Optional notice rendered above the form (e.g. success ✓). */
  notice?: ReactNode;
}

const WEEKDAY = ["一", "二", "三", "四", "五", "六", "日"];

function ToggleLabel({ active }: { active: boolean }) {
  // Visual-only toggle (design's pill). The actual checkbox sits behind.
  return (
    <span
      style={{
        width: 32,
        height: 18,
        borderRadius: 10,
        border: "1.5px solid var(--line)",
        background: active ? "var(--ok)" : "var(--paper-2)",
        position: "relative",
        display: "inline-block",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 1,
          left: active ? 15 : 1,
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "1.4px solid var(--line)",
          background: "var(--paper)",
        }}
      />
    </span>
  );
}

export function HfL2Notif({
  backHref,
  dnd,
  dndDays,
  sound,
  pokePrefs,
  capPerDayValue,
  formAction,
  notice,
}: HfL2NotifProps) {
  const dndOn = !!(dnd.start && dnd.end);

  return (
    <Phone>
      <div
        data-testid="notif-prefs"
        style={{
          height: "100%",
          background: "var(--paper)",
          overflow: "hidden",
        }}
      >
        {/* nav header */}
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1.5px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Link
            href={backHref}
            data-testid="notif-prefs-back"
            style={{ fontFamily: "var(--hand-2)", fontSize: 18 }}
          >
            ‹
          </Link>
          <div style={{ flex: 1 }}>
            <div className="h-meta">设置</div>
            <div className="h-row" style={{ fontSize: 16 }}>
              提醒声音和勿扰
            </div>
          </div>
        </div>

        <form
          action={formAction}
          data-testid="notif-prefs-form"
          style={{
            padding: "12px 14px",
            overflowY: "auto",
            height: "calc(100% - 56px)",
            paddingBottom: 80,
          }}
        >
          {notice && <div style={{ marginBottom: 10 }}>{notice}</div>}

          {/* dnd schedule */}
          <div className="h-meta">勿扰时段</div>
          <div
            className="hf-box thick"
            style={{
              marginTop: 6,
              padding: 12,
              background: "var(--paper-2)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <HF.Icon name="moon" size={20} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <input
                    type="time"
                    name="dndStart"
                    defaultValue={dnd.start ?? "22:30"}
                    data-testid="notif-dnd-start"
                    style={{
                      fontFamily: "var(--hand)",
                      fontSize: 14,
                      border: "none",
                      background: "transparent",
                      padding: 0,
                    }}
                  />
                  <span className="h-meta">—</span>
                  <input
                    type="time"
                    name="dndEnd"
                    defaultValue={dnd.end ?? "07:30"}
                    data-testid="notif-dnd-end"
                    style={{
                      fontFamily: "var(--hand)",
                      fontSize: 14,
                      border: "none",
                      background: "transparent",
                      padding: 0,
                    }}
                  />
                </div>
                <div className="h-meta">这段时间不响</div>
              </div>
              {/* on/off pill — backed by dndOn checkbox */}
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name="dndOn"
                  defaultChecked={dndOn}
                  data-testid="notif-dnd-on"
                  style={{ display: "none" }}
                />
                <span
                  className="hf-chip"
                  style={{
                    background: dndOn ? "var(--ok)" : "var(--paper)",
                    color: dndOn ? "white" : "var(--ink)",
                    fontSize: 11,
                  }}
                >
                  {dndOn ? "开" : "关"}
                </span>
              </label>
            </div>

            {/* week dots — UI only (schema does not yet store per-day) */}
            <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
              {WEEKDAY.map((d, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 28,
                    border: "1.4px solid var(--line)",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: dndDays[i] ? "var(--ink)" : "var(--paper)",
                    color: dndDays[i] ? "white" : "var(--ink)",
                    fontFamily: "var(--hand-2)",
                    fontSize: 12,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="h-meta" style={{ marginTop: 6 }}>
              周末睡晚一点也行
            </div>
          </div>

          {/* sound */}
          <div className="h-meta" style={{ marginTop: 14 }}>
            提醒声音
          </div>
          <div className="hf-box" style={{ marginTop: 4, padding: "4px 12px" }}>
            {HF_L2_NOTIF_SOUNDS.map((opt, i, a) => {
              const sel = opt.key === sound;
              return (
                <label
                  key={opt.key}
                  className="hf-row"
                  data-testid={`notif-sound-${opt.key}`}
                  style={{
                    padding: "8px 0",
                    borderBottom:
                      i === a.length - 1
                        ? "none"
                        : "1.3px dashed var(--ink-faint)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="sound"
                    value={opt.key}
                    defaultChecked={sel}
                    style={{ display: "none" }}
                  />
                  <span className={`hf-radio ${sel ? "on" : ""}`} />
                  <div style={{ flex: 1 }}>
                    <div className="h-row" style={{ fontSize: 14 }}>
                      {opt.label}
                    </div>
                    <div className="h-meta">{opt.sub}</div>
                  </div>
                  <span
                    className="h-meta"
                    style={{ color: "var(--claim)" }}
                  >
                    试听
                  </span>
                </label>
              );
            })}
          </div>

          {/* poke prefs */}
          <div className="h-meta" style={{ marginTop: 14 }}>
            朋友拍我
          </div>
          <div className="hf-box" style={{ marginTop: 4, padding: "4px 12px" }}>
            {[
              {
                key: "pokeFullScreen",
                t: "响一下 + 全屏",
                on: pokePrefs.fullScreen,
              },
              {
                key: "pokeVibrateOnly",
                t: "只震动",
                on: pokePrefs.vibrateOnly,
              },
              {
                key: "pokeSkipDuringDnd",
                t: "勿扰时段不通知",
                on: pokePrefs.skipDuringDnd,
              },
            ].map((row, i) => (
              <label
                key={row.key}
                className="hf-row"
                data-testid={`notif-${row.key}`}
                style={{
                  padding: "8px 0",
                  borderBottom: "1.3px dashed var(--ink-faint)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name={row.key}
                  defaultChecked={row.on}
                  style={{ display: "none" }}
                />
                <div className="h-row" style={{ flex: 1, fontSize: 14 }}>
                  {row.t}
                </div>
                <ToggleLabel active={row.on} />
              </label>
            ))}
            {/* 每天最多收 N 次拍拍 — has a numeric input alongside */}
            <label
              className="hf-row"
              data-testid="notif-pokeCapPerDay"
              style={{
                padding: "8px 0",
                borderBottom: "none",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="pokeCapPerDay"
                defaultChecked={pokePrefs.capPerDay}
                style={{ display: "none" }}
              />
              <div
                className="h-row"
                style={{
                  flex: 1,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                每天最多收
                <input
                  type="number"
                  name="pokeCapPerDayValue"
                  defaultValue={capPerDayValue}
                  min={1}
                  max={50}
                  data-testid="notif-pokeCapPerDay-value"
                  style={{
                    width: 44,
                    fontFamily: "var(--hand)",
                    fontSize: 14,
                    border: "1px dashed var(--ink-faint)",
                    background: "transparent",
                    textAlign: "center",
                    padding: "1px 4px",
                    borderRadius: 4,
                  }}
                />
                次拍拍
              </div>
              <ToggleLabel active={pokePrefs.capPerDay} />
            </label>
          </div>

          {/* save bar — small departure from design (which is "live"
              toggles); a single save button keeps the server-action
              contract simple and gives clear feedback. */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              background: "var(--paper)",
              paddingTop: 14,
              paddingBottom: 6,
              marginTop: 18,
              borderTop: "1.3px dashed var(--ink-faint)",
              display: "flex",
              gap: 8,
            }}
          >
            <Link
              href={backHref}
              className="hf-btn ghost"
              style={{ flex: 1, padding: "10px 0", textAlign: "center" }}
            >
              取消
            </Link>
            <button
              type="submit"
              data-testid="notif-prefs-save"
              className="hf-btn primary"
              style={{ flex: 2, padding: "10px 0" }}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </Phone>
  );
}
