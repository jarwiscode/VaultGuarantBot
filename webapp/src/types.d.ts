/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: {
        start_param?: string;
        [key: string]: any;
      };
      ready: () => void;
      close: () => void;
      expand: () => void;
      onEvent?: (event: string, callback: () => void) => void;
      setHeaderColor?: (color: string) => void;
      setBackgroundColor?: (color: string) => void;
      openTelegramLink?: (url: string) => void;
      showAlert?: (message: string) => void;
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
