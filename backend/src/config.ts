import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  botToken: process.env.BOT_TOKEN || "",
  webAppUrl: process.env.WEBAPP_URL || "",
  databaseUrl: process.env.DATABASE_URL || "",
  dbEnabled: Boolean(process.env.DATABASE_URL),
  adminToken: process.env.ADMIN_TOKEN || "",
};
