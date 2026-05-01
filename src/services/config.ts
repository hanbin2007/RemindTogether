import { prisma } from "@/lib/prisma";

/**
 * Runtime feature flags + tunables, persisted in the `Config` table.
 *
 * Anything that the admin backend should be able to flip without a redeploy
 * lives here. PRD-anchored knobs:
 * - auth.requireEmailVerification — gate the email-verify flow at signup
 * - poke.dailyLimitPerRecipient   — service-side rate limit for pokes
 * - group.maxMembers              — single-group ceiling
 * - shieldCard.maxHeld            — per-user shield card ceiling
 *
 * Add new keys here so type-checking catches typos at call sites.
 */
export const ConfigKey = {
  RequireEmailVerification: "auth.requireEmailVerification",
  PokeDailyLimitPerRecipient: "poke.dailyLimitPerRecipient",
  PokeAllowUnlinked: "poke.allowUnlinked",
  GroupMaxMembers: "group.maxMembers",
  ShieldCardMaxHeld: "shieldCard.maxHeld",
} as const;
export type ConfigKey = (typeof ConfigKey)[keyof typeof ConfigKey];

export const ConfigDefaults: Record<ConfigKey, unknown> = {
  [ConfigKey.RequireEmailVerification]: false,
  [ConfigKey.PokeDailyLimitPerRecipient]: 3,
  [ConfigKey.PokeAllowUnlinked]: false,
  [ConfigKey.GroupMaxMembers]: 50,
  [ConfigKey.ShieldCardMaxHeld]: 5,
};

async function readRaw(key: ConfigKey): Promise<unknown> {
  const row = await prisma.config.findUnique({ where: { key } });
  return row ? row.value : ConfigDefaults[key];
}

export async function getConfigBool(key: ConfigKey): Promise<boolean> {
  const v = await readRaw(key);
  return v === true;
}

export async function getConfigInt(key: ConfigKey): Promise<number> {
  const v = await readRaw(key);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const fallback = ConfigDefaults[key];
  return typeof fallback === "number" ? fallback : 0;
}

/**
 * Upsert a config value. `updatedBy` is the admin user id (when called from
 * the admin panel) or null for system-initiated writes (seeding, tests).
 */
export async function setConfig(
  key: ConfigKey,
  value: unknown,
  updatedBy?: string | null,
): Promise<void> {
  await prisma.config.upsert({
    where: { key },
    create: { key, value: value as never, updatedBy: updatedBy ?? null },
    update: { value: value as never, updatedBy: updatedBy ?? null },
  });
}
