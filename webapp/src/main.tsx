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
  
  // Apply theme first to detect light/dark
  applyTelegramTheme();
  
  // Set header and background colors based on theme
  const theme = webApp?.themeParams;
  const bgColor = theme?.bg_color || "#0e1621";
  const normalizedBg = bgColor.startsWith("#") ? bgColor : `#${bgColor}`;
  
  if (webApp.setHeaderColor) {
    webApp.setHeaderColor(normalizedBg);
  }
  if (webApp.setBackgroundColor) {
    webApp.setBackgroundColor(normalizedBg);
  }
  
  // Re-apply theme when it changes
  if (webApp.onEvent) {
    webApp.onEvent("themeChanged", () => {
      applyTelegramTheme();
      // Update header/background colors when theme changes
      const updatedTheme = webApp?.themeParams;
      const updatedBg = updatedTheme?.bg_color || "#0e1621";
      const normalizedUpdatedBg = updatedBg.startsWith("#") ? updatedBg : `#${updatedBg}`;
      if (webApp.setHeaderColor) {
        webApp.setHeaderColor(normalizedUpdatedBg);
      }
      if (webApp.setBackgroundColor) {
        webApp.setBackgroundColor(normalizedUpdatedBg);
      }
    });
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
