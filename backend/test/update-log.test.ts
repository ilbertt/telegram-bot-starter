import { expect, test } from 'bun:test';
import { Api, Context } from 'grammy';
import { formatTelegramUpdate } from '#bot/update-log.ts';
import { botInfo, messageUpdate } from './helpers.ts';

test('formats command metadata without logging message contents', () => {
  const update = messageUpdate({
    updateId: 12,
    userId: 7,
    username: 'alice',
    chatId: -10,
    text: '/remind@telegram_bot',
    command: true,
  });
  const ctx = new Context(update, new Api('123456789:test-token'), botInfo);

  expect(formatTelegramUpdate(ctx)).toBe(
    'update received update_id=12 type=message command=/remind username=@alice user_id=7 chat_id=-10',
  );
});
