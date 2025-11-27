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

export const ActivityScreen: React.FC = () => {
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

  if (loading) return <Loader text="Активность..." />;

  return (
    <div className="screen">
      <div className="toolbar">
        <button className="toolbar-pill">Guide</button>
        <div className="toolbar-badge">Activity</div>
      </div>

      <div className="segmented">
        <button className="segmented-btn active">Deals</button>
        <button className="segmented-btn">Wallet</button>
        <button className="segmented-btn">Perks</button>
      </div>

      {deals.length === 0 && (
        <div className="empty-state mt-3">
          <div className="empty-title">Пока нет активности</div>
          <div className="empty-subtitle">
            Новые сделки и операции появятся здесь.
          </div>
        </div>
      )}

      <ul className="activity-list">
        {deals.map((d) => (
          <li key={d.id} className="activity-row">
            <div className="activity-main">
              <div className="activity-title">{d.title || "Сделка"}</div>
              <div className="activity-sub">
                Код {d.code} · {new Date(d.created_at).toLocaleString()}
              </div>
            </div>
            <div className="activity-meta">
              <div className="activity-amount">
                {d.amount} {d.currency}
              </div>
              <div className={`activity-status status-${d.status}`}>
                {d.status}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

