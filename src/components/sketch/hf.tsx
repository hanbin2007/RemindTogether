/**
 * Bridge between the design's `window.HF` API and our React components.
 * This lets us literal-copy JSX from `design/project/hf-screens-*.jsx`
 * into our pages with minimal changes — replace
 *   `window.HF.Icon` → `HF.Icon`
 *   `<Av name="X" i={2} size={32} />` → `<HF.Av name="X" i={2} size={32} />`
 *
 * That's it. Everything else (className, inline styles, structure)
 * stays identical, so we don't lose pixel-level fidelity.
 */
import { Icon, type IconName } from "@/components/sketch/icon";
import { Avatar, AvatarStack } from "@/components/sketch/avatar";

export const HF = {
  Icon,
  Av: Avatar,
  AvStack: AvatarStack,
};

export type { IconName };

// Convenience re-exports for callers that want to grab them top-level.
export { Icon, Avatar, AvatarStack };
