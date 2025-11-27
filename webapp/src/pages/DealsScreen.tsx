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
}

export const DealsScreen: React.FC = () => {
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
      {deals.length === 0 && <div>Пока нет сделок</div>}
      <ul className="list">
        {deals.map((d) => (
          <li key={d.id}>
            <div>
              <b>{d.title}</b>
            </div>
            <div>
              {d.amount} {d.currency} · {d.status}
            </div>
            <div className="muted">Код: {d.code}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

