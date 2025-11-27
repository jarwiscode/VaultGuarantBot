"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertUserFromTelegram = upsertUserFromTelegram;
exports.getUserById = getUserById;
exports.getUserByTelegramId = getUserByTelegramId;
const db_1 = require("../db");
async function upsertUserFromTelegram(payload) {
    const language = payload.language_code?.startsWith("ru") ? "ru" : "en";
    const result = await db_1.pool.query(`
      insert into users (telegram_id, username, first_name, last_name, language)
      values ($1, $2, $3, $4, $5)
      on conflict (telegram_id) do update set
        username = excluded.username,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        language = excluded.language,
        updated_at = now()
      returning *;
    `, [
        payload.id,
        payload.username ?? null,
        payload.first_name ?? null,
        payload.last_name ?? null,
        language,
    ]);
    const user = result.rows[0];
    await db_1.pool.query(`
      insert into wallets (user_id, currency)
      values ($1, $2)
      on conflict (user_id, currency) do nothing;
    `, [user.id, "USDT"]);
    return user;
}
async function getUserById(id) {
    const res = await db_1.pool.query("select * from users where id = $1", [id]);
    return res.rows[0] ?? null;
}
async function getUserByTelegramId(telegramId) {
    const res = await db_1.pool.query("select * from users where telegram_id = $1", [
        telegramId,
    ]);
    return res.rows[0] ?? null;
}
