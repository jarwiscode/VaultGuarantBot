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
  return status === "pending" || status === "accepted" || status === "funded";
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const dealRes = await api.get(`/app/deals/${dealId}`);
        setDeal(dealRes.data);
      } catch (error) {
        console.error("Failed to load deal", error);
      } finally {
        setLoading(false);
      }
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
      
      // Try to use Telegram WebApp API to open link
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(shareLink);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareLink);
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert("Ссылка скопирована в буфер обмена!");
        } else {
          alert("Ссылка скопирована в буфер обмена!");
        }
      }
    } catch (error) {
      console.error("Failed to share", error);
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert("Ошибка при создании ссылки");
      } else {
        alert("Ошибка при создании ссылки");
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <Loader text="Загрузка сделки..." />;
  if (!deal) return <div className="center">Сделка не найдена</div>;

  const isBuyer = deal.buyer_id === currentUserId;
  const isSeller = deal.seller_id === currentUserId;
  const active = isActiveDeal(deal.status);

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
          <div className="deal-detail-value">{deal.status}</div>
        </div>
      </div>

      <div className="card">
        <div className="deal-detail-section">
          <div className="deal-detail-label">
            {isBuyer ? "Вы покупатель" : "Покупатель"}
          </div>
          <div className="deal-detail-value">
            {isBuyer ? "Вы" : `ID: ${deal.buyer_id}`}
          </div>
        </div>

        <div className="deal-detail-section">
          <div className="deal-detail-label">
            {isSeller ? "Вы продавец" : "Продавец"}
          </div>
          <div className="deal-detail-value">
            {isSeller ? "Вы" : `ID: ${deal.seller_id}`}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="deal-detail-section">
          <div className="deal-detail-label">Создана</div>
          <div className="deal-detail-value">
            {new Date(deal.created_at).toLocaleString("ru-RU")}
          </div>
        </div>
      </div>
    </div>
  );
};

