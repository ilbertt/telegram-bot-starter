import { existsSync } from 'node:fs';

const packages = ['backend'];
if (existsSync(new URL('../miniapp/package.json', import.meta.url))) {
  packages.push('miniapp');
}
const children = packages.map((name) =>
  Bun.spawn(['bun', '--filter', name, 'check:types'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: Bun.env,
  }),
);
const codes = await Promise.all(children.map((child) => child.exited));
process.exit(codes.find((code) => code !== 0) ?? 0);
