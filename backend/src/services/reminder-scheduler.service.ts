import type { Api } from 'grammy';
import { createLogger } from '#lib/logger.ts';
import type { RemindersService } from '#services/reminders.service.ts';

export class ReminderScheduler {
  private timer: Timer | null = null;
  private running = false;
  private readonly logger = createLogger('scheduler');

  constructor(
    private readonly reminders: RemindersService,
    private readonly api: Pick<Api, 'sendMessage'>,
    private readonly intervalMs: number,
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = null;
  }

  async tick(now = new Date()): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      for (const reminder of await this.reminders.listDue(now)) {
        try {
          await this.api.sendMessage(reminder.chatId, `⏰ ${reminder.text}`);
          await this.reminders.markSent(reminder);
        } catch (error) {
          this.logger.error(`failed reminder ${reminder.id}; will retry`, error);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
