'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAyahs, useSurahs } from '@/lib/useQuran';
import { setTelegramBackButton } from '@/lib/telegram';
import type { Ayah } from '@/types';

export default function SurahPage() {
  const params = useParams();
  const router = useRouter();
  const surahId = Number(params.id);
  const [page, setPage] = useState(1);

  const { data: surahs } = useSurahs();
  const { data, loading, error } = useAyahs(surahId, page);

  const surah = surahs?.find((s) => s.id === surahId);

  useEffect(() => {
    setTelegramBackButton(true, () => router.push('/'));
    return () => setTelegramBackButton(false);
  }, [router]);

  if (!surahId || surahId < 1 || surahId > 114) {
    return <p className="text-red-400 text-sm text-center mt-10">Invalid surah</p>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-slate-200 transition-colors text-lg leading-none"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-100">
              {surah?.name_simple ?? `Surah ${surahId}`}
            </h1>
            <p className="text-xs text-slate-500">
              {surah?.translated_name?.name} · {surah?.verses_count} verses
            </p>
          </div>
          <span className="arabic-sm text-lg" style={{ color: 'var(--color-gold)' }}>
            {surah?.name_arabic}
          </span>
        </div>
      </div>

      <main className="flex-1 px-4 pb-8">
        {/* Bismillah (for all except Al-Fatiha and At-Tawbah) */}
        {surahId !== 1 && surahId !== 9 && (
          <div className="text-center py-6">
            <p className="arabic-text text-2xl" style={{ color: 'var(--color-gold)' }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
        )}

        {/* Ayah list */}
        {loading && <AyahSkeleton />}
        {error && <p className="text-red-400 text-sm text-center mt-6">{error}</p>}
        {data && (
          <>
            <div className="space-y-3 mt-2">
              {data.ayahs.map((ayah) => (
                <AyahCard key={ayah.id} ayah={ayah} surahId={surahId} />
              ))}
            </div>

            {/* Pagination */}
            {data.meta && data.meta.total_pages > 1 && (
              <div className="flex justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="px-3 py-2 text-xs text-slate-500">
                  {page} / {data.meta.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.meta.next_page}
                  className="px-4 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function AyahCard({ ayah, surahId }: { ayah: Ayah; surahId: number }) {
  const translation = ayah.translations?.[0];
  const verseKey = ayah.verse_key ?? `${surahId}:${ayah.verse_number}`;

  return (
    <Link
      href={`/ayah/${verseKey}`}
      className="block bg-slate-900/60 border border-slate-800 rounded-2xl p-4 hover:border-emerald-800/60 transition-colors group"
    >
      {/* Verse number badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full border flex items-center justify-center text-xs font-semibold"
            style={{ borderColor: 'var(--color-gold-dim)', color: 'var(--color-gold)' }}
          >
            {ayah.verse_number}
          </div>
          <span className="text-xs text-slate-600">{verseKey}</span>
        </div>
        <span className="text-xs text-slate-600 group-hover:text-emerald-500 transition-colors">
          View →
        </span>
      </div>

      {/* Arabic */}
      <p className="arabic-text text-right text-xl leading-loose text-slate-100 mb-3">
        {ayah.text_uthmani}
      </p>

      {/* Translation */}
      {translation && (
        <p className="text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
          {translation.text}
        </p>
      )}
    </Link>
  );
}

function AyahSkeleton() {
  return (
    <div className="space-y-3 mt-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-slate-800 animate-pulse" />
            <div className="h-2.5 bg-slate-800 rounded animate-pulse w-10" />
          </div>
          <div className="h-8 bg-slate-800/60 rounded animate-pulse mb-3" />
          <div className="space-y-1.5 pt-3 border-t border-slate-800">
            <div className="h-2.5 bg-slate-800/40 rounded animate-pulse" />
            <div className="h-2.5 bg-slate-800/40 rounded animate-pulse w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
