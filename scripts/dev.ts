import { existsSync } from 'node:fs';

const commands = [['bun', '--filter', 'backend', 'dev']];
if (existsSync(new URL('../miniapp/package.json', import.meta.url))) {
  commands.push(['bun', '--filter', 'miniapp', 'dev']);
}

const children = commands.map((command) =>
  Bun.spawn(command, { stdio: ['inherit', 'inherit', 'inherit'], env: Bun.env }),
);
const stop = () => {
  for (const child of children) {
    child.kill();
  }
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
const exitCodes = await Promise.all(children.map((child) => child.exited));
process.exit(exitCodes.find((code) => code !== 0) ?? 0);
