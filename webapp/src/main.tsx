import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./pages/App";
import "./styles.css";
import { applyTelegramTheme } from "./theme";

// Configure Telegram WebApp to expand to full viewport
if (window.Telegram?.WebApp) {
  const webApp = window.Telegram.WebApp;
  webApp.ready();
  webApp.expand();
  if (webApp.setHeaderColor) {
    webApp.setHeaderColor("#0e1621");
  }
  if (webApp.setBackgroundColor) {
    webApp.setBackgroundColor("#0e1621");
  }
  
  // Apply theme initially
  applyTelegramTheme();
  
  // Re-apply theme when it changes
  if (webApp.onEvent) {
    webApp.onEvent("themeChanged", applyTelegramTheme);
  }
  
  // Also re-apply on viewport changes
  window.addEventListener("resize", applyTelegramTheme);
  window.addEventListener("orientationchange", () => {
    setTimeout(applyTelegramTheme, 100);
  });
}

// Apply theme on load
applyTelegramTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
