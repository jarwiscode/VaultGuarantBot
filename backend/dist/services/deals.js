"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDealSchema = void 0;
exports.createDeal = createDeal;
exports.listUserDeals = listUserDeals;
exports.getDealById = getDealById;
exports.updateDealStatus = updateDealStatus;
const db_1 = require("../db");
const zod_1 = require("zod");
exports.createDealSchema = zod_1.z.object({
    buyerId: zod_1.z.number().int().positive(),
    sellerId: zod_1.z.number().int().positive(),
    initiatorId: zod_1.z.number().int().positive(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().default("USDT"),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
function generateDealCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
async function createDeal(input) {
    const code = generateDealCode();
    const commissionPercent = 1.0;
    const commissionAmount = (input.amount * commissionPercent) / 100;
    const res = await db_1.pool.query(`
      insert into deals (
        code, buyer_id, seller_id, initiator_id, amount, currency,
        status, title, description, commission_percent, commission_amount
      )
      values ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10)
      returning *;
    `, [
        code,
        input.buyerId,
        input.sellerId,
        input.initiatorId,
        input.amount,
        input.currency,
        input.title,
        input.description ?? null,
        commissionPercent,
        commissionAmount,
    ]);
    return res.rows[0];
}
async function listUserDeals(userId) {
    const res = await db_1.pool.query(`
      select * from deals
      where buyer_id = $1 or seller_id = $1
      order by created_at desc
      limit 50
    `, [userId]);
    return res.rows;
}
async function getDealById(id) {
    const res = await db_1.pool.query("select * from deals where id = $1", [id]);
    return res.rows[0] ?? null;
}
async function updateDealStatus(id, status) {
    const res = await db_1.pool.query("update deals set status = $1, updated_at = now() where id = $2 returning *", [status, id]);
    return res.rows[0] ?? null;
}
