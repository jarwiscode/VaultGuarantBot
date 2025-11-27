"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const config_1 = require("./config");
const db_1 = require("./db");
const public_1 = __importDefault(require("./routes/public"));
const app_1 = __importDefault(require("./routes/app"));
const admin_1 = __importDefault(require("./routes/admin"));
const bot_1 = require("./bot");
async function main() {
    if (config_1.config.dbEnabled) {
        await (0, db_1.initDb)();
    }
    else {
        // eslint-disable-next-line no-console
        console.warn("[startup] DATABASE_URL is not set, starting without DB (API auth/wallet/deals will be unavailable).");
    }
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: "*",
    }));
    app.use((0, body_parser_1.json)());
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.use("/api", public_1.default);
    app.use("/api/app", app_1.default);
    app.use("/api/admin", admin_1.default);
    app.listen(config_1.config.port, () => {
        // eslint-disable-next-line no-console
        console.log(`API listening on http://localhost:${config_1.config.port}`);
    });
    if (config_1.config.botToken) {
        const bot = (0, bot_1.createBot)();
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
