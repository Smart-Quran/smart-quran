'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSurahs } from '@/lib/useQuran';
import type { Surah } from '@/types';

export function SurahList() {
  const { data: surahs, loading, error } = useSurahs();
  const [query, setQuery] = useState('');

  const filtered = surahs?.filter((s) =>
    s.name_simple.toLowerCase().includes(query.toLowerCase()) ||
    s.translated_name?.name?.toLowerCase().includes(query.toLowerCase()) ||
    String(s.id).includes(query)
  ) ?? [];

  if (loading) return <LoadingSkeleton />;
  if (error) return <p className="text-red-400 text-sm text-center mt-10">{error}</p>;

  return (
    <div className="mt-4">
      {/* Search bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search surahs..."
          className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
          >✕</button>
        )}
      </div>

      {/* Surah list */}
      <div className="space-y-1">
        {filtered.map((s) => <SurahRow key={s.id} surah={s} />)}
      </div>

      {filtered.length === 0 && (
        <p className="text-slate-500 text-sm text-center mt-8">No surahs found</p>
      )}
    </div>
  );
}

function SurahRow({ surah }: { surah: Surah }) {
  return (
    <Link
      href={`/surah/${surah.id}`}
      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/60 transition-colors group"
    >
      {/* Number badge */}
      <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
        <span className="text-xs font-semibold text-emerald-400">{surah.id}</span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors leading-tight">
          {surah.name_simple}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {surah.translated_name?.name} · {surah.verses_count} verses · {surah.revelation_place}
        </p>
      </div>

      {/* Arabic name */}
      <span className="arabic-sm text-base text-gold flex-shrink-0" style={{ color: 'var(--color-gold)' }}>
        {surah.name_arabic}
      </span>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-4 space-y-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-800 rounded animate-pulse w-1/3" />
            <div className="h-2.5 bg-slate-800/60 rounded animate-pulse w-1/2" />
          </div>
          <div className="w-12 h-4 bg-slate-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
