import { expect, test } from 'bun:test';
import { ReminderScheduler } from '#services/reminder-scheduler.service.ts';
import { testDatabase, testServices } from './helpers.ts';

test('repository scopes list and delete operations by owner', async () => {
  const { db } = await testDatabase();
  const { remindersRepo, services } = testServices(db);
  await services.users.upsert({ id: 1, is_bot: false, first_name: 'One' });
  await services.users.upsert({ id: 2, is_bot: false, first_name: 'Two' });
  const reminder = await services.reminders.create({
    userId: '1',
    chatId: '1',
    text: 'Owned',
    dueAt: new Date(Date.now() + 60_000),
  });
  expect(await remindersRepo.listForUser('2')).toEqual([]);
  expect(await remindersRepo.deleteForUser({ id: reminder.id, userId: '2' })).toBe(false);
  expect(await remindersRepo.listForUser('1')).toHaveLength(1);
});

test('scheduler marks accepted reminders sent and retries failures', async () => {
  const { db } = await testDatabase();
  const { remindersRepo, services } = testServices(db);
  await services.users.upsert({ id: 1, is_bot: false, first_name: 'One' });
  const base = {
    userId: '1',
    chatId: '1',
    dueAt: new Date('2026-09-04T11:00:00Z'),
    sentAt: null,
    createdAt: new Date('2026-09-04T10:00:00Z'),
  };
  await remindersRepo.create({ ...base, id: 'ok', text: 'Accepted' });
  const sent: string[] = [];
  const scheduler = new ReminderScheduler(
    services.reminders,
    {
      sendMessage(_chatId, text) {
        sent.push(text);
        return Promise.resolve({} as never);
      },
    },
    1_000,
  );
  await scheduler.tick(new Date('2026-09-04T12:00:00Z'));
  expect(sent).toEqual(['⏰ Accepted']);
  expect((await remindersRepo.listForUser('1'))[0]?.sentAt).not.toBeNull();

  await remindersRepo.create({ ...base, id: 'retry', text: 'Retry' });
  const failing = new ReminderScheduler(
    services.reminders,
    {
      sendMessage() {
        return Promise.reject(new Error('Telegram unavailable'));
      },
    },
    1_000,
  );
  await failing.tick(new Date('2026-09-04T12:00:00Z'));
  expect(
    (await remindersRepo.listForUser('1')).find((item) => item.id === 'retry')?.sentAt,
  ).toBeNull();
});
