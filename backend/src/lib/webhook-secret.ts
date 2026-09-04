import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SECRET_FILE = 'telegram-webhook-secret';
const SECRET_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

export function loadWebhookSecret({
  dataFolder,
  environmentSecret,
}: {
  dataFolder: string;
  environmentSecret?: string;
}): string {
  if (environmentSecret) {
    if (!SECRET_PATTERN.test(environmentSecret)) {
      throw new Error('Invalid TELEGRAM_WEBHOOK_SECRET');
    }
    return environmentSecret;
  }
  const path = join(dataFolder, SECRET_FILE);
  if (existsSync(path)) {
    return readFileSync(path, 'utf8').trim();
  }
  const secret = crypto.randomUUID().replaceAll('-', '_');
  writeFileSync(path, secret, { mode: 0o600, flag: 'wx' });
  return secret;
}
