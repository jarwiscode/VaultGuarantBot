function normalizeColor(value?: string): string | null {
  if (!value) return null;
  return value.startsWith("#") ? value : `#${value}`;
}

export function applyTelegramTheme() {
  const webApp = window.Telegram?.WebApp;
  const theme = webApp?.themeParams as
    | {
        bg_color?: string;
        secondary_bg_color?: string;
        text_color?: string;
        hint_color?: string;
        button_color?: string;
        button_text_color?: string;
      }
    | undefined;

  if (!theme) return;

  const root = document.documentElement;

  const mapping: Record<string, string | undefined> = {
    "--tg-bg-color": theme.bg_color,
    "--tg-secondary-bg-color": theme.secondary_bg_color,
    "--tg-text-color": theme.text_color,
    "--tg-hint-color": theme.hint_color,
    "--tg-button-color": theme.button_color,
    "--tg-button-text-color": theme.button_text_color,
    // Update card background based on theme
    "--tg-card-bg-color": theme.secondary_bg_color || theme.bg_color,
  };

  Object.entries(mapping).forEach(([cssVar, color]) => {
    const normalized = normalizeColor(color);
    if (normalized) {
      root.style.setProperty(cssVar, normalized);
    }
  });
}

