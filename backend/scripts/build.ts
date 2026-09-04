import { existsSync } from 'node:fs';
import { cp, mkdir, rm } from 'node:fs/promises';
import {
  BACKEND_BINARY_FILE,
  BACKEND_BUILD_TARGET,
  BACKEND_DIST_DIR,
  BACKEND_ENTRYPOINT,
  DB_MIGRATIONS_DIR,
  DB_MIGRATIONS_DIR_NAME,
  DB_MIGRATIONS_DIR_NAME_CONSTANT_NAME,
  MINIAPP_DIST_DST,
  MINIAPP_DIST_SRC,
  PUBLIC_MINIAPP_DIR_NAME,
  PUBLIC_MINIAPP_DIR_NAME_CONSTANT_NAME,
} from './shared/constants.ts';

await rm(BACKEND_DIST_DIR, { recursive: true, force: true });
await rm(MINIAPP_DIST_DST, { recursive: true, force: true });
await mkdir(BACKEND_DIST_DIR, { recursive: true });

const assets = [DB_MIGRATIONS_DIR];
if (existsSync(MINIAPP_DIST_SRC)) {
  await cp(MINIAPP_DIST_SRC, MINIAPP_DIST_DST, { recursive: true });
  assets.unshift(MINIAPP_DIST_DST);
}

console.log(`Compiling for ${BACKEND_BUILD_TARGET ?? 'the host platform'}...`);
const result = await Bun.build({
  entrypoints: [BACKEND_ENTRYPOINT],
  compile: {
    outfile: BACKEND_BINARY_FILE,
    ...(BACKEND_BUILD_TARGET ? { target: BACKEND_BUILD_TARGET } : {}),
    assets,
  },
  bytecode: true,
  format: 'esm',
  naming: { asset: '[dir]/[name].[ext]' },
  define: {
    [PUBLIC_MINIAPP_DIR_NAME_CONSTANT_NAME]: JSON.stringify(PUBLIC_MINIAPP_DIR_NAME),
    [DB_MIGRATIONS_DIR_NAME_CONSTANT_NAME]: JSON.stringify(DB_MIGRATIONS_DIR_NAME),
  },
  minify: { whitespace: true, syntax: true },
  target: 'bun',
});

if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
console.log(`Built ${BACKEND_BINARY_FILE}`);
