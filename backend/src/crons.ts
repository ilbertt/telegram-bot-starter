import type { CronJob } from 'bun';
import { sql } from '#db/client.ts';
import { env } from '#lib/env.ts';
import { createLogger } from '#lib/logger.ts';
import { services } from '#services/container.ts';

const logger = createLogger('crons');
const jobs = [
  {
    title: 'send-reminders',
    schedule: '* * * * *',
    run: () => services.reminderScheduler.tick(),
  },
];

async function runJob(job: (typeof jobs)[number]): Promise<void> {
  logger.info(`${job.title} started`);
  try {
    await job.run();
    logger.info(`${job.title} completed`);
  } catch (error) {
    logger.error(`${job.title} failed`, error);
    throw error;
  }
}

export async function registerCrons(entrypoint: string): Promise<CronJob[]> {
  const localJobs: CronJob[] = [];
  for (const job of jobs) {
    if (env.NODE_ENV === 'production') {
      // nibrun records the crontab schedule and wakes the app when it is due.
      await Bun.cron(entrypoint, job.schedule, job.title);
    } else {
      localJobs.push(Bun.cron(job.schedule, () => runJob(job).catch(() => {}), { tz: 'UTC' }));
    }
    logger.info(`registered ${job.title}: ${job.schedule}`);
  }
  return localJobs;
}

export async function runCronJob(): Promise<boolean> {
  const argument = process.argv.find((value) => value.startsWith('--cron-title='));
  if (!argument) {
    return false;
  }

  // Bun 1.4.2 compiled binaries receive CLI arguments instead of invoking scheduled().
  // Dispatch before HTTP, Telegram initialization, polling, or cron registration.
  try {
    const title = argument.slice('--cron-title='.length);
    const job = jobs.find((candidate) => candidate.title === title);
    if (!job) {
      throw new Error(`Unknown cron job: ${title}`);
    }
    await runJob(job);
  } finally {
    await sql.close();
  }
  return true;
}
