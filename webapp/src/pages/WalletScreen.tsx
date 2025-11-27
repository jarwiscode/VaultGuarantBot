import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loader } from "../components/Loader";

interface WalletData {
  wallet: {
    id: number;
    currency: string;
    available_balance: string;
    locked_balance: string;
  };
  transactions: {
    id: number;
    type: string;
    amount: string;
    balance_after: string;
    created_at: string;
  }[];
}

export const WalletScreen: React.FC = () => {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.get("/app/me/wallet");
    setData(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader text="Кошелёк..." />;
  if (!data) return <div className="center">Кошелек не найден</div>;

  async function handleWalletPayTopup() {
    const amount = window.prompt("Сумма пополнения в TON", "1");
    if (!amount) return;

    try {
      const res = await api.post("/app/wallet/order", {
        amount,
        currencyCode: "TON",
        description: "Пополнение баланса Vault Guarant",
      });
      const link: string | undefined = res.data.directPayLink;
      if (!link) {
        window.alert("Не удалось получить ссылку оплаты Wallet.");
        return;
      }
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(link);
      } else {
        window.open(link, "_blank");
      }
    } catch {
      window.alert("Ошибка при создании платежа Wallet.");
    }
  }

  return (
    <div>
      <h2>Мой кошелек</h2>
      <div className="card">
        <div>Валюта: {data.wallet.currency}</div>
        <div>Доступно: {data.wallet.available_balance}</div>
        <div>В сделках: {data.wallet.locked_balance}</div>
      </div>

      <button
        className="primary mt-2"
        onClick={async () => {
          await api.post("/app/me/wallet/deposit-demo", { amount: 100 });
          await load();
        }}
      >
        Пополнить (демо +100)
      </button>

      <button className="primary mt-2" onClick={handleWalletPayTopup}>
        Пополнить через Wallet
      </button>

      <h3 className="mt-3">Последние транзакции</h3>
      {data.transactions.length === 0 && <div>Нет транзакций</div>}
      <ul className="list">
        {data.transactions.map((t) => (
          <li key={t.id}>
            <div>
              <b>{t.type}</b> {t.amount}
            </div>
            <div className="muted">
              Баланс: {t.balance_after} ·{" "}
              {new Date(t.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
