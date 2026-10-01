# bun-telegram-bot-starter

[![Deploy on nibrun](https://nibrun.com/button.svg)](https://app.nibrun.com/deploy?name=bun-telegram-bot-starter&port=3000)

A Bun starter for stateful Telegram bots using grammY, Elysia, and SQLite. It builds to one
Linux x64 binary with migrations and the optional React Mini App embedded.

## Shape the template

- **Bot only:** delete `miniapp/`.
- **Bot with a Mini App:** keep both `backend/` and `miniapp/`.

Development, checks, and builds work in either shape.

## Getting started

### 1. Create and configure your bot

Create a bot with [@BotFather](https://t.me/BotFather) and copy its token. Once deployed, use your
public HTTPS origin as the Mini App URL. The app automatically sets the chat menu button to that
origin and registers `<origin>/api/telegram/webhook` as the webhook URL. It passes
`TELEGRAM_WEBHOOK_SECRET` to Telegram during registration and generates one when omitted; there is
nothing to configure for the webhook in BotFather.

### 2. Install dependencies

```bash
bun install
```

### 3. Configure the environment

```bash
cp backend/.env.example backend/.env
```

Add the bot token to `backend/.env` as `TELEGRAM_BOT_TOKEN`.

### 4. Compile and deploy

```bash
bun run build
```

Deploy the compiled Linux x64 binary at `backend/dist/app`.

[nibrun](https://nibrun.com) is an ideal fit for this starter: it provides the persistent
filesystem SQLite needs and a public HTTPS endpoint for Telegram webhooks at a low cost. Use a
writable `DATA_FOLDER`; nibrun's `NIBRUN_HOSTNAME` automatically enables webhook mode.

### Scheduled reminders

The `send-reminders` job in [crons.ts](./backend/src/crons.ts) checks SQLite every minute
(`* * * * *`). Production startup registers it with `Bun.cron` using OS scheduling, so nibrun
wakes the app for due runs. Each invocation delivers overdue reminders and exits without
starting HTTP, long polling, or registering the Telegram webhook again. Inspect registered
jobs with `nib apps crons --app <app-name>` or the dashboard's Crons tab.

Reminders arrive on the first scan after their due time, normally within a minute. Failed sends
remain pending for the next run, and overdue reminders survive restarts and missed runs.
SQLite delivery claims prevent overlapping jobs from sending the same reminder concurrently;
a claim abandoned by a crashed process expires after ten minutes. Delivery is at least once:
a crash after Telegram accepts a message but before SQLite records it can cause a retry.
Each run logs its start, completion, or failure.
While open, the Mini App refreshes reminders every ten seconds to pick up deliveries from
the separate cron process. Close it when observing nibrun sleep; refresh requests count as traffic.

Runtime `NODE_ENV` defaults to `production`. `bun dev` explicitly selects `development` and
uses Bun's in-process cron scheduler without installing an OS job. For a local compiled
binary, use `NODE_ENV=development`. Bun 1.4.2 or newer is required.

## Development

### Run and test locally

```bash
bun dev
```

In another terminal, run the tests:

```bash
bun test
```

Local development automatically uses long polling.
