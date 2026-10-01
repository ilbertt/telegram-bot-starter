import { type RunnerHandle, run } from '@grammyjs/runner';
import type { CronJob } from 'bun';
import { sql } from '#db/client.ts';
import { runMigrations } from '#db/migrate.ts';
import { env, resolvedBotMode } from '#lib/env.ts';
import { createLogger } from '#lib/logger.ts';

await runMigrations();
// Cron invocations finish before the bot runtime or HTTP app is loaded.
const { registerCrons, runCronJob } = await import('#crons.ts');
if (!(await runCronJob())) {
  const logger = createLogger('main');
  const { telegramBot } = await import('#bot/runtime.ts');
  let runner: RunnerHandle | null = null;
  let localJobs: CronJob[] = [];

  if (!env.TEST_ONLY_SKIP_TELEGRAM) {
    await telegramBot.init();
    const { telegramCommands } = await import('#bot/commands.ts');
    await telegramBot.api.setMyCommands(telegramCommands());
    localJobs = await registerCrons(import.meta.path);
  }

  const { createApp } = await import('#app.ts');
  const { server } = createApp(telegramBot).listen({ port: env.PORT, hostname: '0.0.0.0' });
  logger.info(`listening on ${server!.url.origin}`);

  if (!env.TEST_ONLY_SKIP_TELEGRAM) {
    const mode = resolvedBotMode();
    if (mode === 'polling') {
      await telegramBot.api.deleteWebhook({ drop_pending_updates: false });
      runner = run(telegramBot);
      logger.info('bot running with long polling');
    } else {
      if (!env.PUBLIC_ORIGIN) {
        throw new Error('Webhook mode requires a public HTTPS BASE_URL');
      }
      const webhookUrl = new URL('/api/telegram/webhook', env.PUBLIC_ORIGIN).toString();
      await telegramBot.api.setWebhook(webhookUrl, {
        secret_token: env.TELEGRAM_WEBHOOK_SECRET,
        drop_pending_updates: false,
      });
      await telegramBot.api.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: 'Reminders',
          web_app: { url: env.PUBLIC_ORIGIN.toString() },
        },
      });
      logger.info(`bot running with webhook ${webhookUrl}`);
    }
  }

  let stopping = false;
  async function shutdown(signal: string): Promise<void> {
    if (stopping) {
      return;
    }
    stopping = true;
    logger.info(`received ${signal}; shutting down`);
    for (const job of localJobs) {
      job.stop();
    }
    await runner?.stop();
    await server?.stop(true);
    await sql.close();
  }

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => void shutdown(signal));
  }
}
