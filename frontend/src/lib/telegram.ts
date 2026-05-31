'use client';

/**
 * Safe Telegram WebApp access.
 * Works both inside Telegram Mini App and regular browser.
 */

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return (window as any).Telegram?.WebApp ?? null;
}

export function getTelegramInitData(): string | null {
  const twa = getTelegramWebApp();
  if (!twa?.initData) return null;
  return twa.initData;
}

export function getTelegramUser() {
  const twa = getTelegramWebApp();
  return twa?.initDataUnsafe?.user ?? null;
}

export function isTelegramEnvironment(): boolean {
  const twa = getTelegramWebApp();
  return !!(twa?.initData && twa.initData.length > 0);
}

export function expandTelegramApp() {
  const twa = getTelegramWebApp();
  twa?.expand?.();
}

export function setTelegramBackButton(show: boolean, onBack?: () => void) {
  const twa = getTelegramWebApp();
  if (!twa) return;
  if (show && onBack) {
    twa.BackButton?.show?.();
    twa.BackButton?.onClick?.(onBack);
  } else {
    twa.BackButton?.hide?.();
  }
}

export function closeTelegramApp() {
  getTelegramWebApp()?.close?.();
}
