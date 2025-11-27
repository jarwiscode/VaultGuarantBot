"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWallet = getWallet;
exports.getWalletWithTransactions = getWalletWithTransactions;
exports.fakeDeposit = fakeDeposit;
const db_1 = require("../db");
async function getWallet(userId, currency = "USDT") {
    const res = await db_1.pool.query("select * from wallets where user_id = $1 and currency = $2", [userId, currency]);
    return res.rows[0];
}
async function getWalletWithTransactions(userId, currency = "USDT") {
    const walletRes = await db_1.pool.query("select * from wallets where user_id = $1 and currency = $2", [userId, currency]);
    const wallet = walletRes.rows[0];
    if (!wallet)
        return null;
    const txRes = await db_1.pool.query("select * from transactions where wallet_id = $1 order by created_at desc limit 50", [wallet.id]);
    return { wallet, transactions: txRes.rows };
}
async function fakeDeposit(userId, amount, currency = "USDT") {
    await db_1.pool.query("begin");
    try {
        const walletRes = await db_1.pool.query("select * from wallets where user_id = $1 and currency = $2 for update", [userId, currency]);
        const wallet = walletRes.rows[0];
        if (!wallet) {
            throw new Error("WALLET_NOT_FOUND");
        }
        const newBalance = Number(wallet.available_balance) + amount;
        await db_1.pool.query("update wallets set available_balance = $1, updated_at = now() where id = $2", [newBalance, wallet.id]);
        await db_1.pool.query(`
        insert into transactions (wallet_id, type, amount, balance_after, meta)
        values ($1, $2, $3, $4, $5)
      `, [wallet.id, "deposit", amount, newBalance, { source: "demo" }]);
        await db_1.pool.query("commit");
    }
    catch (err) {
        await db_1.pool.query("rollback");
        throw err;
    }
}
