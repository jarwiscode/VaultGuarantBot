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

export default router;

