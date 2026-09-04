import { expect, test } from 'bun:test';
import { sessionKey } from '#bot/session.ts';
import { SessionRepository } from '#repositories/session.repository.ts';
import { testDatabase } from './helpers.ts';

test('session adapter survives reconstruction', async () => {
  const { db } = await testDatabase();
  const first = new SessionRepository(db);
  await first.write('group:user', { flow: { state: 'awaiting_due' } });
  const reconstructed = new SessionRepository(db);
  expect(await reconstructed.read('group:user')).toEqual({ flow: { state: 'awaiting_due' } });
});

test('session keys isolate two users in one group', () => {
  const context = (userId: number) => ({ chat: { id: -42 }, from: { id: userId } });
  expect(sessionKey(context(1) as never)).toBe('-42:1');
  expect(sessionKey(context(2) as never)).toBe('-42:2');
  expect(sessionKey({ chat: { id: -42 } } as never)).toBeUndefined();
});
