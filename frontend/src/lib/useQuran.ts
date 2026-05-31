import { useState, useEffect, useRef } from 'react';
import { quranApi } from '@/lib/api';
import type { Surah, Ayah } from '@/types';

// Simple in-memory cache
const cache: Record<string, unknown> = {};

function useCached<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>((cache[key] as T) ?? null);
  const [loading, setLoading] = useState(!cache[key]);
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (cache[key]) { setData(cache[key] as T); setLoading(false); return; }
    if (ran.current) return;
    ran.current = true;
    fetcher()
      .then((d) => { cache[key] = d; setData(d); })
      .catch(() => setError('Failed to load. Please retry.'))
      .finally(() => setLoading(false));
  }, [key]); // eslint-disable-line

  return { data, loading, error };
}

export function useSurahs() {
  return useCached<Surah[]>('surahs', async () => {
    const r = await quranApi.getSurahs();
    return r.data.chapters as Surah[];
  });
}

export function useAyahs(surahId: number, page = 1) {
  return useCached<{ ayahs: Ayah[]; meta: { current_page: number; next_page: number | null; total_pages: number } }>(
    `ayahs-${surahId}-${page}`,
    async () => {
      const r = await quranApi.getAyahs(surahId, page);
      return {
        ayahs: r.data.verses as Ayah[],
        meta: r.data.pagination,
      };
    }
  );
}

export function useAyah(verseKey: string) {
  return useCached<Ayah>(`ayah-${verseKey}`, async () => {
    const r = await quranApi.getAyah(verseKey);
    return r.data.verse as Ayah;
  });
}
