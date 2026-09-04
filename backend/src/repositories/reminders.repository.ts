import type { ReminderRecord } from '#reminders/reminder.ts';
import { Repository } from '#repositories/repository.ts';

function toRecord(row: {
  id: string;
  user_id: string;
  chat_id: string;
  text: string;
  due_at: string;
  sent_at: string | null;
  created_at: string;
}): ReminderRecord {
  return {
    id: row.id,
    userId: row.user_id,
    chatId: row.chat_id,
    text: row.text,
    dueAt: new Date(row.due_at),
    sentAt: row.sent_at ? new Date(row.sent_at) : null,
    createdAt: new Date(row.created_at),
  };
}

export class RemindersRepository extends Repository {
  async create(reminder: ReminderRecord): Promise<ReminderRecord> {
    await this.sql.CreateReminder`
      INSERT INTO reminder (id, user_id, chat_id, text, due_at, sent_at, created_at)
      VALUES (
        ${reminder.id}, ${reminder.userId}, ${reminder.chatId}, ${reminder.text},
        ${reminder.dueAt.toISOString()}, ${reminder.sentAt?.toISOString() ?? null},
        ${reminder.createdAt.toISOString()}
      )
    `;
    return reminder;
  }

  async listForUser(userId: string): Promise<ReminderRecord[]> {
    const rows = await this.sql.ListUserReminders`
      SELECT id, user_id, chat_id, text, due_at, sent_at, created_at
      FROM reminder
      WHERE user_id = ${userId}
      ORDER BY due_at ASC
    `;
    return rows.map(toRecord);
  }

  async deleteForUser({ id, userId }: { id: string; userId: string }): Promise<boolean> {
    const rows = await this.sql.DeleteUserReminder`
      DELETE FROM reminder WHERE id = ${id} AND user_id = ${userId} RETURNING id
    `;
    return rows.length === 1;
  }

  async listDue(now: Date): Promise<ReminderRecord[]> {
    const rows = await this.sql.ListDueReminders`
      SELECT id, user_id, chat_id, text, due_at, sent_at, created_at
      FROM reminder
      WHERE sent_at IS NULL AND due_at <= ${now.toISOString()}
      ORDER BY due_at ASC
    `;
    return rows.map(toRecord);
  }

  async markSent({ id, sentAt }: { id: string; sentAt: Date }): Promise<boolean> {
    const rows = await this.sql.MarkReminderSent`
      UPDATE reminder SET sent_at = ${sentAt.toISOString()}
      WHERE id = ${id} AND sent_at IS NULL
      RETURNING id
    `;
    return rows.length === 1;
  }
}
