"use client";

import Link from "next/link";
import { HF } from "@/components/sketch/hf";

interface Props {
  reminderId: string;
  candidates: Array<{ id: string; displayName: string }>;
}

/**
 * Trigger button on reminder detail's 拍拍 row. Routes to the dedicated
 * full-screen HfPoke port at /app/reminders/[id]/poke?to=<userId>.
 */
export function PokeComposer({ reminderId, candidates }: Props) {
  if (candidates.length === 0) return null;
  // For multi-candidate (group reminders), the first one becomes the
  // default ?to=. Inside the dedicated screen the user can pick a
  // different reminder via the picker; multi-target picking lands in
  // Phase 11 (HfL2AtPicker).
  const target = candidates[0];
  return (
    <Link
      href={`/app/reminders/${reminderId}/poke?to=${target.id}`}
      data-testid="poke-open"
      className="hf-btn poke"
    >
      <HF.Icon name="wave" size={14} /> 拍拍 {target.displayName}
    </Link>
  );
}
