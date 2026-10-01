import { expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function invokeCron(title: string) {
  const dataFolder = mkdtempSync(join(tmpdir(), 'telegram-bot-cron-'));
  const child = Bun.spawn(
    [
      process.execPath,
      '--define',
      'DB_MIGRATIONS_DIR_NAME="migrations"',
      '--define',
      'PUBLIC_MINIAPP_DIR_NAME="public-miniapp"',
      join(import.meta.dir, '../src/main.ts'),
      `--cron-title=${title}`,
      '--cron-period=* * * * *',
    ],
    {
      cwd: join(import.meta.dir, '..'),
      env: {
        ...process.env,
        DATA_FOLDER: dataFolder,
        TELEGRAM_BOT_TOKEN: '123456789:cron-test-token',
        TELEGRAM_WEBHOOK_SECRET: 'cron_test_secret',
        NODE_ENV: 'production',
        TEST_ONLY_SKIP_TELEGRAM: 'false',
        // An invalid HTTP port also proves cron dispatch does not attempt to listen.
        PORT: '-1',
      },
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );
  const timeout = setTimeout(() => child.kill(), 5_000);
  try {
    const [code, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    return { code, stdout, stderr };
  } finally {
    clearTimeout(timeout);
    child.kill();
    rmSync(dataFolder, { recursive: true, force: true });
  }
}

test('cron command migrates, runs, and exits before Telegram or HTTP startup', async () => {
  const result = await invokeCron('send-reminders');
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('send-reminders completed');
  expect(result.stdout).not.toContain('listening on');
  expect(result.stdout).not.toContain('registered send-reminders');
});

test('unknown cron title fails instead of starting the server', async () => {
  const result = await invokeCron('missing-job');
  expect(result.code).toBe(1);
  expect(result.stderr).toContain('Unknown cron job: missing-job');
  expect(result.stdout).not.toContain('listening on');
});
