import { createHmac, timingSafeEqual } from 'node:crypto';
import type { User } from 'grammy/types';
import { UnauthorizedError } from '#lib/errors.ts';

const TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = 86_400;

function dataCheckString(params: URLSearchParams): string {
  return [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

export function signInitData(params: URLSearchParams, botToken: string): string {
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  return createHmac('sha256', secret).update(dataCheckString(params)).digest('hex');
}

export function verifyInitData({
  raw,
  botToken,
  maxAgeSeconds = TELEGRAM_INIT_DATA_MAX_AGE_SECONDS,
  now = new Date(),
}: {
  raw: string;
  botToken: string;
  maxAgeSeconds?: number;
  now?: Date;
}): User {
  try {
    const params = new URLSearchParams(raw);
    const suppliedHash = params.get('hash');
    const authDateRaw = params.get('auth_date');
    const userRaw = params.get('user');
    if (!suppliedHash || !/^[a-f\d]{64}$/i.test(suppliedHash) || !authDateRaw || !userRaw) {
      throw new Error('missing fields');
    }
    const expectedHash = signInitData(params, botToken);
    const supplied = Buffer.from(suppliedHash, 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      throw new Error('invalid signature');
    }
    const authDate = Number(authDateRaw);
    if (!Number.isSafeInteger(authDate)) {
      throw new Error('invalid auth date');
    }
    const ageSeconds = now.getTime() / 1000 - authDate;
    if (ageSeconds < -30 || ageSeconds > maxAgeSeconds) {
      throw new Error('expired');
    }
    const user = JSON.parse(userRaw) as Partial<User>;
    if (!Number.isSafeInteger(user.id) || typeof user.first_name !== 'string') {
      throw new Error('invalid user');
    }
    return { ...user, is_bot: false } as User;
  } catch {
    throw new UnauthorizedError('Invalid or expired Telegram init data');
  }
}
