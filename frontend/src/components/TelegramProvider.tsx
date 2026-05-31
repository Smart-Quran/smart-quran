'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getTelegramInitData, isTelegramEnvironment, expandTelegramApp } from '@/lib/telegram';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const { initFromStorage, loginWithTelegram } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      // Inject Telegram WebApp script if not present
      if (typeof window !== 'undefined' && !(window as any).Telegram) {
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.onload = async () => {
          expandTelegramApp();
          await attemptTelegramAuth();
        };
        document.head.appendChild(script);
      } else {
        expandTelegramApp();
        await attemptTelegramAuth();
      }
    };

    const attemptTelegramAuth = async () => {
      if (isTelegramEnvironment()) {
        const initData = getTelegramInitData();
        if (initData) {
          try {
            await loginWithTelegram(initData);
            return;
          } catch {
            // fall through to storage
          }
        }
      }
      initFromStorage();
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
