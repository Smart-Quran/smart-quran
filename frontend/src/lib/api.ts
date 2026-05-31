import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: clear auth on 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sq_token');
      localStorage.removeItem('sq_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Quran API helpers (call our backend which proxies quran.com)
export const quranApi = {
  getSurahs: () => api.get('/quran/surahs'),
  getSurah: (id: number) => api.get(`/quran/surahs/${id}`),
  getAyahs: (surahId: number, page = 1) =>
    api.get(`/quran/surahs/${surahId}/ayahs`, { params: { page } }),
  getAyah: (verseKey: string) => api.get(`/quran/ayahs/${verseKey}`),
  search: (q: string, page = 1) => api.get('/quran/search', { params: { q, page } }),
  getReciters: () => api.get('/quran/reciters'),
  getAyahAudio: (recitationId: number, verseKey: string) =>
    api.get(`/quran/audio/${recitationId}/ayah/${verseKey}`),
  getSurahAudio: (recitationId: number, surahId: number) =>
    api.get(`/quran/audio/${recitationId}/surah/${surahId}`),
  getTafseerList: () => api.get('/quran/tafseer'),
  getTafseer: (verseKey: string, tafseerId: number) =>
    api.get(`/quran/tafseer/${tafseerId}/${verseKey}`),
  getAIExplanation: (verseKey: string, context?: string) =>
    api.post('/ai/explain', { verse_key: verseKey, context }),
};
