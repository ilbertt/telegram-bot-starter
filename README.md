# bun-telegram-bot-starter

A production-ready Bun template for stateful Telegram bots, with an optional React Mini App.
It uses grammY, Elysia, and SQLite through `Bun.SQL`, and compiles to one Linux x64 glibc
binary containing its migrations and, when present, the Mini App.

## Create a development bot

Open [@BotFather](https://t.me/BotFather), run `/newbot`, and copy the token into
`backend/.env`. Use a separate development bot: Telegram allows only one long poller for a token,
so sharing the production token causes the two processes to evict each other.

```bash
cp backend/.env.example backend/.env
bun install
bun dev
```

Local `BOT_MODE=auto` uses long polling. Startup removes an old webhook without dropping queued
updates. The API and Mini App development servers run at ports 3000 and 5173.

Important variables are `TELEGRAM_BOT_TOKEN`, `BOT_MODE=auto|polling|webhook`, optional HTTPS
`BASE_URL`, persistent `DATA_FOLDER`, optional `TELEGRAM_WEBHOOK_SECRET`,
`TELEGRAM_INIT_DATA_MAX_AGE_SECONDS`, `REMINDER_POLL_INTERVAL_MS`, and `PORT`.

## What is included

- Controller → service → repository layering shared by bot and HTTP controllers.
- SQLite-backed Telegram users, grammY sessions, reminder flow state, and reminders.
- `/start`, `/remind`, `/reminders`, and `/cancel` from one typed command registry.
- Polling locally and an authenticated Telegram webhook at `/api/telegram/webhook` in production.
- Owner-scoped REST endpoints, signed Mini App init-data authentication, OpenAPI, and per-user
  WebSocket reminder events.
- An in-process scheduler that marks a reminder sent only after Telegram accepts the message.

All durable state lives in `DATA_FOLDER/app.db`. The generated webhook secret is stored beside it,
so that directory must be on a persistent nibrun disk and writable by the process.

## Mini App development

The Mini App sends raw `Telegram.WebApp.initData` as `Authorization: tma <data>`. A browser has no
Telegram launch data, so generate a real signature with the development bot token:

```bash
cd backend
bun dev:init-data
```

Paste the output into the browser-development panel. This is a signed, clearly fake user—not an
auth bypass or server endpoint. In BotFather, configure the deployed HTTPS URL as the bot's Mini
App. The client calls `ready()` and `expand()`, uses Telegram theme variables, and receives live
changes over `/api/events`.

The Mini App is optional. Delete `miniapp/`; root dev/typecheck/build scripts detect its absence,
and the backend produces an API/bot-only binary with no source changes.

## Build, check, and deploy

```bash
bun fix:codestyle
bun check:all
bun test
bun run build:local  # host binary
bun run build        # backend/dist/app, Linux x64 glibc
```

Upload `backend/dist/app` to [nibrun](https://nibrun.com), set the environment variables, expose
`PORT`, and attach persistent storage at `DATA_FOLDER`. `BASE_URL` may be omitted: nibrun provides
`NIBRUN_HOSTNAME`, from which the app derives its public HTTPS origin. Auto mode then registers
the webhook idempotently without dropping pending updates.

The scheduler deliberately targets one running process. Multiple replicas require an atomic
database claim/lease or an external queue; otherwise two processes can send the same reminder.
