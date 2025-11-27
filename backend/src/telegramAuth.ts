import crypto from "crypto";
import { config } from "./config";

export interface TelegramUserPayload {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

export function verifyTelegramInitData(initData: string): {
  ok: boolean;
  data?: Record<string, string>;
  error?: string;
} {
  if (!initData) {
    return { ok: false, error: "EMPTY_INIT_DATA" };
  }

  const parsed = new URLSearchParams(initData);
  const hash = parsed.get("hash");
  if (!hash) {
    return { ok: false, error: "NO_HASH" };
  }
  parsed.delete("hash");

  const dataCheckArray: string[] = [];
  parsed.sort();
  parsed.forEach((value, key) => {
    dataCheckArray.push(`${key}=${value}`);
  });
  const dataCheckString = dataCheckArray.join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(config.botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    return { ok: false, error: "HASH_MISMATCH" };
  }

  const data: Record<string, string> = {};
  parsed.forEach((value, key) => {
    data[key] = value;
  });

  return { ok: true, data };
}

export function parseTelegramUser(data: Record<string, string>): TelegramUserPayload {
  const rawUser = data.user;
  if (!rawUser) {
    throw new Error("NO_USER_IN_INIT_DATA");
  }
  const user = JSON.parse(rawUser);
  return {
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    language_code: user.language_code,
  };
}

