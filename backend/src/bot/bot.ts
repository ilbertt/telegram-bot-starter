import { sequentialize } from '@grammyjs/runner';
import { Bot, session } from 'grammy';
import type { UserFromGetMe } from 'grammy/types';
import { installCallbackHandlers } from '#bot/callbacks/reminders.ts';
import { installCommands } from '#bot/commands.ts';
import type { BotContext } from '#bot/context.ts';
import { installFlowHandlers } from '#bot/flows/reminder-flow.ts';
import { initialSession, sessionKey } from '#bot/session.ts';
import { formatTelegramUpdate } from '#bot/update-log.ts';
import { createLogger } from '#lib/logger.ts';
import type { SessionRepository } from '#repositories/session.repository.ts';
import type { BotServices } from '#services/container.ts';

const logger = createLogger('bot');

export function createBot({
  token,
  services,
  sessions,
  fetch,
  botInfo,
}: {
  token: string;
  services: BotServices;
  sessions: SessionRepository;
  fetch?: typeof globalThis.fetch;
  botInfo?: UserFromGetMe;
}): Bot<BotContext> {
  const bot = new Bot<BotContext>(token, {
    ...(fetch ? { client: { fetch } } : {}),
    ...(botInfo ? { botInfo } : {}),
  });

  bot.use((ctx, next) => {
    logger.info(formatTelegramUpdate(ctx));
    return next();
  });
  bot.use(sequentialize(sessionKey));
  bot.use(session({ initial: initialSession, storage: sessions, getSessionKey: sessionKey }));
  bot.use(async (ctx, next) => {
    ctx.services = services;
    await next();
  });
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      await ctx.services.users.upsert(ctx.from);
    }
    await next();
  });
  installCommands(bot);
  installFlowHandlers(bot);
  installCallbackHandlers(bot);
  bot.on('message', (ctx) => ctx.reply('Use /remind, /reminders, or /cancel.'));
  bot.catch((error) => logger.error('update failed', error.error));
  return bot;
}
