import { t } from 'elysia';
import type { ReminderRecord } from '#reminders/reminder.ts';

export const ReminderSchema = t.Object({
  id: t.String(),
  userId: t.String(),
  chatId: t.String(),
  text: t.String(),
  dueAt: t.Date(),
  sentAt: t.Nullable(t.Date()),
  createdAt: t.Date(),
});

export const CreateReminderBodySchema = t.Object({
  text: t.String({ minLength: 1, maxLength: 500 }),
  dueAt: t.Date(),
  chatId: t.Optional(t.String()),
});

export function toReminderResponse(reminder: ReminderRecord) {
  return reminder;
}
