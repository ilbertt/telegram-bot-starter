import type { Api } from 'grammy';
import { createLogger } from '#lib/logger.ts';
import type { RemindersService } from '#services/reminders.service.ts';

const REMINDER_SCAN_INTERVAL_MS = 5_000;

export class ReminderScheduler {
  private timer: Timer | null = null;
  private running = false;
  private readonly logger = createLogger('scheduler');

  constructor(
    private readonly reminders: RemindersService,
    private readonly api: Pick<Api, 'sendMessage'>,
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }
    void this.runTick();
    this.timer = setInterval(() => void this.runTick(), REMINDER_SCAN_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = null;
  }

  private async runTick(): Promise<void> {
    try {
      await this.tick();
    } catch (error) {
      this.logger.error('failed reminder scan; will retry', error);
    }
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
