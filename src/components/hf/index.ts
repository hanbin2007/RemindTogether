/**
 * Design-component bridge.
 *
 * Every file in design/project/hf-screens-*.jsx is a JSX literal that
 * uses these primitives. We re-export here so each screen can be
 * imported with a single line:
 *
 *   import { HF, Phone, TabBar, RemRow, Sheet } from "@/components/hf";
 *
 * Inner screen JSX is then literal-copied with three swaps:
 *   - <Phone>...</Phone>           → <Phone>...</Phone>      (no bezel; responsive)
 *   - <window.HF.Icon ...>          → <HF.Icon ... />
 *   - <Av name=... i=... size=...>  → <HF.Av name=... i=... size=... />
 */
export { Icon, type IconName } from "@/components/sketch/icon";
export {
  Avatar as Av,
  AvatarStack as AvStack,
  avatarSlot,
} from "@/components/sketch/avatar";
export { HF } from "@/components/sketch/hf";
export { Phone } from "./phone";
export { TabBar } from "./tabbar";
export { RemRow } from "./rem-row";
export { Sheet, SheetOverlay } from "./sheet";
export { PageShell, AppHeader } from "./page-shell";
