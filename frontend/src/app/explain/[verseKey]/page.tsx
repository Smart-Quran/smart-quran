'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAyah, useSurahs } from '@/lib/useQuran';
import { setTelegramBackButton } from '@/lib/telegram';
import { api } from '@/lib/api';

type Status = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export default function ExplainPage() {
  const params = useParams();
  const router = useRouter();
  const verseKey = decodeURIComponent(params.verseKey as string);
  const [surahNum, ayahNum] = verseKey.split(':').map(Number);

  const { data: ayah } = useAyah(verseKey);
  const { data: surahs } = useSurahs();
  const surah = surahs?.find((s) => s.id === surahNum);

  const [status, setStatus] = useState<Status>('idle');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setTelegramBackButton(true, () => router.push(`/ayah/${verseKey}`));
    return () => {
      setTelegramBackButton(false);
      abortRef.current?.abort();
    };
  }, [router, verseKey]);

  // Auto-trigger once ayah is loaded
  useEffect(() => {
    if (ayah && status === 'idle') fetchExplanation();
  }, [ayah]); // eslint-disable-line

  const fetchExplanation = async () => {
    if (!ayah) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus('loading');
    setExplanation('');
    setError('');

    try {
      const token = localStorage.getItem('sq_token');
      const response = await fetch(`${api.defaults.baseURL}/ai/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          verse_key: verseKey,
          verse_text: ayah.text_uthmani,
          translation: ayah.translations?.[0]?.text ?? '',
          tafseer_context: '',
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail ?? 'AI service unavailable');
      }

      setStatus('streaming');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') { setStatus('done'); return; }
          try {
            const { text } = JSON.parse(payload);
            if (text) setExplanation((prev) => prev + text);
          } catch { /* skip malformed */ }
        }
      }
      setStatus('done');
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e?.message ?? 'Failed to generate explanation.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/ayah/${verseKey}`)} className="text-slate-400 hover:text-slate-200 text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-slate-100">AI Explanation</h1>
            <p className="text-xs text-slate-500">
              {surah?.name_simple ?? `Surah ${surahNum}`} · Verse {ayahNum}
            </p>
          </div>
          <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded-lg">✨ AI</span>
        </div>
      </div>

      <main className="flex-1 px-4 pb-10">
        {/* Verse card */}
        {ayah && (
          <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <p className="arabic-text text-xl text-right leading-loose text-slate-200">
              {ayah.text_uthmani}
            </p>
            {ayah.translations?.[0] && (
              <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-800 leading-relaxed italic">
                &ldquo;{ayah.translations[0].text}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 px-3 py-2 bg-amber-950/30 border border-amber-900/30 rounded-xl">
          <p className="text-xs text-amber-500/80">
            ⚠️ AI-generated explanation for educational purposes only. Not a religious ruling.
          </p>
        </div>

        {/* Explanation output */}
        <div className="mt-4">
          {(status === 'loading') && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-6">
              <span className="w-4 h-4 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
              Generating explanation...
            </div>
          )}

          {(status === 'streaming' || status === 'done') && explanation && (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
                <span className="text-xs text-emerald-400 font-medium">✨ Explanation</span>
                {status === 'streaming' && (
                  <span className="w-2 h-4 bg-emerald-500 animate-pulse rounded-sm" />
                )}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {explanation}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchExplanation}
                className="text-xs text-red-300 mt-2 underline"
              >
                Try again
              </button>
            </div>
          )}

          {status === 'done' && (
            <button
              onClick={fetchExplanation}
              className="mt-4 w-full py-2.5 text-xs rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
            >
              ↺ Regenerate
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
