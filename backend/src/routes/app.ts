import { Router } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getWalletWithTransactions, fakeDeposit } from "../services/wallet";
import {
  createDealSchema,
  createDeal,
  listUserDeals,
  getDealById,
  updateDealStatus,
} from "../services/deals";
import { getLoyaltySummary } from "../services/loyalty";
import { listActiveGifts } from "../services/market";
import { config } from "../config";
import { getUserById } from "../services/users";

const walletOrderSchema = z.object({
  amount: z.string().min(1),
  currencyCode: z.string().min(1),
  description: z.string().min(5).max(100),
  externalId: z.string().optional(),
});

const router = Router();

router.use(authMiddleware);

router.get("/me/wallet", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const data = await getWalletWithTransactions(req.userId);
  return res.json(data);
});

router.post("/me/wallet/deposit-demo", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const bodySchema = z.object({ amount: z.number().positive() });
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }
  await fakeDeposit(req.userId, parsed.data.amount);
  const data = await getWalletWithTransactions(req.userId);
  return res.json(data);
});

router.post("/deals", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const parsed = createDealSchema.safeParse({
    ...req.body,
    initiatorId: req.userId,
  });
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }
  const deal = await createDeal(parsed.data);
  return res.json(deal);
});

router.get("/deals", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const deals = await listUserDeals(req.userId);
  return res.json(deals);
});

router.get("/deals/:id", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const id = Number(req.params.id);
  const deal = await getDealById(id);
  if (!deal) return res.status(404).json({ error: "NOT_FOUND" });
  return res.json(deal);
});

router.post("/deals/:id/status", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const id = Number(req.params.id);
  const bodySchema = z.object({
    status: z.enum([
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
  const deal = await updateDealStatus(id, parsed.data.status);
  if (!deal) return res.status(404).json({ error: "NOT_FOUND" });
  return res.json(deal);
});

router.get("/me/loyalty", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const data = await getLoyaltySummary(req.userId);
  return res.json(data);
});

router.get("/market/gifts", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  const gifts = await listActiveGifts();
  return res.json(gifts);
});

router.post("/wallet/order", async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: "UNAUTHORIZED" });
  if (!config.walletPayApiKey) {
    return res.status(503).json({ error: "WALLET_PAY_NOT_CONFIGURED" });
  }

  const parsed = walletOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "INVALID_BODY" });
  }

  const user = await getUserById(req.userId);
  if (!user) {
    return res.status(404).json({ error: "USER_NOT_FOUND" });
  }

  try {
    const externalId =
      parsed.data.externalId ??
      `user-${user.id}-${Date.now().toString(36).toUpperCase()}`;

    const body = {
      amount: {
        amount: parsed.data.amount,
        currencyCode: parsed.data.currencyCode,
      },
      description: parsed.data.description,
      returnUrl: config.walletPayReturnUrl || null,
      failReturnUrl: config.walletPayReturnUrl || null,
      timeoutSeconds: 600,
      externalId,
      customerTelegramUserId: Number(user.telegram_id),
    };

    const response = await fetch(
      "https://pay.wallet.tg/wpay/store-api/v1/order/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Wpay-Store-Api-Key": config.walletPayApiKey,
        },
        body: JSON.stringify(body),
      }
    );

    const json = (await response.json()) as {
      status: string;
      message?: string;
      data?: { id: string; directPayLink?: string | null };
    };

    if (
      json.status !== "SUCCESS" &&
      json.status !== "ALREADY" &&
      !json.data
    ) {
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
  } catch (err) {
    return res.status(502).json({ error: "WALLET_PAY_REQUEST_FAILED" });
  }
});

export default router;
