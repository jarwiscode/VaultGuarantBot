import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loader } from "../components/Loader";

interface DealDetail {
  id: number;
  code: string;
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  status: string;
  buyer_id: number;
  seller_id: number;
  initiator_id: number;
  commission_percent: number;
  commission_amount: number;
  created_at: string;
  updated_at: string;
}

interface DealDetailScreenProps {
  dealId: number;
  currentUserId: number;
  onBack: () => void;
}

function isActiveDeal(status: string): boolean {
  return status === "pending" || status === "accepted" || status === "funded" || status === "item_transferred" || status === "item_received";
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Ожидает принятия";
    case "accepted":
      return "Принята, средства заморожены";
    case "item_transferred":
      return "Предмет передан";
    case "item_received":
      return "Предмет получен";
    case "completed":
      return "Завершена";
    case "cancelled":
      return "Отменена";
    case "dispute":
      return "Спор";
    default:
      return status;
  }
}

export const DealDetailScreen: React.FC<DealDetailScreenProps> = ({
  dealId,
  currentUserId,
  onBack,
}) => {
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadDeal() {
    try {
      const dealRes = await api.get(`/app/deals/${dealId}`);
      setDeal(dealRes.data);
    } catch (error) {
      console.error("Failed to load deal", error);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await loadDeal();
      setLoading(false);
    }
    load();
  }, [dealId]);

  useEffect(() => {
    async function loadBotInfo() {
      try {
        const res = await api.get("/bot/info");
        setBotUsername(res.data.username);
      } catch (error) {
        console.error("Failed to load bot info", error);
      }
    }
    loadBotInfo();
  }, []);

  const handleShare = async () => {
    if (!deal || !botUsername) return;

    setSharing(true);
    try {
      const shareLink = `https://t.me/${botUsername}?start=deal_${deal.code}`;
      const shareText = `Ссылка на сделку "${deal.title}": ${shareLink}`;
      
      // Copy link to clipboard first
      await navigator.clipboard.writeText(shareLink);
      
      // Try to use tg://share protocol to open share dialog
      // This works better in Telegram WebApp context
      const tgShareUrl = `tg://share?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
      
      // Try to use Telegram WebApp API
      if (window.Telegram?.WebApp?.openTelegramLink) {
        try {
          window.Telegram.WebApp.openTelegramLink(tgShareUrl);
          setTimeout(() => setSharing(false), 300);
          return;
        } catch (e) {
          // If tg://share doesn't work, try tg://msg
          const tgMsgUrl = `tg://msg?text=${encodeURIComponent(shareText)}`;
          try {
            window.Telegram.WebApp.openTelegramLink(tgMsgUrl);
            setTimeout(() => setSharing(false), 300);
            return;
          } catch (e2) {
            // Fall through to clipboard notification
          }
        }
      }
      
      // Fallback: show notification that link is copied
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Ссылка скопирована! Теперь вы можете вставить её в любой чат.");
      } else {
        alert("Ссылка скопирована! Теперь вы можете вставить её в любой чат.");
      }
      setSharing(false);
    } catch (error) {
      console.error("Failed to share", error);
      // Even if sharing fails, try to copy link
      try {
        const shareLink = `https://t.me/${botUsername}?start=deal_${deal.code}`;
        await navigator.clipboard.writeText(shareLink);
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert("Ссылка скопирована в буфер обмена!");
        } else {
          alert("Ссылка скопирована в буфер обмена!");
        }
      } catch (e) {
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert("Ошибка при создании ссылки");
        } else {
          alert("Ошибка при создании ссылки");
        }
      }
      setSharing(false);
    }
  };

  const handleAccept = async () => {
    if (!deal) return;
    setActionLoading(true);
    try {
      await api.post(`/app/deals/${dealId}/accept`);
      await loadDeal();
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Сделка принята! Средства заморожены на вашем счету.");
      }
    } catch (error: any) {
      let message = "Ошибка при принятии сделки";
      if (error.response?.data?.error === "INSUFFICIENT_FUNDS") {
        message = "Недостаточно средств на вашем счету";
      } else if (error.response?.data?.error === "CANNOT_ACCEPT_OWN_DEAL") {
        message = "Вы не можете принять свою собственную сделку";
      }
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(message);
      } else {
        alert(message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!deal) return;
    setActionLoading(true);
    try {
      await api.post(`/app/deals/${dealId}/transfer`);
      await loadDeal();
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Статус обновлен: предмет передан.");
      }
    } catch (error) {
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Ошибка при обновлении статуса");
      } else {
        alert("Ошибка при обновлении статуса");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!deal) return;
    setActionLoading(true);
    try {
      await api.post(`/app/deals/${dealId}/receive`);
      await loadDeal();
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Сделка завершена! Средства переведены продавцу.");
      }
    } catch (error) {
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Ошибка при завершении сделки");
      } else {
        alert("Ошибка при завершении сделки");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!deal) return;
    if (!confirm("Вы уверены, что хотите отменить сделку?")) return;
    
    setActionLoading(true);
    try {
      await api.post(`/app/deals/${dealId}/cancel`);
      await loadDeal();
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Сделка отменена.");
      }
    } catch (error) {
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Ошибка при отмене сделки");
      } else {
        alert("Ошибка при отмене сделки");
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader text="Загрузка сделки..." />;
  if (!deal) return <div className="center">Сделка не найдена</div>;

  const isBuyer = deal.buyer_id === currentUserId;
  const isSeller = deal.seller_id === currentUserId;
  const isInitiator = deal.initiator_id === currentUserId;
  const active = isActiveDeal(deal.status);
  
  // Determine what actions are available
  // Anyone except initiator can accept pending deal (becomes buyer)
  const canAccept = !isInitiator && deal.status === "pending";
  // Seller (initiator) can mark as transferred after acceptance
  const canTransfer = isSeller && deal.status === "accepted";
  // Buyer can mark as received after transfer
  const canReceive = isBuyer && deal.status === "item_transferred";
  // Initiator or participant can cancel if not completed
  const canCancel = (isInitiator || isBuyer || isSeller) && deal.status !== "completed" && deal.status !== "cancelled";

  return (
    <div>
      <div className="deal-detail-header">
        <button className="back-button" onClick={onBack}>
          ← Назад
        </button>
        <h2>Сделка {deal.code}</h2>
        {active && botUsername && (
          <button
            className="share-button"
            onClick={handleShare}
            disabled={sharing}
          >
            {sharing ? "..." : "📤"}
          </button>
        )}
      </div>

      <div className="card">
        <div className="deal-detail-section">
          <div className="deal-detail-label">Название</div>
          <div className="deal-detail-value">{deal.title}</div>
        </div>

        {deal.description && (
          <div className="deal-detail-section">
            <div className="deal-detail-label">Описание</div>
            <div className="deal-detail-value">{deal.description}</div>
          </div>
        )}

        <div className="deal-detail-section">
          <div className="deal-detail-label">Сумма</div>
          <div className="deal-detail-value">
            {deal.amount} {deal.currency}
          </div>
        </div>

        {deal.commission_amount > 0 && (
          <div className="deal-detail-section">
            <div className="deal-detail-label">Комиссия</div>
            <div className="deal-detail-value">
              {deal.commission_amount} {deal.currency} ({deal.commission_percent}%)
            </div>
          </div>
        )}

        <div className="deal-detail-section">
          <div className="deal-detail-label">Статус</div>
          <div className="deal-detail-value">{getStatusLabel(deal.status)}</div>
        </div>
      </div>

      <div className="card">
        <div className="deal-detail-section">
          <div className="deal-detail-label">
            {isSeller ? "Вы продавец" : "Продавец"}
          </div>
          <div className="deal-detail-value">
            {isSeller ? "Вы" : `ID: ${deal.seller_id}`}
          </div>
        </div>

        {deal.status !== "pending" ? (
          <div className="deal-detail-section">
            <div className="deal-detail-label">
              {isBuyer ? "Вы покупатель" : "Покупатель"}
            </div>
            <div className="deal-detail-value">
              {isBuyer ? "Вы" : `ID: ${deal.buyer_id}`}
            </div>
          </div>
        ) : (
          <div className="deal-detail-section">
            <div className="deal-detail-label">Покупатель</div>
            <div className="deal-detail-value muted">Ожидает принятия сделки</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="deal-detail-section">
          <div className="deal-detail-label">Создана</div>
          <div className="deal-detail-value">
            {new Date(deal.created_at).toLocaleString("ru-RU")}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {(canAccept || canTransfer || canReceive || canCancel) && (
        <div className="card">
          {canAccept && (
            <button
              className="primary"
              onClick={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? "Обработка..." : "Принять сделку"}
            </button>
          )}
          {canTransfer && (
            <button
              className="primary mt-2"
              onClick={handleTransfer}
              disabled={actionLoading}
            >
              {actionLoading ? "Обработка..." : "Передал предмет"}
            </button>
          )}
          {canReceive && (
            <button
              className="primary mt-2"
              onClick={handleReceive}
              disabled={actionLoading}
            >
              {actionLoading ? "Обработка..." : "Получил предмет"}
            </button>
          )}
          {canCancel && (
            <button
              className="primary mt-2"
              onClick={handleCancel}
              disabled={actionLoading}
              style={{ background: "#f87171" }}
            >
              {actionLoading ? "Обработка..." : "Отменить сделку"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

