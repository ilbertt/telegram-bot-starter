import { afterAll, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dataFolder = mkdtempSync(join(tmpdir(), 'telegram-bot-api-'));
process.env.DATA_FOLDER = dataFolder;
process.env.TELEGRAM_BOT_TOKEN = '123456789:test-token';
process.env.TELEGRAM_WEBHOOK_SECRET = 'test_secret';

const [{ Bot }, { runMigrations }, { createApp }, { signInitData }, { botInfo }] =
  await Promise.all([
    import('grammy'),
    import('#db/migrate.ts'),
    import('#app.ts'),
    import('#lib/telegram-init-data.ts'),
    import('./helpers.ts'),
  ]);
await runMigrations();
const bot = new Bot('123456789:test-token', { botInfo });
const app = createApp(bot as never);

function authorization(): string {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: 'api-test',
    user: JSON.stringify({ id: 42, first_name: 'Ada' }),
  });
  params.set('hash', signInitData(params, process.env.TELEGRAM_BOT_TOKEN!));
  return `tma ${params.toString()}`;
}

test('protected API rejects an unauthenticated request', async () => {
  const response = await app.handle(new Request('http://localhost/api/reminders'));
  expect(response.status).toBe(401);
});

test('signed Telegram init data authenticates reminders requests', async () => {
  const auth = authorization();
  const created = await app.handle(
    new Request('http://localhost/api/reminders', {
      method: 'POST',
      headers: { authorization: auth, 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'API reminder', dueAt: new Date(Date.now() + 60_000) }),
    }),
  );
  expect(created.status).toBe(201);
  const listed = await app.handle(
    new Request('http://localhost/api/reminders', { headers: { authorization: auth } }),
  );
  expect(listed.status).toBe(200);
  expect(await listed.json()).toHaveLength(1);
});

test('webhook rejects the wrong secret', async () => {
  const response = await app.handle(
    new Request('http://localhost/api/telegram/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': 'wrong' },
      body: JSON.stringify({ update_id: 1 }),
    }),
  );
  expect(response.status).toBe(401);
});

afterAll(() => rmSync(dataFolder, { recursive: true, force: true }));
