/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: any;
      ready: () => void;
      close: () => void;
      openTelegramLink?: (url: string) => void;
      MainButton: {
        text: string;
        isVisible: boolean;
        show: () => void;
        hide: () => void;
        onClick: (cb: () => void) => void;
      };
    };
  };
}
