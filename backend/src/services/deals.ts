import { pool } from "../db";
import { z } from "zod";

export const createDealSchema = z.object({
  buyerId: z.number().int().positive(),
  sellerId: z.number().int().positive(),
  initiatorId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().default("USDT"),
  title: z.string().min(1),
  description: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;

function generateDealCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createDeal(input: CreateDealInput) {
  const code = generateDealCode();
  const commissionPercent = 1.0;
  const commissionAmount = (input.amount * commissionPercent) / 100;

  const res = await pool.query(
    `
      insert into deals (
        code, buyer_id, seller_id, initiator_id, amount, currency,
        status, title, description, commission_percent, commission_amount
      )
      values ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10)
      returning *;
    `,
    [
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
    ]
  );

  return res.rows[0];
}

export async function listUserDeals(userId: number) {
  const res = await pool.query(
    `
      select * from deals
      where buyer_id = $1 or seller_id = $1
      order by created_at desc
      limit 50
    `,
    [userId]
  );
  return res.rows;
}

export async function getDealById(id: number) {
  const res = await pool.query("select * from deals where id = $1", [id]);
  return res.rows[0] ?? null;
}

export async function updateDealStatus(
  id: number,
  status:
    | "accepted"
    | "rejected"
    | "funded"
    | "completed"
    | "cancelled"
    | "dispute"
) {
  const res = await pool.query(
    "update deals set status = $1, updated_at = now() where id = $2 returning *",
    [status, id]
  );
  return res.rows[0] ?? null;
}

