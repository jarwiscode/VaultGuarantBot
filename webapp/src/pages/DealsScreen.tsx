import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loader } from "../components/Loader";

interface Deal {
  id: number;
  code: string;
  title: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
}

type DealStatus = "pending" | "accepted" | "rejected" | "funded" | "completed" | "cancelled" | "dispute";

function getStatusInfo(status: string): { label: string; color: string; bgColor: string } {
  switch (status as DealStatus) {
    case "pending":
    case "accepted":
    case "funded":
      return {
        label: "Активный",
        color: "#4ade80",
        bgColor: "rgba(74, 222, 128, 0.15)",
      };
    case "completed":
      return {
        label: "Завершен",
        color: "#9ca3af",
        bgColor: "rgba(156, 163, 175, 0.15)",
      };
    case "cancelled":
    case "rejected":
      return {
        label: "Отменен",
        color: "#f87171",
        bgColor: "rgba(248, 113, 113, 0.15)",
      };
    case "dispute":
      return {
        label: "Спор",
        color: "#fbbf24",
        bgColor: "rgba(251, 191, 36, 0.15)",
      };
    default:
      return {
        label: status,
        color: "#9ca3af",
        bgColor: "rgba(156, 163, 175, 0.15)",
      };
  }
}

function isActiveDeal(status: string): boolean {
  return status === "pending" || status === "accepted" || status === "funded";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface DealsScreenProps {
  onDealClick?: (dealId: number) => void;
}

export const DealsScreen: React.FC<DealsScreenProps> = ({ onDealClick }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.get("/app/deals");
    setDeals(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader text="Сделки..." />;

  return (
    <div>
      <h2>Мои сделки</h2>
      {deals.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">Пока нет сделок</div>
        </div>
      )}
      <ul className="list">
        {deals.map((d) => {
          const statusInfo = getStatusInfo(d.status);
          const active = isActiveDeal(d.status);
          const showDate = d.status === "completed" || d.status === "cancelled" || d.status === "rejected";

          return (
            <li
              key={d.id}
              className={active && onDealClick ? "deal-item-clickable" : ""}
              onClick={() => active && onDealClick && onDealClick(d.id)}
            >
              <div className="deal-item-header">
                <div className="deal-item-title">{d.title}</div>
                <div
                  className="deal-status-badge"
                  style={{
                    color: statusInfo.color,
                    backgroundColor: statusInfo.bgColor,
                  }}
                >
                  {statusInfo.label}
                </div>
              </div>
              <div className="deal-item-info">
                {d.amount} {d.currency}
              </div>
              <div className="deal-item-footer">
                <span className="muted">Код: {d.code}</span>
                {showDate && (
                  <span className="muted deal-date">{formatDate(d.created_at)}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

