import { expect, test } from 'bun:test';
import { withTypes } from '@ilbertt/bun-sqlgen';
import { SQL } from 'bun';
import type { Queries } from '#db/queries.gen.ts';
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

test('overlapping processes only deliver a claimed reminder once', async () => {
  const { db, filename } = await testDatabase();
  const secondDb = withTypes<Queries>(new SQL({ adapter: 'sqlite', filename }));
  const { services, remindersRepo } = testServices(db);
  const second = testServices(secondDb);
  await services.users.upsert({ id: 1, is_bot: false, first_name: 'One' });
  await remindersRepo.create({
    id: 'overlap',
    userId: '1',
    chatId: '1',
    text: 'Once',
    dueAt: new Date(Date.now() - 60_000),
    sentAt: null,
    createdAt: new Date(),
  });
  const sending = Promise.withResolvers<void>();
  const accepted = Promise.withResolvers<never>();
  const sent: string[] = [];
  const firstScheduler = new ReminderScheduler(services.reminders, {
    sendMessage(_chatId, text) {
      sent.push(text);
      sending.resolve();
      return accepted.promise;
    },
  });
  const secondScheduler = new ReminderScheduler(second.services.reminders, {
    sendMessage(_chatId, text) {
      sent.push(text);
      return Promise.resolve({} as never);
    },
  });
  try {
    const firstTick = firstScheduler.tick();
    await sending.promise;
    await secondScheduler.tick();
    expect(sent).toEqual(['⏰ Once']);
    accepted.resolve({} as never);
    await firstTick;
    expect((await remindersRepo.listForUser('1'))[0]?.sentAt).not.toBeNull();
  } finally {
    accepted.resolve({} as never);
    await db.close();
    await secondDb.close();
  }
});

test('abandoned delivery claims expire and old or foreign claims cannot mark sent', async () => {
  const { db } = await testDatabase();
  const { services, remindersRepo } = testServices(db);
  await services.users.upsert({ id: 1, is_bot: false, first_name: 'One' });
  await remindersRepo.create({
    id: 'crashed',
    userId: '1',
    chatId: '1',
    text: 'Recover',
    dueAt: new Date('2026-09-04T11:00:00Z'),
    sentAt: null,
    createdAt: new Date(),
  });
  const reminder = (await services.reminders.list('1'))[0]!;
  const firstToken = await services.reminders.claimDelivery(
    reminder,
    new Date('2026-09-04T12:00:00Z'),
  );
  expect(firstToken).not.toBeNull();
  expect(
    await services.reminders.claimDelivery(reminder, new Date('2026-09-04T12:09:00Z')),
  ).toBeNull();
  const token = await services.reminders.claimDelivery(reminder, new Date('2026-09-04T12:10:00Z'));
  expect(token).not.toBeNull();
  await services.reminders.markSent(reminder, firstToken!);
  expect((await services.reminders.list('1'))[0]?.sentAt).toBeNull();
  await services.reminders.markSent({ ...reminder, userId: '2' }, token!);
  expect((await services.reminders.list('1'))[0]?.sentAt).toBeNull();
  await services.reminders.releaseDelivery(reminder, firstToken!);
  expect(
    await services.reminders.claimDelivery(reminder, new Date('2026-09-04T12:11:00Z')),
  ).toBeNull();
  await services.reminders.markSent(reminder, token!);
  expect((await services.reminders.list('1'))[0]?.sentAt).not.toBeNull();
  await db.close();
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
  const scheduler = new ReminderScheduler(services.reminders, {
    sendMessage(_chatId, text) {
      sent.push(text);
      return Promise.resolve({} as never);
    },
  });
  await scheduler.tick(new Date('2026-09-04T12:00:00Z'));
  expect(sent).toEqual(['⏰ Accepted']);
  expect((await remindersRepo.listForUser('1'))[0]?.sentAt).not.toBeNull();

  await remindersRepo.create({ ...base, id: 'retry', text: 'Retry' });
  const failing = new ReminderScheduler(services.reminders, {
    sendMessage() {
      return Promise.reject(new Error('Telegram unavailable'));
    },
  });
  await expect(failing.tick(new Date('2026-09-04T12:00:00Z'))).rejects.toThrow(
    'Reminder deliveries failed',
  );
  expect(
    (await remindersRepo.listForUser('1')).find((item) => item.id === 'retry')?.sentAt,
  ).toBeNull();
  await scheduler.tick();
  expect(sent).toEqual(['⏰ Accepted', '⏰ Retry']);
});
