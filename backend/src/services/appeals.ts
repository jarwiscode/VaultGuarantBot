import { pool } from "../db";
import { z } from "zod";

export const createAppealSchema = z.object({
  dealId: z.number().int().positive(),
  userId: z.number().int().positive(),
  comment: z.string().min(1),
  attachment: z
    .object({
      data: z.string(), // base64 encoded
      type: z.string(), // mime type
      filename: z.string().optional(),
    })
    .optional(),
});

export type CreateAppealInput = z.infer<typeof createAppealSchema>;

export async function createAppeal(input: CreateAppealInput) {
  const client = await pool.connect();
  try {
    // Verify deal exists and user is part of it
    const dealRes = await client.query(
      "SELECT * FROM deals WHERE id = $1",
      [input.dealId]
    );
    const deal = dealRes.rows[0];

    if (!deal) {
      throw new Error("DEAL_NOT_FOUND");
    }

    if (
      deal.buyer_id !== input.userId &&
      deal.seller_id !== input.userId &&
      deal.initiator_id !== input.userId
    ) {
      throw new Error("NOT_AUTHORIZED");
    }

    // Save attachment if provided
    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;

    if (input.attachment) {
      // For now, we'll store base64 data in the database
      // In production, you might want to save to file storage and store URL
      attachmentUrl = `data:${input.attachment.type};base64,${input.attachment.data}`;
      attachmentType = input.attachment.type;
    }

    const res = await client.query(
      `
        INSERT INTO appeals (deal_id, user_id, comment, attachment_url, attachment_type, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING *;
      `,
      [input.dealId, input.userId, input.comment, attachmentUrl, attachmentType]
    );

    return res.rows[0];
  } finally {
    client.release();
  }
}

export async function getUserAppeals(userId: number) {
  const res = await pool.query(
    `
      SELECT a.*, d.code as deal_code, d.title as deal_title
      FROM appeals a
      JOIN deals d ON a.deal_id = d.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC;
    `,
    [userId]
  );
  return res.rows;
}

export async function getAppealById(id: number) {
  const res = await pool.query(
    `
      SELECT a.*, d.code as deal_code, d.title as deal_title
      FROM appeals a
      JOIN deals d ON a.deal_id = d.id
      WHERE a.id = $1;
    `,
    [id]
  );
  return res.rows[0] ?? null;
}

