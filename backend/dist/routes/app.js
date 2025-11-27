"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const wallet_1 = require("../services/wallet");
const deals_1 = require("../services/deals");
const loyalty_1 = require("../services/loyalty");
const market_1 = require("../services/market");
const config_1 = require("../config");
const users_1 = require("../services/users");
const walletOrderSchema = zod_1.z.object({
    amount: zod_1.z.string().min(1),
    currencyCode: zod_1.z.string().min(1),
    description: zod_1.z.string().min(5).max(100),
    externalId: zod_1.z.string().optional(),
});
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get("/me/wallet", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    const data = await (0, wallet_1.getWalletWithTransactions)(req.userId);
    return res.json(data);
});
router.post("/me/wallet/deposit-demo", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    const bodySchema = zod_1.z.object({ amount: zod_1.z.number().positive() });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "INVALID_BODY" });
    }
    await (0, wallet_1.fakeDeposit)(req.userId, parsed.data.amount);
    const data = await (0, wallet_1.getWalletWithTransactions)(req.userId);
    return res.json(data);
});
router.post("/deals", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    const parsed = deals_1.createDealSchema.safeParse({
        ...req.body,
        initiatorId: req.userId,
    });
    if (!parsed.success) {
        return res.status(400).json({ error: "INVALID_BODY" });
    }
    const deal = await (0, deals_1.createDeal)(parsed.data);
    return res.json(deal);
});
router.get("/deals", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    const deals = await (0, deals_1.listUserDeals)(req.userId);
    return res.json(deals);
});
router.get("/deals/:id", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    const id = Number(req.params.id);
    const deal = await (0, deals_1.getDealById)(id);
    if (!deal)
        return res.status(404).json({ error: "NOT_FOUND" });
    return res.json(deal);
});
router.post("/deals/:id/status", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    const id = Number(req.params.id);
    const bodySchema = zod_1.z.object({
        status: zod_1.z.enum([
            "accepted",
            "rejected",
            "funded",
            "completed",
            "cancelled",
            "dispute",
        ]),
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "INVALID_BODY" });
    }
    const deal = await (0, deals_1.updateDealStatus)(id, parsed.data.status);
    if (!deal)
        return res.status(404).json({ error: "NOT_FOUND" });
    return res.json(deal);
});
router.get("/me/loyalty", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    const data = await (0, loyalty_1.getLoyaltySummary)(req.userId);
    return res.json(data);
});
router.get("/market/gifts", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    const gifts = await (0, market_1.listActiveGifts)();
    return res.json(gifts);
});
router.post("/wallet/order", async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ error: "UNAUTHORIZED" });
    if (!config_1.config.walletPayApiKey) {
        return res.status(503).json({ error: "WALLET_PAY_NOT_CONFIGURED" });
    }
    const parsed = walletOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "INVALID_BODY" });
    }
    const user = await (0, users_1.getUserById)(req.userId);
    if (!user) {
        return res.status(404).json({ error: "USER_NOT_FOUND" });
    }
    try {
        const externalId = parsed.data.externalId ??
            `user-${user.id}-${Date.now().toString(36).toUpperCase()}`;
        const body = {
            amount: {
                amount: parsed.data.amount,
                currencyCode: parsed.data.currencyCode,
            },
            description: parsed.data.description,
            returnUrl: config_1.config.walletPayReturnUrl || null,
            failReturnUrl: config_1.config.walletPayReturnUrl || null,
            timeoutSeconds: 600,
            externalId,
            customerTelegramUserId: Number(user.telegram_id),
        };
        const response = await fetch("https://pay.wallet.tg/wpay/store-api/v1/order/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Wpay-Store-Api-Key": config_1.config.walletPayApiKey,
            },
            body: JSON.stringify(body),
        });
        const json = (await response.json());
        if (json.status !== "SUCCESS" &&
            json.status !== "ALREADY" &&
            !json.data) {
            return res.status(502).json({
                error: "WALLET_PAY_ERROR",
                status: json.status,
                message: json.message ?? "",
            });
        }
        return res.json({
            orderId: json.data?.id,
            status: json.status,
            directPayLink: json.data?.directPayLink,
        });
    }
    catch (err) {
        return res.status(502).json({ error: "WALLET_PAY_REQUEST_FAILED" });
    }
});
exports.default = router;
