import type { Api } from 'grammy';
import { createLogger } from '#lib/logger.ts';
import type { RemindersService } from '#services/reminders.service.ts';

export class ReminderScheduler {
  private running = false;
  private readonly logger = createLogger('scheduler');

  constructor(
    private readonly reminders: RemindersService,
    private readonly api: Pick<Api, 'sendMessage'>,
  ) {}

  async tick(now = new Date()): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      const failures: unknown[] = [];
      for (const reminder of await this.reminders.listDue(now)) {
        const deliveryToken = await this.reminders.claimDelivery(reminder);
        if (!deliveryToken) {
          continue;
        }
        try {
          await this.api.sendMessage(reminder.chatId, `⏰ ${reminder.text}`);
          await this.reminders.markSent(reminder, deliveryToken);
        } catch (error) {
          await this.reminders.releaseDelivery(reminder, deliveryToken);
          this.logger.error(`failed reminder ${reminder.id}; will retry`, error);
          failures.push(error);
        }
      }
      if (failures.length > 0) {
        throw new AggregateError(failures, 'Reminder deliveries failed; will retry next run');
      }
    } finally {
      this.running = false;
    }
  }
}
