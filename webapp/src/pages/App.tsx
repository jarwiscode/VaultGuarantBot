import React, { useEffect, useState } from "react";
import { useTelegramAuth } from "../hooks/useTelegramAuth";
import { Loader } from "../components/Loader";
import { WalletScreen } from "./WalletScreen";
import { DealsScreen } from "./DealsScreen";
import { NewDealScreen } from "./NewDealScreen";
import { SettingsScreen } from "./SettingsScreen";

type Tab = "wallet" | "new" | "deals" | "settings";

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
      <header className="header">
        <div className="title">Vault Guarant</div>
        <div className="subtitle">
          {user.username ? `@${user.username}` : user.firstName}
        </div>
      </header>

      <main className="content">
        {tab === "wallet" && <WalletScreen />}
        {tab === "new" && <NewDealScreen />}
        {tab === "deals" && <DealsScreen />}
        {tab === "settings" && <SettingsScreen />}
      </main>

      <nav className="bottom-nav">
        <button
          className={tab === "wallet" ? "active" : ""}
          onClick={() => setTab("wallet")}
        >
          Мой кошелек
        </button>
        <button
          className={tab === "new" ? "active" : ""}
          onClick={() => setTab("new")}
        >
          Создать сделку
        </button>
        <button
          className={tab === "deals" ? "active" : ""}
          onClick={() => setTab("deals")}
        >
          Мои сделки
        </button>
        <button
          className={tab === "settings" ? "active" : ""}
          onClick={() => setTab("settings")}
        >
          Настройки
        </button>
      </nav>
    </div>
  );
};
