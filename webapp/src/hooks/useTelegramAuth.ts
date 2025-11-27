import { useEffect, useState } from "react";
import { api, setAuthToken } from "../api";

interface User {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  language: "ru" | "en";
  loyaltyPoints: number;
}

export function useTelegramAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        if (!window.Telegram?.WebApp) {
          setError("NO_TELEGRAM_WEBAPP");
          setLoading(false);
          return;
        }

        const initData = window.Telegram.WebApp.initData ?? "";
        if (!initData) {
          setError("No Telegram init data");
          setLoading(false);
          return;
        }
        const res = await api.post("/auth/telegram", { initData });
        const { token: jwt, user: u } = res.data;
        setToken(jwt);
        setAuthToken(jwt);
        setUser(u);
      } catch (e) {
        setError("Auth failed");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  return { token, user, loading, error };
}
