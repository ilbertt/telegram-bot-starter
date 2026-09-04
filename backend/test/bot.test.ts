import { expect, test } from 'bun:test';
import { createBot } from '#bot/bot.ts';
import { callbackCodec } from '#bot/callbacks/codec.ts';
import {
  botInfo,
  messageUpdate,
  successfulTelegramFetch,
  testDatabase,
  testServices,
} from './helpers.ts';

test('synthetic updates drive the persisted flow and /cancel', async () => {
  const { db } = await testDatabase();
  const { services, sessions } = testServices(db);
  const bot = createBot({
    token: '123456789:test-token',
    services,
    sessions,
    fetch: successfulTelegramFetch,
    botInfo,
  });
  await bot.handleUpdate(
    messageUpdate({ updateId: 1, userId: 7, chatId: -10, text: '/remind', command: true }),
  );
  expect((await sessions.read('-10:7'))?.flow?.state).toBe('awaiting_due');
  await bot.handleUpdate(messageUpdate({ updateId: 2, userId: 7, chatId: -10, text: '10m' }));
  expect((await sessions.read('-10:7'))?.flow?.state).toBe('awaiting_text');
  await bot.handleUpdate(
    messageUpdate({ updateId: 3, userId: 7, chatId: -10, text: 'Review launch' }),
  );
  expect((await sessions.read('-10:7'))?.flow?.state).toBe('awaiting_confirmation');
  await bot.handleUpdate(
    messageUpdate({ updateId: 4, userId: 7, chatId: -10, text: '/cancel', command: true }),
  );
  expect((await sessions.read('-10:7'))?.flow).toBeNull();
});

test('callback deletion remains owner scoped', async () => {
  const { db } = await testDatabase();
  const { services, sessions } = testServices(db);
  await services.users.upsert({ id: 1, is_bot: false, first_name: 'Owner' });
  await services.users.upsert({ id: 2, is_bot: false, first_name: 'Attacker' });
  const reminder = await services.reminders.create({
    userId: '1',
    chatId: '-10',
    text: 'Private',
    dueAt: new Date(Date.now() + 60_000),
  });
  const bot = createBot({
    token: '123456789:test-token',
    services,
    sessions,
    fetch: successfulTelegramFetch,
    botInfo,
  });
  await bot.handleUpdate({
    update_id: 9,
    callback_query: {
      id: 'query',
      chat_instance: 'instance',
      from: { id: 2, is_bot: false, first_name: 'Attacker' },
      data: callbackCodec.delete(reminder.id),
      message: {
        message_id: 8,
        date: Math.floor(Date.now() / 1000),
        chat: { id: -10, type: 'group' },
        text: 'Private',
      },
    },
  });
  expect(await services.reminders.list('1')).toHaveLength(1);
});
