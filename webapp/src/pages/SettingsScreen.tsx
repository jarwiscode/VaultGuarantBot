import React, { useEffect, useState } from "react";
import { api } from "../api";

interface LoyaltySummary {
  points: number;
  rewards: any[];
  redemptions: any[];
}

export const SettingsScreen: React.FC = () => {
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);

  useEffect(() => {
    async function load() {
      const res = await api.get("/app/me/loyalty");
      setLoyalty(res.data);
    }
    load();
  }, []);

  return (
    <div>
      <h2>Настройки и бонусы</h2>
      <div className="card">
        <div>
          Бонусные баллы: <b>{loyalty?.points ?? 0}</b>
        </div>
        <div className="muted mt-1">
          В будущем: обмен на скидку комиссии, подарки, Premium и т.п.
        </div>
      </div>
    </div>
  );
};

