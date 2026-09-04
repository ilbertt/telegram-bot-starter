import { Elysia } from 'elysia';
import { env } from '#lib/env.ts';
import { UnauthorizedError } from '#lib/errors.ts';
import { verifyInitData } from '#lib/telegram-init-data.ts';
import { ServicesPlugin } from '#services/plugins.ts';

export const TELEGRAM_SECURITY_SCHEME = 'telegramMiniApp';

function rawInitData(request: Request): string {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('tma ')) {
    return authorization.slice(4);
  }
  if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
    return new URL(request.url).searchParams.get('initData') ?? '';
  }
  throw new UnauthorizedError();
}

export const telegramAuthPlugin = new Elysia({ name: 'telegram-auth' }).use(ServicesPlugin).macro({
  telegramAuth: {
    detail: { security: [{ [TELEGRAM_SECURITY_SCHEME]: [] }] },
    async resolve({ request, services }) {
      const user = verifyInitData({
        raw: rawInitData(request),
        botToken: env.TELEGRAM_BOT_TOKEN,
        maxAgeSeconds: env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS,
      });
      await services.users.upsert(user);
      return { user };
    },
  },
});
