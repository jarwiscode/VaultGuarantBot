import { pool } from "../db";
import { unlockFunds, transferFunds } from "./wallet";
import { updateDealStatus, getDealById } from "./deals";
import {
  notifyDealCancelled,
  notifyItemReceived,
} from "./notifications";

/**
 * Automatically cancel deals that haven't been accepted within 15 minutes
 */
export async function autoCancelPendingDeals() {
  const client = await pool.connect();
  try {
    // Find deals that are pending and created more than 15 minutes ago
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const res = await client.query(
      `
        SELECT * FROM deals
        WHERE status = 'pending'
        AND created_at < $1
        FOR UPDATE
      `,
      [fifteenMinutesAgo]
    );

    for (const deal of res.rows) {
      try {
        await client.query("BEGIN");

        // Update status to cancelled
        await client.query(
          `
            UPDATE deals
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = $1
          `,
          [deal.id]
        );

        await client.query("COMMIT");

        // Send notifications (async, don't wait)
        notifyDealCancelled(
          { ...deal, status: "cancelled" },
          deal.initiator_id
        ).catch((err) => {
          console.error(`Failed to send notification for deal ${deal.id}:`, err);
        });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Failed to auto-cancel deal ${deal.id}:`, error);
      }
    }

    return res.rows.length;
  } finally {
    client.release();
  }
}

/**
 * Automatically complete deals that were accepted more than 1 hour ago
 * and are still in 'accepted' or 'item_transferred' status
 */
export async function autoCompleteAcceptedDeals() {
  const client = await pool.connect();
  try {
    // Find deals that were accepted more than 1 hour ago
    // We need to track when deal was accepted - we'll use updated_at when status changed to 'accepted'
    // For simplicity, we'll check deals with status 'accepted' that were updated more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const res = await client.query(
      `
        SELECT * FROM deals
        WHERE status IN ('accepted', 'item_transferred')
        AND updated_at < $1
        AND status != 'completed'
        AND status != 'cancelled'
        FOR UPDATE
      `,
      [oneHourAgo]
    );

    for (const deal of res.rows) {
      try {
        await client.query("BEGIN");

        // If funds are locked, transfer them to seller
        if (deal.status === "accepted" || deal.status === "item_transferred") {
          // Transfer funds from buyer to seller
          await transferFunds(
            deal.buyer_id,
            deal.seller_id,
            Number(deal.amount),
            deal.id,
            deal.currency
          );
        }

        // Update status to completed
        await client.query(
          `
            UPDATE deals
            SET status = 'completed', updated_at = NOW()
            WHERE id = $1
          `,
          [deal.id]
        );

        await client.query("COMMIT");

        const completedDeal = { ...deal, status: "completed" };

        // Send notifications (async, don't wait)
        notifyItemReceived(completedDeal).catch((err) => {
          console.error(`Failed to send notification for deal ${deal.id}:`, err);
        });
      } catch (error) {
        await client.query("ROLLBACK");
        console.error(`Failed to auto-complete deal ${deal.id}:`, error);
      }
    }

    return res.rows.length;
  } finally {
    client.release();
  }
}

/**
 * Run both auto-actions (cancel and complete)
 * Should be called periodically (e.g., every minute)
 */
export async function runDealAutoActions() {
  try {
    const cancelled = await autoCancelPendingDeals();
    const completed = await autoCompleteAcceptedDeals();
    
    if (cancelled > 0 || completed > 0) {
      console.log(
        `Auto-actions: cancelled ${cancelled} deals, completed ${completed} deals`
      );
    }
    
    return { cancelled, completed };
  } catch (error) {
    console.error("Error running deal auto-actions:", error);
    return { cancelled: 0, completed: 0 };
  }
}

