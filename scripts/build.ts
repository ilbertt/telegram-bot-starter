import { existsSync } from 'node:fs';

const hasMiniApp = existsSync(new URL('../miniapp/package.json', import.meta.url));

async function run(command: string[]): Promise<void> {
  const child = Bun.spawn(command, { stdio: ['inherit', 'inherit', 'inherit'], env: Bun.env });
  const exitCode = await child.exited;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

if (hasMiniApp) {
  await run(['bun', '--filter', 'miniapp', 'build']);
}
await run(['bun', '--filter', 'backend', 'build']);
