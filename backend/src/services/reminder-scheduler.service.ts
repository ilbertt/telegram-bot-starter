import type { Api } from 'grammy';
import { createLogger } from '#lib/logger.ts';
import type { RemindersService } from '#services/reminders.service.ts';

export class ReminderScheduler {
  private job: Bun.CronJob | null = null;
  private running = false;
  private readonly logger = createLogger('scheduler');

  constructor(
    private readonly reminders: RemindersService,
    private readonly api: Pick<Api, 'sendMessage'>,
  ) {}

  start(): void {
    if (this.job) {
      return;
    }
    void this.runTick();
    this.job = Bun.cron('* * * * *', () => this.runTick());
  }

  stop(): void {
    this.job?.stop();
    this.job = null;
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
