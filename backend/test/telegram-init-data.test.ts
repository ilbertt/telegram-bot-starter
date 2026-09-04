import { expect, test } from 'bun:test';
import { signInitData, verifyInitData } from '#lib/telegram-init-data.ts';

const token = '123456789:test-token';
const now = new Date('2026-09-04T12:00:00.000Z');

function fixture(user = JSON.stringify({ id: 42, is_bot: false, first_name: 'Ada' })) {
  const params = new URLSearchParams({
    auth_date: String(now.getTime() / 1000),
    query_id: 'fixture',
    user,
  });
  params.set('hash', signInitData(params, token));
  return params.toString();
}

test('verifies deterministic signed init data', () => {
  expect(verifyInitData({ raw: fixture(), botToken: token, now }).id).toBe(42);
});

test('rejects invalid signature, malformed user, and expiry', () => {
  expect(() => verifyInitData({ raw: `${fixture()}x`, botToken: token, now })).toThrow();
  expect(() => verifyInitData({ raw: fixture('{bad'), botToken: token, now })).toThrow();
  const later = new Date(now.getTime() + 86_401_000);
  expect(() => verifyInitData({ raw: fixture(), botToken: token, now: later })).toThrow();
});
