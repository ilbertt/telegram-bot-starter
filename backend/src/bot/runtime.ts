import { createBot } from '#bot/bot.ts';
import { env } from '#lib/env.ts';
import { services, sessionRepository } from '#services/container.ts';

export const telegramBot = createBot({
  token: env.TELEGRAM_BOT_TOKEN,
  services,
  sessions: sessionRepository,
});
