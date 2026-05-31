'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAudioStore } from '@/store/audioStore';

export function AudioPlayer() {
  const {
    track, isPlaying, isLoading,
    pause, resume, stop, next, prev,
    setLoading, setPlaying,
    queue,
  } = useAudioStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync audio element with store state
  useEffect(() => {
    if (!track) { audioRef.current?.pause(); return; }

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    if (audio.src !== track.url) {
      audio.src = track.url;
      audio.load();
      setLoading(true);
      setProgress(0);
      setDuration(0);
    }

    if (isPlaying) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [track, isPlaying]); // eslint-disable-line

  // Wire audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onCanPlay = () => setLoading(false);
    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => {
      // Auto-advance to next ayah
      const { next: nextFn, queue: q, track: t } = useAudioStore.getState();
      const hasNext = q.findIndex((x) => x.verseKey === t?.verseKey) < q.length - 1;
      if (hasNext) nextFn();
      else setPlaying(false);
    };
    const onError = () => { setLoading(false); setPlaying(false); };

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [setLoading, setPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  if (!track) return null;

  const hasPrev = queue.findIndex((t) => t.verseKey === track.verseKey) > 0;
  const hasNext = queue.findIndex((t) => t.verseKey === track.verseKey) < queue.length - 1;
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/98 backdrop-blur border-t border-slate-700/60 px-4 py-3 shadow-2xl">
      {/* Progress bar */}
      <div
        className="w-full h-1 bg-slate-700 rounded-full mb-3 cursor-pointer overflow-hidden"
        onClick={seek}
      >
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-150"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Verse key */}
        <Link
          href={`/ayah/${track.verseKey}`}
          className="flex-1 min-w-0"
        >
          <p className="text-xs font-semibold text-emerald-400 truncate">{track.verseKey}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {fmt(progress)} / {fmt(duration)}
          </p>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <ControlBtn onClick={prev} disabled={!hasPrev} label="⏮">⏮</ControlBtn>

          <button
            onClick={isPlaying ? pause : resume}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center transition-colors text-white text-sm shadow-lg"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
            ) : isPlaying ? '⏸' : '▶'}
          </button>

          <ControlBtn onClick={next} disabled={!hasNext} label="⏭">⏭</ControlBtn>
        </div>

        {/* Stop */}
        <button
          onClick={stop}
          className="text-slate-600 hover:text-slate-400 transition-colors text-xs ml-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function ControlBtn({
  onClick, disabled, children, label,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors text-sm"
    >
      {children}
    </button>
  );
}
