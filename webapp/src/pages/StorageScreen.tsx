import React from "react";

export const StorageScreen: React.FC = () => {
  return (
    <div className="screen">
      <div className="toolbar">
        <button className="toolbar-pill">Add Perk</button>
        <div className="toolbar-badge">Storage</div>
      </div>

      <div className="segmented">
        <button className="segmented-btn">Items</button>
        <button className="segmented-btn">Offers</button>
        <button className="segmented-btn active">Gifts</button>
      </div>

      <div className="empty-state mt-3">
        <div className="empty-title">У вас пока нет перков</div>
        <div className="empty-subtitle">
          Купленные бонусы и улучшения будут отображаться здесь.
        </div>
        <button
          className="primary mt-2"
          onClick={() => window.Telegram?.WebApp?.close()}
        >
          Открыть маркет
        </button>
      </div>
    </div>
  );
};

