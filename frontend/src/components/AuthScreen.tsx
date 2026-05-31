'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthScreen() {
  const { loginAsGuest, isLoading } = useAuthStore();
  const [error, setError] = useState('');

  const handleGuest = async () => {
    setError('');
    try {
      await loginAsGuest();
    } catch {
      setError('Failed to connect. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-800 to-slate-800 border border-emerald-700/40 flex items-center justify-center shadow-2xl">
            <span className="text-3xl font-arabic text-gold" style={{ color: 'var(--color-gold)' }}>
              ﷽
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Smart Quran</h1>
          <p className="text-slate-400 text-sm mt-2">Explore the Holy Quran</p>
        </div>

        {/* Telegram login widget placeholder */}
        <div id="telegram-login-widget" className="flex justify-center mb-4" />

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-500 text-xs">or</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Guest login */}
        <button
          onClick={handleGuest}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Connecting...' : 'Continue as Guest'}
        </button>

        {error && (
          <p className="text-red-400 text-xs text-center mt-3">{error}</p>
        )}

        <p className="text-slate-600 text-xs text-center mt-6">
          Sign in with Telegram for full features
        </p>
      </div>
    </div>
  );
}
