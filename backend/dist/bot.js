"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBot = createBot;
const grammy_1 = require("grammy");
const config_1 = require("./config");
const users_1 = require("./services/users");
function createBot() {
    const bot = new grammy_1.Bot(config_1.config.botToken);
    bot.command("start", async (ctx) => {
        const tgUser = ctx.from;
        if (!tgUser)
            return;
        if (config_1.config.dbEnabled) {
            await (0, users_1.upsertUserFromTelegram)({
                id: tgUser.id,
                username: tgUser.username ?? undefined,
                first_name: tgUser.first_name ?? undefined,
                last_name: tgUser.last_name ?? undefined,
                language_code: tgUser.language_code ?? undefined,
            });
        }
        const keyboard = new grammy_1.InlineKeyboard().webApp("🚀 Открыть мини‑приложение", config_1.config.webAppUrl);
        await ctx.reply("Добро пожаловать в эскроу‑гарант сервис.\nНажмите кнопку ниже, чтобы открыть мини‑приложение.", { reply_markup: keyboard });
    });
    bot.catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Bot error:", err.error);
    });
    return bot;
}
