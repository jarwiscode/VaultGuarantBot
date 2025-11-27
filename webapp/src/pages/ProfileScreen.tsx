import React, { useEffect, useState } from "react";
import { api } from "../api";

interface ProfileScreenProps {
  username?: string;
  firstName?: string;
}

interface LoyaltySummary {
  points: number;
  rewards: any[];
  redemptions: any[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  username,
  firstName,
}) => {
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/app/me/loyalty");
        setLoyalty(res.data);
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  const displayName = username ? `@${username}` : firstName ?? "Пользователь";

  return (
    <div className="screen">
      <div className="toolbar">
        <button className="toolbar-pill">Settings</button>
        <div className="toolbar-badge">Profile</div>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-name">{displayName}</div>
      </div>

      <div className="profile-grid mt-2">
        <div className="profile-card">
          <div className="profile-label">Баллы лояльности</div>
          <div className="profile-value">
            {loyalty?.points ?? 0}
            <span className="gem-icon">◆</span>
          </div>
        </div>
        <div className="profile-card">
          <div className="profile-label">Сделки</div>
          <div className="profile-value">–</div>
        </div>
      </div>

      <div className="profile-section mt-3">
        <div className="profile-section-title">Реферальная программа</div>
        <div className="profile-card profile-card-wide mt-1">
          Рефералка и доп. бонусы будут доступны позже.
        </div>
      </div>
    </div>
  );
};

