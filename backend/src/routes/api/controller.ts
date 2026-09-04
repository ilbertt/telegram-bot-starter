import { Elysia } from 'elysia';
import type { Bot } from 'grammy';
import type { BotContext } from '#bot/context.ts';
import { RoutePrefix } from '#lib/routes/prefixes.ts';
import { EventsController } from '#routes/api/events/controller.ts';
import { HealthController } from '#routes/api/health/controller.ts';
import { MeController } from '#routes/api/me/controller.ts';
import { RemindersController } from '#routes/api/reminders/controller.ts';
import { createTelegramWebhookController } from '#routes/api/telegram/webhook/controller.ts';

export function createApiController(bot: Bot<BotContext>) {
  return new Elysia({ prefix: RoutePrefix.Api })
    .use(HealthController)
    .use(MeController)
    .use(RemindersController)
    .use(EventsController)
    .use(createTelegramWebhookController(bot));
}
