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

