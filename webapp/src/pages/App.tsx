import React, { useEffect, useState } from "react";
import { useTelegramAuth } from "../hooks/useTelegramAuth";
import { Loader } from "../components/Loader";
import { WalletScreen } from "./WalletScreen";
import { DealsScreen } from "./DealsScreen";
import { NewDealScreen } from "./NewDealScreen";
import { SettingsScreen } from "./SettingsScreen";

type Tab = "wallet" | "newDeal" | "deals" | "settings";

export const App: React.FC = () => {
  const { user, loading, error } = useTelegramAuth();
  const [tab, setTab] = useState<Tab>("wallet");

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
  }, []);

  if (loading) return <Loader text="Загрузка..." />;

  if (error === "NO_TELEGRAM_WEBAPP") {
    return (
      <div className="center">
        <div>Это мини‑приложение Telegram.</div>
        <div className="mt-1 muted">
          Откройте его по кнопке в Telegram‑боте.
        </div>
      </div>
    );
  }

  if (error || !user) return <div className="center">Ошибка авторизации</div>;

  return (
    <div className="app">
      <main className="content">
        {tab === "wallet" && <WalletScreen />}
        {tab === "newDeal" && <NewDealScreen />}
        {tab === "deals" && <DealsScreen />}
        {tab === "settings" && <SettingsScreen />}
      </main>

      <nav className="bottom-nav">
        <button
          className={tab === "wallet" ? "active" : ""}
          onClick={() => setTab("wallet")}
        >
          <span className="nav-icon">💼</span>
          <span className="nav-label">Кошелек</span>
        </button>
        <button
          className={tab === "newDeal" ? "active" : ""}
          onClick={() => setTab("newDeal")}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-label">Сделка</span>
        </button>
        <button
          className={tab === "deals" ? "active" : ""}
          onClick={() => setTab("deals")}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">Мои сделки</span>
        </button>
        <button
          className={tab === "settings" ? "active" : ""}
          onClick={() => setTab("settings")}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Профиль</span>
        </button>
      </nav>
    </div>
  );
};
