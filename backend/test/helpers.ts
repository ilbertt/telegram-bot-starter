import { readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type TypedSQL, withTypes } from '@ilbertt/bun-sqlgen';
import { SQL } from 'bun';
import type { Queries } from '#db/queries.gen.ts';
import { AssetsRepository } from '#repositories/assets.repository.ts';
import { HealthRepository } from '#repositories/health.repository.ts';
import { RemindersRepository } from '#repositories/reminders.repository.ts';
import { SessionRepository } from '#repositories/session.repository.ts';
import { UsersRepository } from '#repositories/users.repository.ts';
import { AssetsService } from '#services/assets.service.ts';
import type { BotServices } from '#services/container.ts';
import { EventsService } from '#services/events.service.ts';
import { HealthService } from '#services/health.service.ts';
import { ReminderScheduler } from '#services/reminder-scheduler.service.ts';
import { RemindersService } from '#services/reminders.service.ts';
import { UsersService } from '#services/users.service.ts';

export async function testDatabase(): Promise<{ db: TypedSQL<Queries>; filename: string }> {
  const filename = join(tmpdir(), `telegram-bot-test-${crypto.randomUUID()}.sqlite`);
  const db = withTypes<Queries>(new SQL({ adapter: 'sqlite', filename }));
  await db.unsafe('PRAGMA foreign_keys = ON');
  const migrations = join(import.meta.dir, '../src/db/migrations');
  await db.begin(async (transaction) => {
    for (const name of readdirSync(migrations)
      .filter((name) => name.endsWith('.sql'))
      .sort()) {
      await transaction.unsafe(readFileSync(join(migrations, name), 'utf8'));
    }
  });
  return { db, filename };
}

export function testServices(db: TypedSQL<Queries>): {
  services: BotServices;
  sessions: SessionRepository;
  remindersRepo: RemindersRepository;
} {
  const events = new EventsService();
  const remindersRepo = new RemindersRepository(db);
  const reminders = new RemindersService(remindersRepo, events);
  return {
    sessions: new SessionRepository(db),
    remindersRepo,
    services: {
      assets: new AssetsService(new AssetsRepository(db)),
      events,
      health: new HealthService(new HealthRepository(db)),
      reminders,
      reminderScheduler: new ReminderScheduler(reminders, {
        sendMessage() {
          return Promise.resolve({} as never);
        },
      }),
      users: new UsersService(new UsersRepository(db)),
    },
  };
}

export const botInfo = {
  id: 123_456_789,
  is_bot: true,
  first_name: 'Test Bot',
  username: 'test_bot',
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
} as const;

export function messageUpdate({
  updateId,
  userId,
  username,
  chatId,
  text,
  command = false,
}: {
  updateId: number;
  userId: number;
  username?: string;
  chatId: number;
  text: string;
  command?: boolean;
}) {
  return {
    update_id: updateId,
    message: {
      message_id: updateId,
      date: Math.floor(Date.now() / 1000),
      chat: { id: chatId, type: chatId < 0 ? 'group' : ('private' as const) },
      from: {
        id: userId,
        is_bot: false,
        first_name: `User ${userId}`,
        ...(username ? { username } : {}),
      },
      text,
      ...(command
        ? { entities: [{ offset: 0, length: text.length, type: 'bot_command' as const }] }
        : {}),
    },
  };
}

export const successfulTelegramFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ ok: true, result: true }), {
    headers: { 'content-type': 'application/json' },
  });
