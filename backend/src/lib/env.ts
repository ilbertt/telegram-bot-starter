import { resolve } from 'node:path';
import { ensureDir } from '#lib/filesystem.ts';
import { loadWebhookSecret } from '#lib/webhook-secret.ts';

export type BotMode = 'auto' | 'polling' | 'webhook';
const DEFAULT_PORT = 3000;

function publicOrigin(): URL | null {
  const raw =
    process.env.BASE_URL ||
    (process.env.NIBRUN_HOSTNAME ? `https://${process.env.NIBRUN_HOSTNAME}` : '');
  if (!raw) {
    return null;
  }
  const url = new URL(raw);
  if (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    return null;
  }
  return url;
}

function botMode(value: string | undefined): BotMode {
  if (!value || value === 'auto') {
    return 'auto';
  }
  if (value === 'polling' || value === 'webhook') {
    return value;
  }
  throw new Error('BOT_MODE must be auto, polling, or webhook');
}

const dataFolder = resolve(process.env.DATA_FOLDER || './data');
ensureDir(dataFolder);
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export const env = {
  PORT: Number(process.env.PORT || DEFAULT_PORT),
  DATA_FOLDER: dataFolder,
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_WEBHOOK_SECRET: loadWebhookSecret({
    dataFolder,
    environmentSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  }),
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: Number(
    process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS || 86_400,
  ),
  REMINDER_POLL_INTERVAL_MS: Number(process.env.REMINDER_POLL_INTERVAL_MS || 5_000),
  BOT_MODE: botMode(process.env.BOT_MODE),
  PUBLIC_ORIGIN: publicOrigin(),
  TEST_ONLY_SKIP_TELEGRAM: process.env.TEST_ONLY_SKIP_TELEGRAM === 'true',
} as const;

export function resolvedBotMode(): Exclude<BotMode, 'auto'> {
  if (env.BOT_MODE !== 'auto') {
    return env.BOT_MODE;
  }
  return env.PUBLIC_ORIGIN ? 'webhook' : 'polling';
}
