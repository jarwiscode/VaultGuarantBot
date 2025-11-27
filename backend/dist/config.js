"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: Number(process.env.PORT) || 3000,
    botToken: process.env.BOT_TOKEN || "",
    webAppUrl: process.env.WEBAPP_URL || "",
    databaseUrl: process.env.DATABASE_URL || "",
    dbEnabled: Boolean(process.env.DATABASE_URL),
    adminToken: process.env.ADMIN_TOKEN || "",
};
