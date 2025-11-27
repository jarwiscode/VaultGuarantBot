"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const wallet_1 = require("../services/wallet");
const deals_1 = require("../services/deals");
const loyalty_1 = require("../services/loyalty");
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
exports.default = router;
