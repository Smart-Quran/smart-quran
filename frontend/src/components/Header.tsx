'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-800/60">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-800 to-slate-800 border border-emerald-700/30 flex items-center justify-center">
          <span className="text-xs font-arabic" style={{ color: 'var(--color-gold)' }}>ق</span>
        </div>
        <span className="text-sm font-semibold text-slate-200">Smart Quran</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/search"
          className="text-slate-400 hover:text-slate-200 transition-colors text-base"
          title="Search"
        >
          🔍
        </Link>
        {user && (
          <>
            <span className="text-xs text-slate-500">
              {user.first_name}{user.id < 0 ? ' (Guest)' : ''}
            </span>
            <button
              onClick={logout}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </header>
  );
}
