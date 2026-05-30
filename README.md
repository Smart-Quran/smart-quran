smart-quran
AI-powered Quran exploration platform with search, audio recitation, tafseer, and Telegram Mini App support.
Smart Quran – AI-Powered Quran Exploration Platform

Smart Quran is a modern Quran exploration system designed as a Telegram Mini App and web platform. It provides fast Quran search, audio recitation, tafseer (explanation), and structured Quran browsing in a clean and responsive interface.

The goal is to make Quran study simple, fast, and accessible, combining traditional Islamic knowledge with modern technology.

Features (MVP)

Quran Browser

* Full Quran (114 Surahs, 6236 Ayahs)
* Arabic text
* English translation
* Transliteration
* Surah and Ayah navigation

Search System

* Keyword-based search
* Direct reference search (example: 2:255)
* Fast indexed search
* Typo-tolerant matching

Audio Recitation

* Multiple reciters including:
  Mishary Alafasy
  Abdul Basit
  Sudais
  Minshawi
* Verse-by-verse playback
* Surah playback
* Basic audio controls

Tafseer (Explanations)

* Ibn Kathir (English)
* Al-Tabari (Arabic)
* Al-Qurtubi
* As-Saadi
* Clean per-ayah display

Telegram Mini App Support

* Telegram login authentication
* Mobile-first UI
* Theme-aware design
* Fast loading experience

Tech Stack

Frontend:

* Next.js
* TypeScript
* TailwindCSS
* Framer Motion
* Telegram Mini App SDK

Backend:

* FastAPI (Python)
* PostgreSQL
* SQLAlchemy

Data:

* Quran text dataset (Arabic, English, transliteration)
* Tafseer datasets
* Audio CDN (EveryAyah)

Project Structure

backend/
app/
api/
models/
services/
schemas/
tests/

frontend/
src/
pages/
components/
lib/

docs/
docker/

Getting Started

1. Clone the repository
   git clone (https://github.com/Smart-Quran/smart-quran)
   cd smart-quran

2. Backend setup
   cd backend
   python -m venv venv
   activate virtual environment
   install requirements
   Run FastAPI server with uvicorn

3. Frontend setup
   cd frontend
   npm install
   npm run dev

Environment Variables

DATABASE_URL=postgresql connection string
TELEGRAM_BOT_TOKEN=your bot token
API_BASE_URL=backend url

Telegram Mini App

This project runs inside Telegram using the Mini App system.

Steps:

1. Create a bot using BotFather
2. Set Mini App URL
3. Connect frontend using Telegram WebApp SDK

Future Features (Not included in MVP)

* AI Quran assistant
* Semantic search with embeddings
* Voice commands
* Memorization system
* Tajweed analysis
* Knowledge graph of Quran themes

Important Notes

* This project is for educational and spiritual learning purposes
* No AI-generated religious rulings (fatwas)
* All AI responses must cite Quran and Tafseer sources when added

License

MIT License

Purpose

To build a fast, clean, and intelligent Quran exploration experience that works seamlessly on Telegram and the web
