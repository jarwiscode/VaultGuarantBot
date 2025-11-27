import React, { useEffect, useState } from "react";
import { useTelegramAuth } from "../hooks/useTelegramAuth";
import { Loader } from "../components/Loader";
import { MarketScreen } from "./MarketScreen";
import { ActivityScreen } from "./ActivityScreen";
import { StorageScreen } from "./StorageScreen";
import { ProfileScreen } from "./ProfileScreen";

type Tab = "market" | "activity" | "storage" | "profile";

export const App: React.FC = () => {
  const { user, loading, error } = useTelegramAuth();
  const [tab, setTab] = useState<Tab>("market");

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

  const points = (user as any).loyaltyPoints ?? 0;

  return (
    <div className="app">
      <main className="content">
        {tab === "market" && <MarketScreen points={points} />}
        {tab === "activity" && <ActivityScreen />}
        {tab === "storage" && <StorageScreen />}
        {tab === "profile" && (
          <ProfileScreen
            username={user.username}
            firstName={user.firstName}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={tab === "market" ? "active" : ""}
          onClick={() => setTab("market")}
        >
          <span className="nav-icon">🛒</span>
          <span className="nav-label">Market</span>
        </button>
        <button
          className={tab === "activity" ? "active" : ""}
          onClick={() => setTab("activity")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Activity</span>
        </button>
        <button
          className={tab === "storage" ? "active" : ""}
          onClick={() => setTab("storage")}
        >
          <span className="nav-icon">📦</span>
          <span className="nav-label">Storage</span>
        </button>
        <button
          className={tab === "profile" ? "active" : ""}
          onClick={() => setTab("profile")}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>
    </div>
  );
};
