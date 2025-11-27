import { Bot, InlineKeyboard } from "grammy";
import { config } from "./config";
import { upsertUserFromTelegram } from "./services/users";

export function createBot() {
  const bot = new Bot(config.botToken);

  bot.command("start", async (ctx) => {
    const tgUser = ctx.from;
    if (!tgUser) return;
    if (config.dbEnabled) {
      await upsertUserFromTelegram({
        id: tgUser.id,
        username: tgUser.username ?? undefined,
        first_name: tgUser.first_name ?? undefined,
        last_name: tgUser.last_name ?? undefined,
        language_code: tgUser.language_code ?? undefined,
      });
    }

    // Get start parameter from command (e.g., /start deal_ABC123)
    const startParam = typeof ctx.match === "string" ? ctx.match : undefined;
    const webAppUrl = startParam
      ? `${config.webAppUrl}?start_param=${encodeURIComponent(startParam)}`
      : config.webAppUrl;

    const keyboard = new InlineKeyboard().webApp(
      "🚀 Открыть мини‑приложение",
      webAppUrl
    );

    if (startParam && startParam.startsWith("deal_")) {
      await ctx.reply(
        "Вам прислали ссылку на сделку.\nНажмите кнопку ниже, чтобы открыть её в мини‑приложении.",
        { reply_markup: keyboard }
      );
    } else {
      await ctx.reply(
        "Добро пожаловать в эскроу‑гарант сервис.\nНажмите кнопку ниже, чтобы открыть мини‑приложение.",
        { reply_markup: keyboard }
      );
    }
  });

  bot.catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Bot error:", err.error);
  });

  return bot;
}
