import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loader } from "../components/Loader";

interface Gift {
  id: number;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  price_points: number;
  image_url?: string | null;
  gradient_key?: string | null;
}

interface MarketScreenProps {
  points: number;
}

export const MarketScreen: React.FC<MarketScreenProps> = ({ points }) => {
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<Gift[]>("/app/market/gifts");
        setGifts(res.data);
      } catch {
        setGifts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <Loader text="Загрузка маркета..." />;
  }

  return (
    <div className="screen">
      <div className="toolbar">
        <button className="toolbar-pill toolbar-pill-accent">Guide</button>
        <div className="toolbar-badge">Vault Market</div>
        <div className="toolbar-balance">
          <span className="gem-icon">◆</span>
          <span>{points}</span>
        </div>
      </div>

      <div className="segmented">
        <button className="segmented-btn active">Gifts</button>
        <button className="segmented-btn">Deals</button>
        <button className="segmented-btn">Badges</button>
      </div>

      {!gifts || gifts.length === 0 ? (
        <div className="empty-state mt-3">
          <div className="empty-title">Пока нет доступных перков</div>
          <div className="empty-subtitle">
            Как только вы добавите их в админке, они появятся здесь.
          </div>
        </div>
      ) : null}

      <div className="market-grid">
        {gifts?.map((item) => (
          <div
            key={item.id}
            className={`market-card ${
              item.gradient_key ?? "market-card-1"
            }`.trim()}
          >
            <div className="market-card-body">
              {item.category && (
                <div className="market-card-tag">{item.category}</div>
              )}
            </div>
            <div className="market-card-footer">
              <div className="market-card-title">
                {item.title}
                {item.subtitle ? ` · ${item.subtitle}` : ""}
              </div>
              <button
                className="market-card-buy"
                onClick={() => {
                  if (points < item.price_points) {
                    window.alert("Недостаточно баллов для покупки.");
                  } else {
                    window.alert(
                      "Покупка перка будет реализована в следующей версии."
                    );
                  }
                }}
              >
                <span className="gem-icon">◆</span>
                <span>{item.price_points}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
