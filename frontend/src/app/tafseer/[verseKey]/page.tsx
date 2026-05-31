'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quranApi } from '@/lib/api';
import { useAyah, useSurahs } from '@/lib/useQuran';
import { setTelegramBackButton } from '@/lib/telegram';

interface TafseerSource {
  id: number;
  name: string;
  language_name: string;
  author_name?: string;
}

interface TafseerData {
  tafsir: {
    id: number;
    resource_name: string;
    text: string;
    verse_key: string;
  };
}

// Curated default tafseer sources (English + Arabic)
const DEFAULTS = [
  { id: 169, name: 'Tafsir Ibn Kathir', language_name: 'english' },
  { id: 168, name: "Maarif-ul-Quran", language_name: 'english' },
  { id: 91,  name: 'Al-Jalalayn', language_name: 'english' },
];

export default function TafseerPage() {
  const params = useParams();
  const router = useRouter();
  const verseKey = decodeURIComponent(params.verseKey as string);
  const [surahNum, ayahNum] = verseKey.split(':').map(Number);

  const { data: ayah } = useAyah(verseKey);
  const { data: surahs } = useSurahs();
  const surah = surahs?.find((s) => s.id === surahNum);

  const [sources, setSources] = useState<TafseerSource[]>(DEFAULTS);
  const [selectedId, setSelectedId] = useState(DEFAULTS[0].id);
  const [tafseer, setTafseer] = useState<TafseerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Load available sources once
  useEffect(() => {
    quranApi.getTafseerList()
      .then((r) => {
        const list: TafseerSource[] = r.data.tafsirs ?? [];
        if (list.length > 0) setSources(list);
      })
      .catch(() => {}); // keep defaults on error
  }, []);

  const fetchTafseer = useCallback(async (id: number) => {
    setLoading(true);
    setError('');
    setTafseer(null);
    try {
      const r = await quranApi.getTafseer(verseKey, id);
      setTafseer(r.data);
    } catch {
      setError('Failed to load tafseer. Try another source.');
    } finally {
      setLoading(false);
    }
  }, [verseKey]);

  useEffect(() => { fetchTafseer(selectedId); }, [selectedId, fetchTafseer]);

  useEffect(() => {
    setTelegramBackButton(true, () => router.push(`/ayah/${verseKey}`));
    return () => setTelegramBackButton(false);
  }, [router, verseKey]);

  const selectedSource = sources.find((s) => s.id === selectedId) ?? DEFAULTS[0];

  // Strip HTML tags from tafseer text (quran.com sometimes returns HTML)
  const cleanText = (html: string) =>
    html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/ayah/${verseKey}`)} className="text-slate-400 hover:text-slate-200 text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-slate-100">Tafseer</h1>
            <p className="text-xs text-slate-500">
              {surah?.name_simple ?? `Surah ${surahNum}`} · Verse {ayahNum}
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-slate-500 px-2 py-1 rounded">{verseKey}</span>
        </div>
      </div>

      <main className="flex-1 px-4 pb-10">
        {/* Arabic verse */}
        {ayah && (
          <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="arabic-text text-xl text-right leading-loose text-slate-200">
              {ayah.text_uthmani}
            </p>
            {ayah.translations?.[0] && (
              <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-800 leading-relaxed">
                {ayah.translations[0].text}
              </p>
            )}
          </div>
        )}

        {/* Source selector */}
        <div className="mt-4 mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Source</p>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700"
          >
            <span>{selectedSource.name}</span>
            <span className="text-slate-500">▾</span>
          </button>
        </div>

        {/* Tafseer content */}
        {loading && (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 bg-slate-800/60 rounded animate-pulse" style={{ width: `${75 + (i % 3) * 10}%` }} />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-950/40 border border-red-900/40 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => fetchTafseer(selectedId)} className="text-xs text-red-300 mt-2 underline">
              Retry
            </button>
          </div>
        )}

        {tafseer && !loading && (
          <div className="mt-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <p className="text-xs font-medium text-slate-300">{tafseer.tafsir.resource_name}</p>
              <span className="text-xs text-slate-600 capitalize">{selectedSource.language_name}</span>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {cleanText(tafseer.tafsir.text)}
            </div>
          </div>
        )}
      </main>

      {/* Source picker bottom sheet */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowPicker(false)}>
          <div
            className="w-full bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[65vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>
            <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <p className="text-sm font-semibold text-slate-200">Select Tafseer</p>
              <button onClick={() => setShowPicker(false)} className="text-slate-500 text-sm">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {sources.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedId(s.id); setShowPicker(false); }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${
                    s.id === selectedId ? 'text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  <span className="text-sm flex-1">{s.name}</span>
                  <span className="text-xs text-slate-600 capitalize">{s.language_name}</span>
                  {s.id === selectedId && <span className="text-emerald-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
