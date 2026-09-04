type TelegramWebApp = {
  initData: string;
  ready(): void;
  expand(): void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const DEVELOPMENT_KEY = 'telegram_init_data';

export function telegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function initData(): string {
  return telegramWebApp()?.initData || localStorage.getItem(DEVELOPMENT_KEY) || '';
}

export function saveDevelopmentInitData(value: string): void {
  localStorage.setItem(DEVELOPMENT_KEY, value.trim());
}

export function isInsideTelegram(): boolean {
  return Boolean(telegramWebApp()?.initData);
}
