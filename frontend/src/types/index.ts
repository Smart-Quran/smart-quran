// Auth
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface AuthState {
  user: TelegramUser | null;
  token: string | null;
  isLoading: boolean;
}

// Quran types
export interface Surah {
  id: number;
  name_simple: string;
  name_arabic: string;
  name_complex?: string;
  verses_count: number;
  revelation_place: 'makkah' | 'madinah';
  translated_name: { name: string; language_name: string };
}

export interface Ayah {
  id: number;
  verse_key: string;
  verse_number: number;
  text_uthmani: string;
  translations?: Translation[];
  audio?: AyahAudio;
  words?: Word[];
}

export interface Translation {
  id: number;
  resource_name: string;
  text: string;
}

export interface AyahAudio {
  url: string;
  duration: number;
  segments?: number[][];
}

export interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  translation?: { text: string; language_name: string };
}

export interface Tafseer {
  id: number;
  resource_name: string;
  text: string;
  language_name: string;
}

export interface Reciter {
  id: number;
  name: string;
  reciter_name: string;
  style?: string;
}

export interface SearchResult {
  verse_key: string;
  text: string;
  translations: Array<{ resource_name: string; text: string }>;
}

// API response wrappers
export interface PaginatedResponse<T> {
  data: T[];
  meta?: { current_page: number; next_page?: number; total_pages: number };
}
