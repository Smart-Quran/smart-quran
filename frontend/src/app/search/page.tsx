'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { quranApi } from '@/lib/api';
import { setTelegramBackButton } from '@/lib/telegram';

interface SearchHit {
  verse_key: string;
  text: string;
  translations: Array<{ resource_name: string; text: string }>;
}

interface SearchMeta {
  current_page: number;
  next_page: number | null;
  total_pages: number;
  total_count: number;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTelegramBackButton(true, () => router.push('/'));
    inputRef.current?.focus();
    return () => setTelegramBackButton(false);
  }, [router]);

  const doSearch = useCallback(async (q: string, p: number) => {
    if (q.trim().length < 2) { setResults([]); setMeta(null); return; }
    setLoading(true);
    setError('');
    try {
      const r = await quranApi.search(q.trim(), p);
      const data = r.data;
      // quran.com wraps results in data.search
      const hits: SearchHit[] = (data.search?.results ?? data.results ?? []).map((item: any) => ({
        verse_key: item.verse_key,
        text: item.text ?? item.text_uthmani ?? '',
        translations: item.translations ?? [],
      }));
      setResults(p === 1 ? hits : (prev) => [...prev, ...hits] as any);
      setMeta(data.search?.pagination ?? data.pagination ?? null);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setMeta(null); return; }
    debounceRef.current = setTimeout(() => {
      setPage(1);
      doSearch(query, 1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    doSearch(query, next);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800/60 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-slate-200 transition-colors text-lg"
          >←</button>
          <h1 className="text-sm font-semibold text-slate-200">Search Quran</h1>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword, phrase, or topic..."
            className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-600 transition-colors"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setMeta(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >✕</button>
          )}
        </div>
      </div>

      <main className="flex-1 px-4 pb-8">
        {/* Status line */}
        {meta && query.trim().length >= 2 && (
          <p className="text-xs text-slate-500 mt-3 mb-2">
            {meta.total_count ?? results.length} results for &ldquo;{query}&rdquo;
          </p>
        )}

        {/* Idle state */}
        {!query && (
          <div className="mt-16 text-center text-slate-600">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm">Type to search across all 6,236 verses</p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {['mercy', 'patience', 'paradise', 'prayer', 'Moses', 'light'].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="px-3 py-1.5 text-xs rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading spinner (first page only) */}
        {loading && page === 1 && (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
                <div className="h-2.5 bg-slate-800 rounded animate-pulse w-16 mb-3" />
                <div className="h-5 bg-slate-800/60 rounded animate-pulse mb-2" />
                <div className="h-3 bg-slate-800/40 rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-sm text-center mt-8">{error}</p>}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-2 space-y-3">
            {results.map((hit) => (
              <SearchResultCard key={hit.verse_key} hit={hit} query={query} />
            ))}

            {/* Load more */}
            {meta?.next_page && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-3 text-xs rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? 'Loading...' : `Load more (page ${page + 1} of ${meta.total_pages})`}
              </button>
            )}
          </div>
        )}

        {/* No results */}
        {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
          <div className="mt-16 text-center text-slate-600">
            <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-xs mt-1 text-slate-700">Try a different keyword or phrase</p>
          </div>
        )}
      </main>
    </div>
  );
}

function SearchResultCard({ hit, query }: { hit: SearchHit; query: string }) {
  const translation = hit.translations?.[0];
  const [surahNum] = hit.verse_key.split(':');

  return (
    <Link
      href={`/ayah/${hit.verse_key}`}
      className="block bg-slate-900/60 border border-slate-800 rounded-2xl p-4 hover:border-emerald-800/60 transition-colors group"
    >
      {/* Verse key + surah */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700"
          style={{ color: 'var(--color-gold)' }}
        >
          {hit.verse_key}
        </span>
        <span className="text-xs text-slate-600 group-hover:text-emerald-500 transition-colors">
          View →
        </span>
      </div>

      {/* Arabic snippet */}
      {hit.text && (
        <p className="arabic-sm text-right text-base text-slate-300 mb-2 leading-loose line-clamp-2">
          {hit.text}
        </p>
      )}

      {/* Translation snippet with highlight */}
      {translation && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 border-t border-slate-800 pt-2">
          <Highlight text={translation.text} query={query} />
        </p>
      )}
    </Link>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-emerald-900/60 text-emerald-300 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
