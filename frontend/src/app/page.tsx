'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { SurahList } from '@/components/SurahList';
import { AuthScreen } from '@/components/AuthScreen';
import { Header } from '@/components/Header';

export default function Home() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading Smart Quran...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 px-4 pb-8">
        <div className="mt-4 mb-2">
          <h2 className="text-xs text-slate-500 uppercase tracking-widest font-medium">114 Surahs</h2>
        </div>
        <SurahList />
      </main>
    </div>
  );
}
