# Betting Intelligence Dashboard

Betting Intelligence Dashboard is an analytical tool for tracking CS2 and Dota 2 matches, monitoring odds, line movement, market signals, news context, and a personal decision journal. It is not a prediction service, does not place bets, does not automate bookmaker actions, and does not guarantee outcomes.

## MVP Scope

- Today dashboard with CS2/Dota 2 filters, match status filters, best odds, movement indicators, and watchlist actions.
- Match intelligence pages with bookmaker odds, historical odds charts, market signals, notes, news, and decision notes.
- Market signal engine for line drops, line rises, bookmaker spread, consensus moves, match-soon alerts, and watchlist alerts.
- Odds comparison and persisted `OddsSnapshot` history.
- Bet journal for analytical decisions. Entries may represent thinking, not real bets.
- Analytics page with entries, winrate, ROI, discipline, tag, and bookmaker summaries.
- Provider architecture for mock data now and real public/API-key data later.

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- SQLite for local MVP
- Prisma ORM
- Recharts
- Zustand
- Node cron job scaffold
- Optional Telegram module scaffold

## Getting Started

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If Prisma migrate is blocked by a local native engine issue, the MVP includes a SQLite bootstrap fallback:

```bash
sqlite3 prisma/dev.db < prisma/manual-init.sql
npx prisma generate
npx prisma db seed
```

## Environment Variables

```bash
DATABASE_URL="file:./dev.db"
PANDASCORE_API_KEY=""
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
```

API keys are optional in the MVP. Mock providers are used by default.

## Useful Commands

```bash
npm install
npm run dev
npx prisma migrate dev
npx prisma db seed
npm run job:refresh
```

## Data Sources Architecture

Providers live in `src/lib/providers`.

- `mockMatchesProvider`: demo CS2 and Dota 2 matches.
- `mockOddsProvider`: demo odds and historical snapshots.
- `mockNewsProvider`: demo news/context items.
- `pandascoreProvider`: placeholder for PandaScore esports matches, teams, players, and odds with API key.
- `opendotaProvider`: placeholder for Dota 2 match/player data.
- `hltvProvider`: placeholder for CS2 analytics. Use cautiously with rate limits; unofficial libraries can trigger blocking if used aggressively.
- `liquipediaProvider`: placeholder for tournaments and schedules through permitted APIs/methods.

Do not scrape bookmaker private accounts, bypass captchas, bypass authentication, or work around anti-bot systems. Real bookmaker integrations should use legal public APIs, licensed feeds, permitted public sources, or manual import.

## GitHub Publishing

```bash
git init
git add .
git commit -m "Initial Betting Intelligence Dashboard MVP"
gh repo create betting-intelligence-dashboard --private --source=. --remote=origin --push
```

If `gh` is not authenticated, run:

```bash
gh auth login
```

Or create a repository on GitHub manually, then:

```bash
git remote add origin git@github.com:<your-user>/betting-intelligence-dashboard.git
git push -u origin main
```

## Next Real API Candidates

1. PandaScore for esports schedules, teams, players, and potentially odds when available on your plan.
2. OpenDota for richer Dota 2 match and player context.
3. Liquipedia for tournament metadata and calendars through allowed access methods.
4. Carefully rate-limited HLTV-compatible CS2 data sources for team form and context.

## Disclaimer

This project supports manual analysis and journaling only. It does not provide guaranteed predictions, does not place bets, and does not integrate with private bookmaker accounts.
