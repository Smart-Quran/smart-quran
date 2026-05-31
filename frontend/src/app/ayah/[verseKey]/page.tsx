'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAyah, useSurahs } from '@/lib/useQuran';
import { setTelegramBackButton } from '@/lib/telegram';
import { useAudioStore, AudioTrack } from '@/store/audioStore';
import { quranApi } from '@/lib/api';
import { ReciterPicker } from '@/components/ReciterPicker';

export default function AyahPage() {
  const params = useParams();
  const router = useRouter();
  const verseKey = decodeURIComponent(params.verseKey as string);
  const [surahNum, ayahNum] = verseKey.split(':').map(Number);

  const { data: ayah, loading, error } = useAyah(verseKey);
  const { data: surahs } = useSurahs();
  const surah = surahs?.find((s) => s.id === surahNum);

  const { play, stop, track, isPlaying, reciterId, reciterName, queue, setQueue } = useAudioStore();
  const [audioLoading, setAudioLoading] = useState(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);

  const isCurrentTrack = track?.verseKey === verseKey;

  useEffect(() => {
    setTelegramBackButton(true, () => router.push(`/surah/${surahNum}`));
    return () => setTelegramBackButton(false);
  }, [router, surahNum]);

  const handlePlay = async () => {
    if (isCurrentTrack && isPlaying) { stop(); return; }

    setAudioLoading(true);
    try {
      // Load full surah queue if not already loaded for this surah+reciter
      let q = queue;
      const alreadyLoaded = queue.length > 0 && queue[0].surahId === surahNum;
      if (!alreadyLoaded) {
        const r = await quranApi.getSurahAudio(reciterId, surahNum);
        const audioFiles: Array<{ verse_key: string; url: string }> =
          r.data.audio_files ?? r.data.recitations ?? [];
        q = audioFiles.map((af) => {
          const [, ayahN] = af.verse_key.split(':').map(Number);
          return {
            verseKey: af.verse_key,
            url: af.url.startsWith('http') ? af.url : `https://verses.quran.com/${af.url}`,
            surahId: surahNum,
            ayahNumber: ayahN,
            totalAyahs: surah?.verses_count ?? 0,
          } as AudioTrack;
        });
        setQueue(q);
      }

      const thisTrack = q.find((t) => t.verseKey === verseKey);
      if (thisTrack) play(thisTrack);
    } catch {
      // fallback: fetch single ayah audio
      try {
        const r = await quranApi.getAyahAudio(reciterId, verseKey);
        const af = r.data.audio_files?.[0] ?? r.data;
        if (af?.url) {
          const url = af.url.startsWith('http') ? af.url : `https://verses.quran.com/${af.url}`;
          play({ verseKey, url, surahId: surahNum, ayahNumber: ayahNum, totalAyahs: surah?.verses_count ?? 0 });
        }
      } catch { /* silent */ }
    } finally {
      setAudioLoading(false);
    }
  };

  const prevKey = ayahNum > 1 ? `${surahNum}:${ayahNum - 1}` : null;
  const nextKey = surah && ayahNum < surah.verses_count ? `${surahNum}:${ayahNum + 1}` : null;

  return (
    <>
      <div className="min-h-screen flex flex-col pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/surah/${surahNum}`)} className="text-slate-400 hover:text-slate-200 text-lg">←</button>
            <div className="flex-1">
              <h1 className="text-sm font-semibold text-slate-100">{surah?.name_simple ?? `Surah ${surahNum}`}</h1>
              <p className="text-xs text-slate-500">Verse {ayahNum}</p>
            </div>
            <span className="text-xs font-mono text-slate-600 bg-slate-800 px-2 py-1 rounded">{verseKey}</span>
          </div>
        </div>

        <main className="flex-1 px-4">
          {loading && (
            <div className="mt-8 space-y-4">
              <div className="h-24 bg-slate-800/60 rounded-2xl animate-pulse" />
              <div className="h-16 bg-slate-800/40 rounded-2xl animate-pulse" />
            </div>
          )}
          {error && <p className="text-red-400 text-sm text-center mt-10">{error}</p>}

          {ayah && (
            <div className="mt-6 space-y-4">
              {/* Arabic */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <p className="arabic-text text-2xl text-right leading-loose text-slate-100">{ayah.text_uthmani}</p>
                <div className="flex justify-end mt-2">
                  <span className="text-xs font-arabic" style={{ color: 'var(--color-gold)' }}>﴿{ayahNum}﴾</span>
                </div>
              </div>

              {/* Translation */}
              {ayah.translations?.map((t) => (
                <div key={t.id} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">{t.resource_name}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{t.text}</p>
                </div>
              ))}

              {/* Audio controls */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Audio Recitation</p>
                  <button
                    onClick={() => setShowReciterPicker(true)}
                    className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    {reciterName} ▾
                  </button>
                </div>
                <button
                  onClick={handlePlay}
                  disabled={audioLoading}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isCurrentTrack && isPlaying
                      ? 'bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  } disabled:opacity-50`}
                >
                  {audioLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading audio...</>
                  ) : isCurrentTrack && isPlaying ? (
                    <>⏸ Pause</>
                  ) : (
                    <>▶ Play {verseKey}</>
                  )}
                </button>
              </div>

              {/* Tafseer / AI */}
              <div className="flex gap-2">
                <Link href={`/tafseer/${verseKey}`} className="flex-1 py-2.5 text-xs text-center rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
                  📖 Tafseer
                </Link>
                <Link href={`/explain/${verseKey}`} className="flex-1 py-2.5 text-xs text-center rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
                  ✨ AI Explain
                </Link>
              </div>
            </div>
          )}
        </main>

        {/* Prev / Next */}
        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800/60 px-4 py-3 flex gap-3">
          {prevKey
            ? <Link href={`/ayah/${prevKey}`} className="flex-1 py-2.5 text-xs text-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors">← {prevKey}</Link>
            : <div className="flex-1" />}
          {nextKey
            ? <Link href={`/ayah/${nextKey}`} className="flex-1 py-2.5 text-xs text-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors">{nextKey} →</Link>
            : <div className="flex-1" />}
        </div>
      </div>

      {showReciterPicker && <ReciterPicker onClose={() => setShowReciterPicker(false)} />}
    </>
  );
}
