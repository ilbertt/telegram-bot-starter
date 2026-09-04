import { Elysia, StatusMap } from 'elysia';
import { ErrorResponseSchema } from '#lib/errors.ts';
import { telegramAuthPlugin } from '#lib/telegram-auth.ts';
import { TelegramUserSchema } from '#routes/api/me/model.ts';

export const MeController = new Elysia()
  .use(telegramAuthPlugin)
  .guard({
    telegramAuth: true,
    response: { [StatusMap.Unauthorized]: ErrorResponseSchema },
  })
  .get('/me', ({ user }) => user, {
    response: { [StatusMap.OK]: TelegramUserSchema },
    detail: { tags: ['Users'], summary: 'Get the authenticated Telegram user' },
  });
