'use client';

import { useEffect, useState } from 'react';
import { quranApi } from '@/lib/api';
import { useAudioStore } from '@/store/audioStore';

interface Reciter {
  id: number;
  reciter_name: string;
  style?: { name: string } | null;
}

interface Props {
  onClose: () => void;
}

export function ReciterPicker({ onClose }: Props) {
  const { reciterId, setReciter } = useAudioStore();
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quranApi.getReciters()
      .then((r) => {
        const list: Reciter[] = r.data.recitations ?? [];
        setReciters(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pick = (r: Reciter) => {
    setReciter(r.id, r.reciter_name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Select Reciter</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 py-2">
          {loading && (
            <div className="space-y-1 px-4 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
          {reciters.map((r) => (
            <button
              key={r.id}
              onClick={() => pick(r)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${
                r.id === reciterId ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              <span className="text-sm flex-1">{r.reciter_name}</span>
              {r.style?.name && (
                <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                  {r.style.name}
                </span>
              )}
              {r.id === reciterId && <span className="text-emerald-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
