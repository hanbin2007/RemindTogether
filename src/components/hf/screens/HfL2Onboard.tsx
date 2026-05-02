/**
 * 1:1 port of `window.HfL2Onboard` from
 * design/project/hf-screens-L2.jsx (lines 1228-1267). The JSX below is a
 * literal copy with the standard mechanical replacements:
 *
 *   - <Phone> wrapper                   → <Phone>
 *   - <window.HF.Icon ...>              → <HF.Icon ... />
 *
 * Inner JSX (className + inline styles + structure) preserved
 * byte-for-byte. The only additions are `data-testid` anchors that the
 * existing /app/onboard E2E suite already keys off of (`onboard-page`,
 * `onboard-title`, `onboard-cta`, `onboard-invite-code`) and `Link`
 * wrappers around the CTA + invite-code so they actually navigate.
 */
import Link from "next/link";
import { Phone, HF } from "@/components/hf";

export function HfL2Onboard() {
  void HF;
  return (
    <Phone>
      <div
        data-testid="onboard-page"
        style={{
          height: "100%",
          background: "var(--paper)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ padding: "60px 22px 0", textAlign: "center" }}>
          <div
            className="hf-box thick"
            style={{
              width: 92,
              height: 92,
              padding: 0,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--paper)",
              fontSize: 48,
              transform: "rotate(-4deg)",
            }}
          >
            👋
          </div>

          <div
            className="h-display"
            data-testid="onboard-title"
            style={{ fontSize: 36, marginTop: 22, lineHeight: 1.1 }}
          >
            交给一个
            <br />
            会替你
            <br />
            惦记的人
          </div>
          <div
            className="h-body"
            style={{
              fontFamily: "var(--hand-2)",
              fontSize: 16,
              marginTop: 14,
              lineHeight: 1.5,
              color: "var(--ink-mute)",
            }}
          >
            不是闹钟。
            <br />
            是朋友帮你记着，
            <br />
            忘了也没关系。
          </div>

          {/* small wins teaser */}
          <div
            className="hf-box dashed"
            style={{
              marginTop: 26,
              padding: 12,
              background: "var(--ok-soft)",
              textAlign: "left",
            }}
          >
            <div className="h-meta">这里会发生</div>
            <div
              style={{
                fontFamily: "var(--hand-2)",
                fontSize: 14,
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              · 朋友帮你记
              <br />
              · 你也帮朋友记
              <br />
              · 完成了一起小庆祝
              <br />
              · 跳过了也没事 — 不算输
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 24, left: 22, right: 22 }}>
          <Link
            href="/app"
            data-testid="onboard-cta"
            className="hf-btn primary"
            style={{ width: "100%", padding: "14px 0", fontSize: 16 }}
          >
            先看看我能记什么
          </Link>
          <div
            className="h-meta"
            style={{ textAlign: "center", marginTop: 8 }}
          >
            已经有人邀请你？
            <Link
              href="/auth/login"
              data-testid="onboard-invite-code"
              style={{
                color: "var(--claim)",
                textDecoration: "underline",
              }}
            >
              填邀请码
            </Link>
          </div>
        </div>
      </div>
    </Phone>
  );
}
