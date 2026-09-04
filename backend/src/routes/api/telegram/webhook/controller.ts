import { Elysia, StatusMap, t } from 'elysia';
import type { Bot } from 'grammy';
import type { BotContext } from '#bot/context.ts';
import { env } from '#lib/env.ts';
import { ErrorResponseSchema, UnauthorizedError } from '#lib/errors.ts';
import { createLogger } from '#lib/logger.ts';

const logger = createLogger('telegram-webhook');

export function createTelegramWebhookController(bot: Bot<BotContext>) {
  return new Elysia().post(
    '/telegram/webhook',
    ({ body, headers, status }) => {
      if (headers['x-telegram-bot-api-secret-token'] !== env.TELEGRAM_WEBHOOK_SECRET) {
        throw new UnauthorizedError();
      }
      void bot.handleUpdate(body).catch((error) => logger.error('update failed', error));
      return status(StatusMap.OK, { ok: true as const });
    },
    {
      body: t.Any(),
      headers: t.Object({
        'x-telegram-bot-api-secret-token': t.Optional(t.String()),
      }),
      response: {
        [StatusMap.OK]: t.Object({ ok: t.Literal(true) }),
        [StatusMap.Unauthorized]: ErrorResponseSchema,
      },
      detail: {
        tags: ['Telegram'],
        summary: 'Receive a Telegram webhook update',
        description: 'Telegram must provide the configured secret-token header.',
      },
    },
  );
}
