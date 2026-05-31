# Smart Quran

A Telegram Mini App and web application for exploring the Holy Quran.

## Features
- 📖 Quran browsing — all 114 surahs, 6,236 ayahs
- 🔍 Keyword search across all verses
- 🔊 Audio recitation — multiple reciters, full surah queue
- 📚 Tafseer — multiple sources with source picker
- ✨ AI explanation — streamed, guardrailed
- 🔐 Telegram Mini App authentication + guest sessions

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: FastAPI, PostgreSQL, SQLAlchemy async
- **Auth**: Telegram initData HMAC-SHA256 + JWT
- **AI**: Anthropic claude-haiku (streaming)
- **Proxy**: Nginx with rate limiting

---

## Local Development

```bash
# 1. Copy env
cp .env.example .env
# Fill in: POSTGRES_PASSWORD, SECRET_KEY, TELEGRAM_BOT_TOKEN

# 2. Start everything
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000/docs
# Postgres → localhost:5432
```

### Without Docker

```bash
# Backend
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

---

## Production Deployment

### Prerequisites
- Server with Docker + Docker Compose v2
- Domain pointing to your server
- SSL certificate (see `nginx/ssl/README.md`)

### Steps

```bash
# 1. Clone repo on your server
git clone https://github.com/youruser/smart-quran.git
cd smart-quran

# 2. Configure secrets
cp .env.example .env
nano .env   # fill in all values

# 3. Add SSL certs
cp /etc/letsencrypt/live/yourdomain/fullchain.pem nginx/ssl/fullchain.pem
cp /etc/letsencrypt/live/yourdomain/privkey.pem   nginx/ssl/privkey.pem

# 4. Deploy
./deploy.sh

# Or pull latest code + redeploy
./deploy.sh --pull
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | ✅ | Database password |
| `SECRET_KEY` | ✅ | JWT signing key (64 hex chars) |
| `TELEGRAM_BOT_TOKEN` | ✅ | From @BotFather |
| `ANTHROPIC_API_KEY` | optional | Enables AI explanations |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated frontend URLs |
| `NEXT_PUBLIC_API_URL` | ✅ | Public backend URL |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | optional | For Telegram login widget |

Generate a secure `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Telegram Bot Setup

1. Message [@BotFather](https://t.me/BotFather) → `/newbot`
2. `/newapp` → set the Mini App URL to `https://yourdomain.com`
3. Copy the bot token to `.env`

---

## Project Structure

```
smart-quran/
├── backend/
│   ├── main.py              # FastAPI app, middleware
│   ├── config.py            # Settings from env
│   ├── database.py          # Async SQLAlchemy
│   ├── models/user.py       # User table
│   ├── routers/
│   │   ├── auth.py          # /auth/telegram, /auth/guest
│   │   ├── quran.py         # /quran/* proxy to quran.com
│   │   └── ai.py            # /ai/explain (streaming)
│   ├── services/
│   │   ├── telegram_auth.py # HMAC-SHA256 initData validation
│   │   ├── jwt_service.py   # Token create/decode
│   │   └── quran_service.py # quran.com API client
│   └── middleware/
│       ├── auth.py          # get_current_user dependency
│       └── rate_limit.py    # slowapi limiter
├── frontend/
│   └── src/
│       ├── app/             # Next.js app router pages
│       │   ├── page.tsx         # Home (surah list)
│       │   ├── search/          # Keyword search
│       │   ├── surah/[id]/      # Ayah list
│       │   ├── ayah/[key]/      # Ayah detail + audio
│       │   ├── tafseer/[key]/   # Tafseer display
│       │   └── explain/[key]/   # AI explanation
│       ├── components/
│       │   ├── AudioPlayer.tsx  # Persistent bottom player
│       │   ├── ReciterPicker.tsx
│       │   ├── TelegramProvider.tsx
│       │   └── Header.tsx
│       ├── store/
│       │   ├── authStore.ts     # Zustand auth
│       │   └── audioStore.ts    # Zustand audio player
│       └── lib/
│           ├── api.ts           # Axios client
│           ├── useQuran.ts      # Data fetching hooks
│           └── telegram.ts      # Telegram SDK utils
├── nginx/nginx.conf
├── docker-compose.yml
├── docker-compose.dev.yml
└── deploy.sh
```

## Development Phases
- [x] Phase 1: Project setup & authentication
- [x] Phase 2: Quran browsing
- [x] Phase 3: Search
- [x] Phase 4: Audio
- [x] Phase 5: Tafseer
- [x] Phase 6: AI explanation
- [x] Phase 7: Security hardening
- [x] Phase 8: Deployment
