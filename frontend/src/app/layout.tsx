import type { Metadata } from 'next';
import './globals.css';
import { TelegramProvider } from '@/components/TelegramProvider';
import { AudioPlayer } from '@/components/AudioPlayer';

export const metadata: Metadata = {
  title: 'Smart Quran',
  description: 'Explore the Quran with search, audio, and AI explanation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://cdn.qurancdn.com https://verses.quran.com; connect-src 'self' https://api.anthropic.com; media-src https://verses.quran.com https://cdn.islamic.network;"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <TelegramProvider>
          {children}
          <AudioPlayer />
        </TelegramProvider>
      </body>
    </html>
  );
}
