# bun-telegram-bot-starter

[![Deploy on nibrun](https://nibrun.com/button.svg)](https://app.nibrun.com/deploy?name=bun-telegram-bot-starter&port=3000)

A Bun starter for stateful Telegram bots using grammY, Elysia, and SQLite. It builds to one
Linux x64 binary with migrations and the optional React Mini App embedded.

## Getting started

### 1. Create a bot

Create a development bot with [@BotFather](https://t.me/BotFather). Keep it separate from your
production bot so the two do not compete for the same polling token.

### 2. Install dependencies

```bash
bun install
```

### 3. Configure the environment

```bash
cp backend/.env.example backend/.env
```

Add the bot token to `backend/.env` as `TELEGRAM_BOT_TOKEN`.

### 4. Run locally

```bash
bun dev
```

Local development automatically uses long polling.

### 5. Compile and deploy

```bash
bun run build
```

Deploy the compiled Linux x64 binary at `backend/dist/app`. We recommend
[nibrun](https://nibrun.com), with a persistent, writable `DATA_FOLDER`; its `NIBRUN_HOSTNAME`
automatically enables webhook mode.

## Development

```bash
bun test
```

Delete `miniapp/` for a bot-only project. Development, checks, and builds continue to work.
