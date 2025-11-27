import { pool } from "../db";
import { TelegramUserPayload } from "../telegramAuth";

export async function upsertUserFromTelegram(payload: TelegramUserPayload) {
  const language = payload.language_code?.startsWith("ru") ? "ru" : "en";

  const result = await pool.query(
    `
      insert into users (telegram_id, username, first_name, last_name, language)
      values ($1, $2, $3, $4, $5)
      on conflict (telegram_id) do update set
        username = excluded.username,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        language = excluded.language,
        updated_at = now()
      returning *;
    `,
    [
      payload.id,
      payload.username ?? null,
      payload.first_name ?? null,
      payload.last_name ?? null,
      language,
    ]
  );

  const user = result.rows[0];

  await pool.query(
    `
      insert into wallets (user_id, currency)
      values ($1, $2)
      on conflict (user_id, currency) do nothing;
    `,
    [user.id, "USDT"]
  );

  return user;
}

export async function getUserById(id: number) {
  const res = await pool.query("select * from users where id = $1", [id]);
  return res.rows[0] ?? null;
}

export async function getUserByTelegramId(telegramId: number) {
  const res = await pool.query("select * from users where telegram_id = $1", [
    telegramId,
  ]);
  return res.rows[0] ?? null;
}

