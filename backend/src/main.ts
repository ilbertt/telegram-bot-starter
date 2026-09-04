import { type RunnerHandle, run } from '@grammyjs/runner';
import { telegramCommands } from '#bot/commands.ts';
import { telegramBot } from '#bot/runtime.ts';
import { sql } from '#db/client.ts';
import { runMigrations } from '#db/migrate.ts';
import { env, resolvedBotMode } from '#lib/env.ts';
import { createLogger } from '#lib/logger.ts';
import { services } from '#services/container.ts';
import { ReminderScheduler } from '#services/reminder-scheduler.service.ts';

await runMigrations();
const logger = createLogger('main');
let runner: RunnerHandle | null = null;
let scheduler: ReminderScheduler | null = null;

if (!env.TEST_ONLY_SKIP_TELEGRAM) {
  await telegramBot.init();
  await telegramBot.api.setMyCommands(telegramCommands());
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
  scheduler = new ReminderScheduler(
    services.reminders,
    telegramBot.api,
    env.REMINDER_POLL_INTERVAL_MS,
  );
  scheduler.start();
}

let stopping = false;
async function shutdown(signal: string): Promise<void> {
  if (stopping) {
    return;
  }
  stopping = true;
  logger.info(`received ${signal}; shutting down`);
  scheduler?.stop();
  await runner?.stop();
  await server?.stop(true);
  await sql.close();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => void shutdown(signal));
}
