"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const telegramAuth_1 = require("../telegramAuth");
const users_1 = require("../services/users");
const auth_1 = require("../middleware/auth");
const config_1 = require("../config");
const router = (0, express_1.Router)();
const authSchema = zod_1.z.object({
    initData: zod_1.z.string().min(1),
});
router.post("/auth/telegram", async (req, res) => {
    if (!config_1.config.dbEnabled) {
        return res.status(503).json({ error: "DB_DISABLED" });
    }
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "INVALID_BODY" });
    }
    const { initData } = parsed.data;
    const verification = (0, telegramAuth_1.verifyTelegramInitData)(initData);
    if (!verification.ok || !verification.data) {
        return res.status(401).json({ error: "INIT_DATA_INVALID" });
    }
    try {
        const userPayload = (0, telegramAuth_1.parseTelegramUser)(verification.data);
        const user = await (0, users_1.upsertUserFromTelegram)(userPayload);
        const token = (0, auth_1.signUserToken)(user.id);
        return res.json({
            token,
            user: {
                id: user.id,
                telegramId: user.telegram_id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                language: user.language,
                loyaltyPoints: user.loyalty_points,
            },
        });
    }
    catch {
        return res.status(500).json({ error: "AUTH_ERROR" });
    }
});
exports.default = router;
