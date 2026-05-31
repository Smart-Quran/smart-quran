import { create } from 'zustand';

export interface AudioTrack {
  verseKey: string;
  url: string;
  surahId: number;
  ayahNumber: number;
  totalAyahs: number;
}

interface AudioStore {
  // Reciter
  reciterId: number;
  reciterName: string;
  setReciter: (id: number, name: string) => void;

  // Current track
  track: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;

  // Surah queue (all ayah URLs for current surah)
  queue: AudioTrack[];
  setQueue: (tracks: AudioTrack[]) => void;

  // Actions
  play: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  setLoading: (v: boolean) => void;
  setPlaying: (v: boolean) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  reciterId: 7, // Mishary Rashid Alafasy (default)
  reciterName: 'Mishary Alafasy',
  setReciter: (id, name) => {
    set({ reciterId: id, reciterName: name });
    // Stop current playback when reciter changes
    get().stop();
  },

  track: null,
  isPlaying: false,
  isLoading: false,
  queue: [],

  setQueue: (tracks) => set({ queue: tracks }),

  play: (track) => set({ track, isPlaying: true, isLoading: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  stop: () => set({ track: null, isPlaying: false, isLoading: false }),
  setLoading: (v) => set({ isLoading: v }),
  setPlaying: (v) => set({ isPlaying: v }),

  next: () => {
    const { track, queue } = get();
    if (!track || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.verseKey === track.verseKey);
    const nextTrack = queue[idx + 1];
    if (nextTrack) set({ track: nextTrack, isPlaying: true, isLoading: true });
  },

  prev: () => {
    const { track, queue } = get();
    if (!track || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.verseKey === track.verseKey);
    const prevTrack = queue[idx - 1];
    if (prevTrack) set({ track: prevTrack, isPlaying: true, isLoading: true });
  },
}));
