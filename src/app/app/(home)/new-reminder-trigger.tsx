"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SheetOverlay } from "@/components/hf";
import { HF } from "@/components/sketch/hf";
import { CreateReminderForm } from "@/app/app/reminders/new/create-form";

interface Group {
  id: string;
  name: string;
  coverEmoji: string | null;
}

/**
 * "+ 加" CTA on /app/private (and anywhere else that wants the popup
 * version of HfCreate). Renders a button styled like the original
 * design Link; on click portals a bottom sheet over the current page
 * containing CreateReminderForm. After submit the sheet closes and
 * the host page is refreshed so the new row shows up immediately.
 *
 * The standalone /app/reminders/new page still works as a fallback for
 * direct URL access (deep-link, tests, browser back etc.).
 */
export function NewReminderTrigger({
  groups,
  initialGroupId = null,
  className,
  testid = "private-new",
  label = "加",
  style,
  variant = "compact",
}: {
  groups: Group[];
  /** Preselect a group in the form (e.g. when triggered from a group page). */
  initialGroupId?: string | null;
  className?: string;
  testid?: string;
  label?: string;
  style?: React.CSSProperties;
  /** "compact" (small "+ 加" pill) or "wide" (full-width action-bar button). */
  variant?: "compact" | "wide";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const buttonStyle: React.CSSProperties =
    variant === "wide"
      ? {
          flex: 1,
          fontSize: 15,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          ...style,
        }
      : {
          padding: "6px 10px",
          fontSize: 13,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          ...style,
        };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid={testid}
        className={className ?? "hf-btn primary"}
        style={buttonStyle}
      >
        <HF.Icon name="plus" size={variant === "wide" ? 14 : 12} /> {label}
      </button>
      <SheetOverlay
        open={open}
        onClose={() => setOpen(false)}
        height={640}
      >
        <div style={{ padding: "0 14px" }}>
          <CreateReminderForm
            groups={groups}
            initialGroupId={initialGroupId}
            initialMembers={[]}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </SheetOverlay>
    </>
  );
}
