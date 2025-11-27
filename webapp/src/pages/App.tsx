import React, { useEffect, useState } from "react";
import { useTelegramAuth } from "../hooks/useTelegramAuth";
import { Loader } from "../components/Loader";
import { api } from "../api";
import { WalletScreen } from "./WalletScreen";
import { DealsScreen } from "./DealsScreen";
import { NewDealScreen } from "./NewDealScreen";
import { SettingsScreen } from "./SettingsScreen";
import { DealDetailScreen } from "./DealDetailScreen";

type Tab = "wallet" | "newDeal" | "deals" | "settings";
type Screen = Tab | { type: "dealDetail"; dealId: number };

export const App: React.FC = () => {
  const { user, loading, error } = useTelegramAuth();
  const [tab, setTab] = useState<Tab>("wallet");
  const [screen, setScreen] = useState<Screen>("wallet");

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
  }, []);

  useEffect(() => {
    // Check for start_param or URL parameter to open deal
    async function checkDealParam() {
      if (!user) return;

      const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      const urlParams = new URLSearchParams(window.location.search);
      const urlStartParam = urlParams.get("start_param");
      
      const dealParam = startParam || urlStartParam;
      if (dealParam && dealParam.startsWith("deal_")) {
        const dealCode = dealParam.replace("deal_", "");
        try {
          const res = await api.get(`/app/deals/code/${dealCode}`);
          if (res.data) {
            setScreen({ type: "dealDetail", dealId: res.data.id });
            setTab("deals");
            // Clean URL
            window.history.replaceState({}, "", window.location.pathname);
          }
        } catch (error) {
          console.error("Failed to load deal by code", error);
        }
      }
    }

    if (user && !loading) {
      checkDealParam();
    }
  }, [user, loading]);

  const handleDealClick = (dealId: number) => {
    setScreen({ type: "dealDetail", dealId });
  };

  const handleBack = () => {
    setScreen("deals");
    setTab("deals");
  };

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

  const currentTab = typeof screen === "string" ? screen : "deals";

  return (
    <div className="app">
      <main className="content">
        {screen === "wallet" && <WalletScreen />}
        {screen === "newDeal" && <NewDealScreen />}
        {screen === "deals" && <DealsScreen onDealClick={handleDealClick} />}
        {screen === "settings" && <SettingsScreen />}
        {typeof screen === "object" && screen.type === "dealDetail" && (
          <DealDetailScreen
            dealId={screen.dealId}
            currentUserId={user.id}
            onBack={handleBack}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={currentTab === "wallet" ? "active" : ""}
          onClick={() => {
            setTab("wallet");
            setScreen("wallet");
          }}
        >
          <span className="nav-icon">💼</span>
          <span className="nav-label">Кошелек</span>
        </button>
        <button
          className={currentTab === "newDeal" ? "active" : ""}
          onClick={() => {
            setTab("newDeal");
            setScreen("newDeal");
          }}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-label">Сделка</span>
        </button>
        <button
          className={currentTab === "deals" ? "active" : ""}
          onClick={() => {
            setTab("deals");
            setScreen("deals");
          }}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">Мои сделки</span>
        </button>
        <button
          className={currentTab === "settings" ? "active" : ""}
          onClick={() => {
            setTab("settings");
            setScreen("settings");
          }}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Профиль</span>
        </button>
      </nav>
    </div>
  );
};
