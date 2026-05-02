import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { BadRequestError } from "@/lib/api/errors";
import type { Principal } from "@/lib/auth/principal";
import {
  ConfigDefaults,
  ConfigKey,
  setConfig,
} from "@/services/config";
import { prisma } from "@/lib/prisma";
import { AdminAction, recordAdminAction } from "./audit";

export interface ConfigEntry {
  key: ConfigKey;
  description: string;
  type: "boolean" | "number";
  defaultValue: unknown;
  currentValue: unknown;
}

const KEY_DESCRIPTIONS: Record<ConfigKey, string> = {
  [ConfigKey.RequireEmailVerification]:
    "新用户注册时是否必须验证邮箱（OFF：自动标记已验证，不发邮件）",
  [ConfigKey.PokeDailyLimitPerRecipient]:
    "每天每对（发送方→接收方）的拍拍上限",
  [ConfigKey.PokeAllowUnlinked]:
    "是否允许 unlinked 拍拍（仍需接收方在 Settings 里也允许）",
  [ConfigKey.GroupMaxMembers]: "单群最大成员数（含群主）",
  [ConfigKey.ShieldCardMaxHeld]: "单用户保护卡封顶",
};

const KEY_TYPES: Record<ConfigKey, "boolean" | "number"> = {
  [ConfigKey.RequireEmailVerification]: "boolean",
  [ConfigKey.PokeDailyLimitPerRecipient]: "number",
  [ConfigKey.PokeAllowUnlinked]: "boolean",
  [ConfigKey.GroupMaxMembers]: "number",
  [ConfigKey.ShieldCardMaxHeld]: "number",
};

export async function listConfig(): Promise<ConfigEntry[]> {
  const rows = await prisma.config.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return Object.values(ConfigKey).map((key) => ({
    key,
    description: KEY_DESCRIPTIONS[key],
    type: KEY_TYPES[key],
    defaultValue: ConfigDefaults[key],
    currentValue: byKey.has(key) ? byKey.get(key) : ConfigDefaults[key],
  }));
}

const numberSchema = z.coerce.number().int().min(0).max(10_000);
const booleanSchema = z.coerce.boolean();

export async function adminSetConfig(
  admin: Principal,
  key: string,
  value: unknown,
): Promise<void> {
  if (!Object.values(ConfigKey).includes(key as ConfigKey)) {
    throw new BadRequestError("unknown_config_key", `不认识的 key: ${key}`);
  }
  const t = KEY_TYPES[key as ConfigKey];
  let parsed: unknown;
  if (t === "boolean") {
    parsed = booleanSchema.parse(value);
  } else {
    parsed = numberSchema.parse(value);
  }
  await setConfig(key as ConfigKey, parsed, admin.id);
  await recordAdminAction({
    adminId: admin.id,
    action: AdminAction.UpdateConfig,
    targetType: "config",
    targetId: key,
    payload: { value: parsed as Prisma.InputJsonValue },
  });
}
