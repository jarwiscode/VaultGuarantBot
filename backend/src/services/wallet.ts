import { pool } from "../db";

export async function getWallet(userId: number, currency = "USDT") {
  const res = await pool.query(
    "select * from wallets where user_id = $1 and currency = $2",
    [userId, currency]
  );
  return res.rows[0];
}

export async function getWalletWithTransactions(userId: number, currency = "USDT") {
  const walletRes = await pool.query(
    "select * from wallets where user_id = $1 and currency = $2",
    [userId, currency]
  );
  const wallet = walletRes.rows[0];
  if (!wallet) return null;

  const txRes = await pool.query(
    "select * from transactions where wallet_id = $1 order by created_at desc limit 50",
    [wallet.id]
  );

  return { wallet, transactions: txRes.rows };
}

export async function fakeDeposit(userId: number, amount: number, currency = "USDT") {
  await pool.query("begin");
  try {
    const walletRes = await pool.query(
      "select * from wallets where user_id = $1 and currency = $2 for update",
      [userId, currency]
    );
    const wallet = walletRes.rows[0];
    if (!wallet) {
      throw new Error("WALLET_NOT_FOUND");
    }
    const newBalance = Number(wallet.available_balance) + amount;
    await pool.query(
      "update wallets set available_balance = $1, updated_at = now() where id = $2",
      [newBalance, wallet.id]
    );
    await pool.query(
      `
        insert into transactions (wallet_id, type, amount, balance_after, meta)
        values ($1, $2, $3, $4, $5)
      `,
      [wallet.id, "deposit", amount, newBalance, { source: "demo" }]
    );
    await pool.query("commit");
  } catch (err) {
    await pool.query("rollback");
    throw err;
  }
}

export async function lockFunds(
  userId: number,
  amount: number,
  dealId: number,
  currency = "USDT"
) {
  await pool.query("begin");
  try {
    const walletRes = await pool.query(
      "select * from wallets where user_id = $1 and currency = $2 for update",
      [userId, currency]
    );
    const wallet = walletRes.rows[0];
    if (!wallet) {
      throw new Error("WALLET_NOT_FOUND");
    }

    const available = Number(wallet.available_balance);
    const locked = Number(wallet.locked_balance);

    if (available < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const newAvailable = available - amount;
    const newLocked = locked + amount;

    await pool.query(
      "update wallets set available_balance = $1, locked_balance = $2, updated_at = now() where id = $3",
      [newAvailable, newLocked, wallet.id]
    );

    await pool.query(
      `
        insert into transactions (wallet_id, deal_id, type, amount, balance_after, meta)
        values ($1, $2, $3, $4, $5, $6)
      `,
      [
        wallet.id,
        dealId,
        "lock",
        amount,
        newAvailable,
        { dealId, locked: true },
      ]
    );

    await pool.query("commit");
    return { success: true };
  } catch (err) {
    await pool.query("rollback");
    throw err;
  }
}

export async function unlockFunds(
  userId: number,
  amount: number,
  dealId: number,
  currency = "USDT"
) {
  await pool.query("begin");
  try {
    const walletRes = await pool.query(
      "select * from wallets where user_id = $1 and currency = $2 for update",
      [userId, currency]
    );
    const wallet = walletRes.rows[0];
    if (!wallet) {
      throw new Error("WALLET_NOT_FOUND");
    }

    const available = Number(wallet.available_balance);
    const locked = Number(wallet.locked_balance);

    if (locked < amount) {
      throw new Error("INSUFFICIENT_LOCKED_FUNDS");
    }

    const newAvailable = available + amount;
    const newLocked = locked - amount;

    await pool.query(
      "update wallets set available_balance = $1, locked_balance = $2, updated_at = now() where id = $3",
      [newAvailable, newLocked, wallet.id]
    );

    await pool.query(
      `
        insert into transactions (wallet_id, deal_id, type, amount, balance_after, meta)
        values ($1, $2, $3, $4, $5, $6)
      `,
      [
        wallet.id,
        dealId,
        "unlock",
        amount,
        newAvailable,
        { dealId, unlocked: true },
      ]
    );

    await pool.query("commit");
    return { success: true };
  } catch (err) {
    await pool.query("rollback");
    throw err;
  }
}

export async function transferFunds(
  fromUserId: number,
  toUserId: number,
  amount: number,
  dealId: number,
  currency = "USDT"
) {
  await pool.query("begin");
  try {
    // Lock both wallets
    const fromWalletRes = await pool.query(
      "select * from wallets where user_id = $1 and currency = $2 for update",
      [fromUserId, currency]
    );
    const toWalletRes = await pool.query(
      "select * from wallets where user_id = $1 and currency = $2 for update",
      [toUserId, currency]
    );

    const fromWallet = fromWalletRes.rows[0];
    const toWallet = toWalletRes.rows[0];

    if (!fromWallet || !toWallet) {
      throw new Error("WALLET_NOT_FOUND");
    }

    const fromLocked = Number(fromWallet.locked_balance);
    if (fromLocked < amount) {
      throw new Error("INSUFFICIENT_LOCKED_FUNDS");
    }

    // Unlock from buyer's wallet
    const newFromLocked = fromLocked - amount;
    await pool.query(
      "update wallets set locked_balance = $1, updated_at = now() where id = $2",
      [newFromLocked, fromWallet.id]
    );

    // Add to seller's wallet
    const toAvailable = Number(toWallet.available_balance);
    const newToAvailable = toAvailable + amount;

    await pool.query(
      "update wallets set available_balance = $1, updated_at = now() where id = $2",
      [newToAvailable, toWallet.id]
    );

    // Create transactions
    await pool.query(
      `
        insert into transactions (wallet_id, deal_id, type, amount, balance_after, meta)
        values ($1, $2, $3, $4, $5, $6)
      `,
      [
        fromWallet.id,
        dealId,
        "deal_payment",
        -amount,
        Number(fromWallet.available_balance),
        { dealId, toUserId },
      ]
    );

    await pool.query(
      `
        insert into transactions (wallet_id, deal_id, type, amount, balance_after, meta)
        values ($1, $2, $3, $4, $5, $6)
      `,
      [
        toWallet.id,
        dealId,
        "deal_receive",
        amount,
        newToAvailable,
        { dealId, fromUserId },
      ]
    );

    await pool.query("commit");
    return { success: true };
  } catch (err) {
    await pool.query("rollback");
    throw err;
  }
}

