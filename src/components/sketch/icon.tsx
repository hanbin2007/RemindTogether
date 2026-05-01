/**
 * Hand-drawn icon system, ported 1:1 from design/project/hf-icons.jsx.
 * Strokes are 1.6, round caps, slightly wobbly geometry to match the
 * sketch aesthetic. NO emoji anywhere — use these in chips, banners, tab
 * bars, anywhere a glyph is needed.
 */
import type { CSSProperties, ReactNode } from "react";

export type IconName =
  | "sun"
  | "moon"
  | "inbox"
  | "clock"
  | "lock"
  | "trendDown"
  | "home"
  | "bird"
  | "book"
  | "letterA"
  | "dumbbell"
  | "house"
  | "search"
  | "plus"
  | "gear"
  | "bolt"
  | "boltFilled"
  | "check"
  | "x"
  | "dots"
  | "menu"
  | "bell"
  | "send"
  | "sparkle"
  | "calendar"
  | "handshake"
  | "point"
  | "pin"
  | "paperclip"
  | "users"
  | "megaphone"
  | "chat"
  | "phone"
  | "wifi"
  | "mail"
  | "wave"
  | "fire"
  | "coffee"
  | "mic"
  | "camera"
  | "image"
  | "egg"
  | "smile"
  | "sweat"
  | "flag"
  | "signpost"
  | "cmd"
  | "repeat"
  | "heart"
  | "shield"
  | "confetti";

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  ["aria-label"]?: string;
}

