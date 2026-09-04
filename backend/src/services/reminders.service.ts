import { BadRequestError, NotFoundError } from '#lib/errors.ts';
import { uuidv7 } from '#lib/id.ts';
import type { ReminderRecord } from '#reminders/reminder.ts';
import type { RemindersRepository } from '#repositories/reminders.repository.ts';
import type { EventsService } from '#services/events.service.ts';
import { Service } from '#services/service.ts';

const RELATIVE_PATTERN = /^(\d+)([mhd])$/i;
const UNIT_MS = { m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

export function parseDueAt(input: string, now = new Date()): Date | null {
  const relative = RELATIVE_PATTERN.exec(input.trim());
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2]?.toLowerCase() as keyof typeof UNIT_MS;
    const result = new Date(now.getTime() + amount * UNIT_MS[unit]);
    return amount > 0 ? result : null;
  }
  const parsed = new Date(input.trim());
  return Number.isNaN(parsed.getTime()) || parsed <= now ? null : parsed;
}

export class RemindersService extends Service {
  constructor(
    private readonly remindersRepo: RemindersRepository,
    private readonly events: EventsService,
  ) {
    super();
  }

  parseDueAt(input: string, now?: Date): Date {
    const dueAt = parseDueAt(input, now);
    if (!dueAt) {
      throw new BadRequestError('Use a future ISO-8601 timestamp or 10m, 2h, or 3d');
    }
    return dueAt;
  }

  async create({
    userId,
    chatId,
    text,
    dueAt,
  }: {
    userId: string;
    chatId: string;
    text: string;
    dueAt: Date;
  }): Promise<ReminderRecord> {
    const normalized = text.trim();
    if (!normalized) {
      throw new BadRequestError('Reminder text is required');
    }
    if (dueAt <= new Date()) {
      throw new BadRequestError('Reminder must be in the future');
    }
    const reminder = await this.remindersRepo.create({
      id: uuidv7(),
      userId,
      chatId,
      text: normalized,
      dueAt,
      sentAt: null,
      createdAt: new Date(),
    });
    this.events.publish({ userId, event: { type: 'reminder.created', reminder } });
    return reminder;
  }

  list(userId: string): Promise<ReminderRecord[]> {
    return this.remindersRepo.listForUser(userId);
  }

  async delete({ id, userId }: { id: string; userId: string }): Promise<void> {
    if (!(await this.remindersRepo.deleteForUser({ id, userId }))) {
      throw new NotFoundError('Reminder not found');
    }
    this.events.publish({ userId, event: { type: 'reminder.deleted', reminderId: id } });
  }

  listDue(now = new Date()): Promise<ReminderRecord[]> {
    return this.remindersRepo.listDue(now);
  }

  async markSent(reminder: ReminderRecord): Promise<void> {
    const sentAt = new Date();
    if (await this.remindersRepo.markSent({ id: reminder.id, sentAt })) {
      this.events.publish({
        userId: reminder.userId,
        event: { type: 'reminder.sent', reminderId: reminder.id, sentAt },
      });
    }
  }
}
