function normalizeColor(value?: string): string | null {
  if (!value) return null;
  return value.startsWith("#") ? value : `#${value}`;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string | null): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Determine if a color is light (for light theme detection)
 */
function isLightColor(hex: string | null): boolean {
  if (!hex) return false;
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
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

  // Apply Telegram theme colors
  const mapping: Record<string, string | undefined> = {
    "--tg-bg-color": theme.bg_color,
    "--tg-secondary-bg-color": theme.secondary_bg_color,
    "--tg-text-color": theme.text_color,
    "--tg-hint-color": theme.hint_color,
    "--tg-button-color": theme.button_color,
    "--tg-button-text-color": theme.button_text_color,
    "--tg-card-bg-color": theme.secondary_bg_color || theme.bg_color,
  };

  Object.entries(mapping).forEach(([cssVar, color]) => {
    const normalized = normalizeColor(color);
    if (normalized) {
      root.style.setProperty(cssVar, normalized);
    }
  });

  // Detect if theme is light or dark
  const bgColor = normalizeColor(theme.bg_color);
  const isLight = bgColor ? isLightColor(bgColor) : false;

  // Apply theme-specific custom colors
  if (isLight) {
    // Light theme colors
    root.style.setProperty("--telegram-primary", "#3390ec");
    root.style.setProperty("--telegram-primary-hover", "#2b7fd9");
    root.style.setProperty("--telegram-secondary-bg", "rgba(0, 0, 0, 0.05)");
    root.style.setProperty("--telegram-divider", "rgba(0, 0, 0, 0.08)");
    root.style.setProperty("--telegram-hint", "rgba(0, 0, 0, 0.4)");
    root.style.setProperty("--telegram-link", "#3390ec");
    root.style.setProperty("--tg-border-color", "rgba(0, 0, 0, 0.08)");
  } else {
    // Dark theme colors (default)
    root.style.setProperty("--telegram-primary", "#3390ec");
    root.style.setProperty("--telegram-primary-hover", "#2b7fd9");
    root.style.setProperty("--telegram-secondary-bg", "rgba(255, 255, 255, 0.05)");
    root.style.setProperty("--telegram-divider", "rgba(255, 255, 255, 0.08)");
    root.style.setProperty("--telegram-hint", "rgba(255, 255, 255, 0.4)");
    root.style.setProperty("--telegram-link", "#6ab7ff");
    root.style.setProperty("--tg-border-color", "rgba(255, 255, 255, 0.08)");
  }

  // Add theme class to body for CSS selectors
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(isLight ? "theme-light" : "theme-dark");
}