const PATHS: Record<IconName, ReactNode> = {
  // navigation / views
  sun: (
    <>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M9 1.8 V3.4 M9 14.6 V16.2 M1.8 9 H3.4 M14.6 9 H16.2 M3.7 3.7 L4.9 4.9 M13.1 13.1 L14.3 14.3 M3.7 14.3 L4.9 13.1 M13.1 4.9 L14.3 3.7" />
    </>
  ),
  moon: <path d="M14.2 11 a6 6 0 11-7.4-8.2 a4.6 4.6 0 007.4 8.2 Z" />,
  inbox: (
    <path d="M2.5 4 L4 11 H14 L15.5 4 M2.5 11 V14.5 a1 1 0 001 1 H14.5 a1 1 0 001-1 V11 M6 11 a3 3 0 006 0" />
  ),
  clock: (
    <>
      <circle cx="9" cy="9" r="6.2" />
      <path d="M9 5.5 V9 L11.5 10.5" />
    </>
  ),
  lock: (
    <>
      <rect x="3.5" y="8" width="11" height="7" rx="1.2" />
      <path d="M5.5 8 V6 a3.5 3.5 0 017 0 V8" />
    </>
  ),
  trendDown: (
    <>
      <path d="M2.5 5 L7 9.5 L10 7 L15.5 13" />
      <path d="M11 13 H15.5 V8.5" />
    </>
  ),
  home: (
    <>
      <path d="M3 9 L9 3.5 L15 9 V14.5 a1 1 0 01-1 1 H4 a1 1 0 01-1-1 Z" />
      <path d="M7.5 15.5 V11 H10.5 V15.5" />
    </>
  ),
  bird: (
    <>
      <path d="M3 11 c2.5 0 4-1 5-3 c1-2 3-2.5 5-1.5 L15.5 5 L14 8.5 c-0.5 3-3 5-6 5 H4.5 Z" />
      <circle cx="11.5" cy="7.5" r="0.5" fill="currentColor" />
    </>
  ),
  book: (
    <>
      <path d="M3 4 c2-0.6 4-0.6 6 0.4 V15 c-2-1-4-1-6-0.4 Z" />
      <path d="M15 4 c-2-0.6-4-0.6-6 0.4 V15 c2-1 4-1 6-0.4 Z" />
    </>
  ),
  letterA: <path d="M3.5 14.5 L9 3 L14.5 14.5 M5.5 11 H12.5" />,
  dumbbell: (
    <path d="M2.5 7 V11 M4.5 5.5 V12.5 M13.5 5.5 V12.5 M15.5 7 V11 M4.5 9 H13.5" />
  ),
  house: (
    <>
      <path d="M2.5 8.5 L9 3 L15.5 8.5 V15 H2.5 Z" />
      <path d="M7 15 V11 H11 V15" />
    </>
  ),

  // actions / chrome
  search: (
    <>
      <circle cx="8" cy="8" r="4.5" />
      <path d="M11.3 11.3 L15 15" />
    </>
  ),
  plus: <path d="M9 3.5 V14.5 M3.5 9 H14.5" />,
  gear: (
    <>
      <circle cx="9" cy="9" r="2.4" />
      <path d="M9 1.8 V4 M9 14 V16.2 M1.8 9 H4 M14 9 H16.2 M3.5 3.5 L5.2 5.2 M12.8 12.8 L14.5 14.5 M3.5 14.5 L5.2 12.8 M12.8 5.2 L14.5 3.5" />
    </>
  ),
  bolt: <path d="M10.5 2 L4 10 H8.5 L7.5 16 L14 8 H9.5 L10.5 2 Z" />,
  boltFilled: (
    <path
      d="M10.5 2 L4 10 H8.5 L7.5 16 L14 8 H9.5 L10.5 2 Z"
      fill="currentColor"
    />
  ),
  check: <path d="M3.5 9.5 L7.5 13 L14.5 5" />,
  x: <path d="M4 4 L14 14 M14 4 L4 14" />,
  dots: (
    <>
      <circle cx="4" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="14" cy="9" r="1" fill="currentColor" />
    </>
  ),
  menu: <path d="M3 5 H15 M3 9 H15 M3 13 H11" />,
  bell: <path d="M4.5 12 c0-3.5 0.5-6 4.5-6 s4.5 2.5 4.5 6 H4.5 Z M9 4 V6 M7 14 a2 2 0 004 0" />,
  send: <path d="M2.5 9 L15.5 3 L11 15.5 L8.5 10 Z M8.5 10 L15.5 3" />,
  sparkle: <path d="M9 3 L10.5 7.5 L15 9 L10.5 10.5 L9 15 L7.5 10.5 L3 9 L7.5 7.5 Z" />,

  // field icons
  calendar: (
    <>
      <rect x="2.5" y="4" width="13" height="11" rx="1" />
      <path d="M2.5 7.5 H15.5 M6 2.5 V5 M12 2.5 V5" />
    </>
  ),
  handshake: (
    <path d="M2 9 L5 6.5 H8 L9 7.5 L8 8.5 H6 M9 7.5 L11 9.5 L13 8 L16 10.5 M16 10.5 L13.5 13 L11 11 L9 13 L6.5 11" />
  ),
  point: <path d="M2.5 8.5 H10 M7 5.5 L10.5 9 L7 12.5 M10.5 9 H15.5" />,
  pin: (
    <>
      <path d="M9 2.5 c3 0 5 2 5 4.5 c0 3-5 8-5 8 s-5-5-5-8 c0-2.5 2-4.5 5-4.5 Z" />
      <circle cx="9" cy="7" r="1.5" />
    </>
  ),
  paperclip: (
    <path d="M14 7 L7.5 13.5 a3 3 0 01-4.2-4.2 L10 2.5 a2 2 0 012.8 2.8 L6 12 a1 1 0 01-1.4-1.4 L11 4" />
  ),
  users: (
    <>
      <circle cx="6.5" cy="6.5" r="2.2" />
      <path d="M2.5 14.5 c0-2.4 1.8-4 4-4 s4 1.6 4 4" />
      <circle cx="12" cy="7" r="1.8" />
      <path d="M10.5 14.5 c0-1.8 1-3 2-3.4" />
    </>
  ),
  megaphone: (
    <path d="M2.5 7 L11 4.5 V13.5 L2.5 11 Z M11 6 L15 5 V13 L11 12 M5 11.5 V14 a1 1 0 002 0 V12" />
  ),

  // share / contact
  chat: <path d="M2.5 4 H15.5 V12 H10 L7 15 V12 H2.5 Z" />,
  phone: (
    <path d="M3 4 c0-0.5 0.4-1 1-1 H6 L7 6.5 L5.5 8 c1 2.5 2 3.5 4.5 4.5 L11.5 11 L14 12 V14 c0 0.6-0.4 1-1 1 c-6 0-10-4-10-10 Z" />
  ),
  wifi: (
    <>
      <path d="M2 6.5 c4-3.5 10-3.5 14 0 M4 9 c3-2.5 7-2.5 10 0 M6 11.5 c2-1.5 4-1.5 6 0" />
      <circle cx="9" cy="14" r="0.8" fill="currentColor" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="4" width="13" height="10" rx="1" />
      <path d="M2.5 5 L9 9.5 L15.5 5" />
    </>
  ),

  // poke flavors
  wave: (
    <path d="M4 11 c1 1.5 3 2.5 5 2.5 c3 0 5-2 5-5 V6 a1 1 0 10-2 0 V8 M12 8 V4.5 a1 1 0 10-2 0 V8 M10 8 V4 a1 1 0 10-2 0 V9 M8 9 V6 a1 1 0 10-2 0 V11" />
  ),
  fire: (
    <>
      <path d="M9 2 c0 3-3 4-3 7 c0 3 1.5 5 3 5 s3-2 3-5 c0-2-1-2-1-4 c0-1-1-2-2-3 Z" />
      <path d="M8 11 c0 1.5 0.5 2.5 1 2.5 s1-1 1-2.5" />
    </>
  ),
  coffee: (
    <path d="M3 6 H13 V11.5 a3 3 0 01-3 3 H6 a3 3 0 01-3-3 Z M13 7.5 H15 a1.5 1.5 0 010 3 H13 M6 2.5 V4 M9 2.5 V4" />
  ),
  mic: (
    <>
      <rect x="6.5" y="2.5" width="5" height="8" rx="2.5" />
      <path d="M3.5 9 c0 3 2.5 5 5.5 5 s5.5-2 5.5-5 M9 14 V16" />
    </>
  ),
  camera: (
    <>
      <path d="M2.5 6 H5 L6 4.5 H12 L13 6 H15.5 V14 H2.5 Z" />
      <circle cx="9" cy="10" r="2.5" />
    </>
  ),
  image: (
    <>
      <rect x="2.5" y="3.5" width="13" height="11" rx="1" />
      <circle cx="6" cy="7.5" r="1.2" />
      <path d="M2.5 12 L6.5 9 L10 11.5 L12 10 L15.5 13" />
    </>
  ),
  egg: (
    <path d="M9 2.5 c-3 0-5 4-5 7.5 a5 5 0 0010 0 c0-3.5-2-7.5-5-7.5 Z" />
  ),
  smile: (
    <>
      <circle cx="9" cy="9" r="6.2" />
      <circle cx="6.8" cy="8" r="0.6" fill="currentColor" />
      <circle cx="11.2" cy="8" r="0.6" fill="currentColor" />
      <path d="M6.5 11 c1 1.5 4 1.5 5 0" />
    </>
  ),
  sweat: (
    <>
      <circle cx="9" cy="9" r="6" />
      <circle cx="6.8" cy="8" r="0.5" fill="currentColor" />
      <circle cx="11.2" cy="8" r="0.5" fill="currentColor" />
      <path d="M7 11.5 c1 0.5 3 0.5 4 0" />
      <path
        d="M14 4.5 c-0.6 1-0.6 2 0 2.5 c0.6-0.5 0.6-1.5 0-2.5 Z"
        fill="currentColor"
      />
    </>
  ),
  flag: <path d="M4 3 V15.5 M4 3.5 H13 L11.5 6.5 L13 9.5 H4" />,
  signpost: (
    <>
      <path d="M9 3 V15.5" />
      <path d="M3.5 5 H12 L13.5 6.5 L12 8 H3.5 Z" />
      <path d="M14 9.5 H6 L4.5 11 L6 12.5 H14 Z" />
    </>
  ),

  // misc
  cmd: (
    <path d="M5.5 6 a1.5 1.5 0 110-3 a1.5 1.5 0 011.5 1.5 V13.5 a1.5 1.5 0 11-1.5-1.5 H12.5 a1.5 1.5 0 111.5 1.5 a1.5 1.5 0 01-1.5-1.5 V4.5 a1.5 1.5 0 011.5-1.5 a1.5 1.5 0 11-1.5 1.5 H5.5 Z" />
  ),
  repeat: <path d="M3 7 H12 L10 5 M15 11 H6 L8 13" />,
  heart: (
    <path d="M9 14.5 C 4 11.5, 2 8.5, 2 6 a3.5 3.5 0 016.5-1.5 a3.5 3.5 0 016.5 1.5 c0 2.5-2 5.5-7 8.5 Z" />
  ),
  shield: (
    <>
      <path d="M9 2.5 L14.5 4.5 V9 c0 3-2.5 5.5-5.5 6.5 c-3-1-5.5-3.5-5.5-6.5 V4.5 Z" />
      <path d="M6.5 9 L8.5 11 L12 7.5" />
    </>
  ),
  confetti: (
    <>
      <path d="M3 15 L9 4 L14 9 L3 15 Z" />
      <path d="M11 3 L13 5 M14.5 6 L16 7.5 M6 2.5 L7.5 4" />
    </>
  ),
};

export function Icon({ name, size = 16, color, className, style, ...rest }: Props) {
  const inner = PATHS[name];
  const s: CSSProperties = color ? { color, ...style } : style ?? {};
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={s}
      aria-label={rest["aria-label"]}
      role={rest["aria-label"] ? "img" : "presentation"}
    >
      {inner}
    </svg>
  );
}
