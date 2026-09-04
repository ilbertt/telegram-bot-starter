import { t } from 'elysia';
import { ReminderSchema } from '#routes/api/reminders/model.ts';

export const ClientMessageSchema = t.Object({ type: t.Literal('ping') });
export const ServerMessageSchema = t.Union([
  t.Object({ type: t.Literal('pong') }),
  t.Object({ type: t.Literal('reminder.created'), reminder: ReminderSchema }),
  t.Object({ type: t.Literal('reminder.deleted'), reminderId: t.String() }),
  t.Object({ type: t.Literal('reminder.sent'), reminderId: t.String(), sentAt: t.Date() }),
]);
