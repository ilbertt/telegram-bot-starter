# bun-telegram-bot-starter

[![Deploy on nibrun](https://nibrun.com/button.svg)](https://app.nibrun.com/deploy?name=bun-telegram-bot-starter&port=3000)

A Bun starter for stateful Telegram bots using grammY, Elysia, and SQLite. It builds to one
Linux x64 binary with migrations and the optional React Mini App embedded.

## Getting started

Create a bot with [@BotFather](https://t.me/BotFather), then add its token to `backend/.env`.

```bash
bun install
cp backend/.env.example backend/.env
bun dev
```

Local development uses long polling. Use a separate development bot so it does not conflict with
the production bot using the same token.

## Build and deploy

```bash
bun test
bun run build
```

The Linux x64 binary is written to `backend/dist/app`. Deploy it to nibrun with a persistent,
writable `DATA_FOLDER`; SQLite data and the generated webhook secret are stored there. nibrun's
`NIBRUN_HOSTNAME` automatically enables webhook mode.

Delete `miniapp/` for a bot-only project. Development, checks, and builds continue to work.
