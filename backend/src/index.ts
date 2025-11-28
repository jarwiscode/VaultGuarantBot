import express from "express";
import cors from "cors";
import { json } from "body-parser";
import { config } from "./config";
import { initDb } from "./db";
import publicRoutes from "./routes/public";
import appRoutes from "./routes/app";
import adminRoutes from "./routes/admin";
import { createBot } from "./bot";
import { setBotInstance } from "./services/notifications";

async function main() {
  if (config.dbEnabled) {
    await initDb();
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      "[startup] DATABASE_URL is not set, starting without DB (API auth/wallet/deals will be unavailable)."
    );
  }

  const app = express();
  app.use(
    cors({
      origin: "*",
    })
  );
  app.use(json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", publicRoutes);
  app.use("/api/app", appRoutes);
  app.use("/api/admin", adminRoutes);

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${config.port}`);
  });

  if (config.botToken) {
    const bot = createBot();
    setBotInstance(bot);
    bot.start();
    // eslint-disable-next-line no-console
    console.log("Telegram bot started (long polling).");
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error:", err);
  process.exit(1);
});
