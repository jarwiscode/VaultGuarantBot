import { pool } from "../db";
import { z } from "zod";

export const createDealSchema = z.object({
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

  // Creator is the seller, buyer will be set when deal is accepted
  const sellerId = input.initiatorId;
  // Set buyer_id to seller_id initially, will be updated when accepted
  const buyerId = input.initiatorId;

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
      buyerId,
      sellerId,
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

export async function getDealByCode(code: string) {
  const res = await pool.query("select * from deals where code = $1", [code]);
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
    | "item_transferred"
    | "item_received"
) {
  const res = await pool.query(
    "update deals set status = $1, updated_at = now() where id = $2 returning *",
    [status, id]
  );
  return res.rows[0] ?? null;
}

export async function acceptDeal(dealId: number, userId: number) {
  const deal = await getDealById(dealId);
  if (!deal) {
    throw new Error("DEAL_NOT_FOUND");
  }

  if (deal.status !== "pending") {
    throw new Error("INVALID_DEAL_STATUS");
  }

  // Cannot accept own deal
  if (deal.initiator_id === userId) {
    throw new Error("CANNOT_ACCEPT_OWN_DEAL");
  }

  // Update buyer_id to the person who accepts
  const res = await pool.query(
    `
      update deals 
      set buyer_id = $1, status = 'accepted', updated_at = now() 
      where id = $2 
      returning *
    `,
    [userId, dealId]
  );

  return res.rows[0];
}

export async function markItemTransferred(dealId: number, userId: number) {
  const deal = await getDealById(dealId);
  if (!deal) {
    throw new Error("DEAL_NOT_FOUND");
  }

  if (deal.status !== "accepted") {
    throw new Error("INVALID_DEAL_STATUS");
  }

  // Only seller can mark as transferred
  if (deal.seller_id !== userId) {
    throw new Error("NOT_AUTHORIZED");
  }

  const updated = await updateDealStatus(dealId, "item_transferred");
  return updated;
}

export async function markItemReceived(dealId: number, userId: number) {
  const deal = await getDealById(dealId);
  if (!deal) {
    throw new Error("DEAL_NOT_FOUND");
  }

  if (deal.status !== "item_transferred") {
    throw new Error("INVALID_DEAL_STATUS");
  }

  // Only buyer can mark as received
  if (deal.buyer_id !== userId) {
    throw new Error("NOT_AUTHORIZED");
  }

  const updated = await updateDealStatus(dealId, "item_received");
  return updated;
}

export async function cancelDeal(dealId: number, userId: number) {
  const deal = await getDealById(dealId);
  if (!deal) {
    throw new Error("DEAL_NOT_FOUND");
  }

  // Only buyer or seller can cancel
  if (deal.buyer_id !== userId && deal.seller_id !== userId) {
    throw new Error("NOT_AUTHORIZED");
  }

  // Can only cancel if not completed
  if (deal.status === "completed") {
    throw new Error("CANNOT_CANCEL_COMPLETED");
  }

  const updated = await updateDealStatus(dealId, "cancelled");
  return updated;
}
