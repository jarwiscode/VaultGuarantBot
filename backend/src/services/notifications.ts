import { Bot } from "grammy";
import { config } from "../config";
import { getUserById } from "./users";

let botInstance: Bot | null = null;

export function setBotInstance(bot: Bot) {
  botInstance = bot;
}

export async function sendDealNotification(
  telegramId: number,
  message: string
) {
  if (!config.botToken || !botInstance) {
    console.warn("Bot not initialized, skipping notification");
    return;
  }

  try {
    await botInstance.api.sendMessage(telegramId, message, {
      parse_mode: "HTML",
    });
  } catch (error: any) {
    // User might have blocked the bot or other error
    console.error(`Failed to send notification to ${telegramId}:`, error.message);
  }
}

export async function notifyDealAccepted(deal: any) {
  const buyer = await getUserById(deal.buyer_id);
  const seller = await getUserById(deal.seller_id);

  if (buyer && buyer.telegram_id) {
    await sendDealNotification(
      Number(buyer.telegram_id),
      `✅ <b>Сделка принята</b>\n\n` +
        `Сделка <b>${deal.code}</b> "${deal.title}" была принята.\n` +
        `Сумма: ${deal.amount} ${deal.currency}\n` +
        `Ваши средства заморожены до завершения сделки.`
    );
  }

  if (seller && seller.telegram_id) {
    await sendDealNotification(
      Number(seller.telegram_id),
      `✅ <b>Сделка принята</b>\n\n` +
        `Сделка <b>${deal.code}</b> "${deal.title}" была принята покупателем.\n` +
        `Сумма: ${deal.amount} ${deal.currency}\n` +
        `Теперь вы можете передать предмет и нажать "Передал предмет".`
    );
  }
}

export async function notifyItemTransferred(deal: any) {
  const buyer = await getUserById(deal.buyer_id);
  const seller = await getUserById(deal.seller_id);

  if (buyer && buyer.telegram_id) {
    await sendDealNotification(
      Number(buyer.telegram_id),
      `📦 <b>Предмет передан</b>\n\n` +
        `Продавец отметил, что предмет по сделке <b>${deal.code}</b> "${deal.title}" передан.\n` +
        `Пожалуйста, проверьте получение и нажмите "Получил предмет".`
    );
  }

  if (seller && seller.telegram_id) {
    await sendDealNotification(
      Number(seller.telegram_id),
      `📦 <b>Статус обновлен</b>\n\n` +
        `Вы отметили передачу предмета по сделке <b>${deal.code}</b> "${deal.title}".\n` +
        `Ожидайте подтверждения получения от покупателя.`
    );
  }
}

export async function notifyItemReceived(deal: any) {
  const buyer = await getUserById(deal.buyer_id);
  const seller = await getUserById(deal.seller_id);

  if (buyer && buyer.telegram_id) {
    await sendDealNotification(
      Number(buyer.telegram_id),
      `✅ <b>Сделка завершена</b>\n\n` +
        `Сделка <b>${deal.code}</b> "${deal.title}" успешно завершена.\n` +
        `Средства переведены продавцу.`
    );
  }

  if (seller && seller.telegram_id) {
    await sendDealNotification(
      Number(seller.telegram_id),
      `💰 <b>Сделка завершена</b>\n\n` +
        `Покупатель подтвердил получение предмета по сделке <b>${deal.code}</b> "${deal.title}".\n` +
        `Средства ${deal.amount} ${deal.currency} переведены на ваш счет.`
    );
  }
}

export async function notifyDealCancelled(deal: any, cancelledByUserId: number) {
  const buyer = await getUserById(deal.buyer_id);
  const seller = await getUserById(deal.seller_id);
  const cancelledBy = await getUserById(cancelledByUserId);

  const cancelledByName = cancelledBy
    ? `${cancelledBy.first_name || ""} ${cancelledBy.last_name || ""}`.trim() || "Участник"
    : "Участник";

  if (buyer?.telegram_id && buyer.id !== cancelledByUserId) {
    await sendDealNotification(
      buyer.telegram_id,
      `❌ <b>Сделка отменена</b>\n\n` +
        `Сделка <b>${deal.code}</b> "${deal.title}" была отменена ${cancelledByName}.\n` +
        `Ваши средства разморожены и возвращены на счет.`
    );
  }

  if (seller?.telegram_id && seller.id !== cancelledByUserId) {
    await sendDealNotification(
      seller.telegram_id,
      `❌ <b>Сделка отменена</b>\n\n` +
        `Сделка <b>${deal.code}</b> "${deal.title}" была отменена ${cancelledByName}.\n` +
        `Сделка закрыта.`
    );
  }
}

