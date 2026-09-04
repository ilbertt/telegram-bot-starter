import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import type { Bot } from 'grammy';
import type { BotContext } from '#bot/context.ts';
import { elysiaErrorHandler } from '#lib/errors.ts';
import { requestResponsePlugin } from '#lib/request-response.ts';
import { TELEGRAM_SECURITY_SCHEME } from '#lib/telegram-auth.ts';
import { createApiController } from '#routes/api/controller.ts';
import { FrontendAssetsController, FrontendFallbackController } from '#routes/controller.ts';

export function createApp(bot: Bot<BotContext>) {
  return new Elysia()
    .use(FrontendAssetsController)
    .onError(elysiaErrorHandler)
    .use(requestResponsePlugin)
    .use(
      openapi({
        path: '/openapi',
        documentation: {
          info: {
            title: 'bun-telegram-bot-starter API',
            version: '1.0.0',
            description: 'Stateful Telegram bot and optional Mini App API.',
          },
          components: {
            securitySchemes: {
              [TELEGRAM_SECURITY_SCHEME]: {
                type: 'apiKey',
                in: 'header',
                name: 'Authorization',
                description: '`tma <raw Telegram.WebApp.initData>`',
              },
            },
          },
        },
      }),
    )
    .use(createApiController(bot))
    .use(FrontendFallbackController);
}
