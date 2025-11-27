import { Router } from "express";
import { z } from "zod";
import { verifyTelegramInitData, parseTelegramUser } from "../telegramAuth";
import { upsertUserFromTelegram } from "../services/users";
import { signUserToken } from "../middleware/auth";
import { config } from "../config";

const router = Router();

const authSchema = z.object({
  initData: z.string().min(1),
});

router.post("/auth/telegram", async (req, res) => {
  if (!config.dbEnabled) {
    return res.status(503).json({ error: "DB_DISABLED" });
  }
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }

  const { initData } = parsed.data;
  const verification = verifyTelegramInitData(initData);
  if (!verification.ok || !verification.data) {
    return res.status(401).json({ error: "INIT_DATA_INVALID" });
  }

  try {
    const userPayload = parseTelegramUser(verification.data);
    const user = await upsertUserFromTelegram(userPayload);
    const token = signUserToken(user.id);
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
  } catch {
    return res.status(500).json({ error: "AUTH_ERROR" });
  }
});

router.get("/bot/info", async (_req, res) => {
  if (!config.botToken) {
    return res.status(503).json({ error: "BOT_NOT_CONFIGURED" });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`);
    const data = await response.json();
    if (data.ok) {
      return res.json({
        username: data.result.username,
        firstName: data.result.first_name,
      });
    }
    return res.status(500).json({ error: "BOT_INFO_ERROR" });
  } catch {
    return res.status(500).json({ error: "BOT_INFO_ERROR" });
  }
});

export default router;
