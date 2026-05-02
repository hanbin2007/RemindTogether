"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SheetOverlay } from "@/components/hf";
import { HF } from "@/components/sketch/hf";
import { CreateGroupSheet } from "./new/sheet";

/**
 * Replaces the design's "+ 建群" Link / "邀请伙伴" dashed-tile Link on
 * /app/groups. Both opened a separate /app/groups/new page, but the
 * design (HfL2NewGroup) is actually a SheetOverlay over the list — so
 * we render a popup. After the form succeeds we navigate to the new
 * group's detail (matches CreateGroupSheet's default).
 *
 * Two visual variants share the same sheet behind the scenes via a
 * `variant` prop. The standalone /app/groups/new page stays in place
 * as a deep-link fallback for direct URL hits.
 */
export function NewGroupTrigger({
  variant = "button",
}: {
  variant?: "button" | "tile";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="groups-new"
          className="hf-btn primary"
          style={{
            padding: "6px 10px",
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <HF.Icon name="plus" size={12} /> 建群
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="groups-invite-tile"
          className="hf-box dashed"
          style={{
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--paper-2)",
            textAlign: "left",
            width: "100%",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "inline-flex" }}>
            <HF.Icon name="signpost" size={22} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="h-h3">叫人加进来</div>
            <div className="h-body" style={{ fontSize: 13 }}>
              分享链接 / 二维码 / 通讯录
            </div>
          </div>
          <span className="hf-arrow" />
        </button>
      )}
      <SheetOverlay
        open={open}
        onClose={() => setOpen(false)}
        height={620}
      >
        <div style={{ padding: "0 14px" }}>
          <CreateGroupSheet
            onSuccess={(groupId) => {
              setOpen(false);
              router.push(`/app/groups/${groupId}`);
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetOverlay>
    </>
  );
}
