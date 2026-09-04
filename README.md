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
origin and registers `<origin>/api/telegram/webhook` as the webhook URL.

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
