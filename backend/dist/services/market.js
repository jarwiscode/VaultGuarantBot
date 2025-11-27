"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listActiveGifts = listActiveGifts;
const db_1 = require("../db");
async function listActiveGifts() {
    const res = await db_1.pool.query(`
      select
        id,
        external_id,
        title,
        subtitle,
        category,
        price_points,
        image_url,
        gradient_key
      from market_gifts
      where is_active = true
      order by position asc, id asc
    `);
    return res.rows;
}
