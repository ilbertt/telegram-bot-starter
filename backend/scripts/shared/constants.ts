import { join } from 'node:path';

const BACKEND_DIR = join(import.meta.dir, '..', '..');
export const BACKEND_DIST_DIR = join(BACKEND_DIR, 'dist');
export const BACKEND_BINARY_FILE = join(BACKEND_DIST_DIR, 'app');
export const BACKEND_ENTRYPOINT = 'src/main.ts';
export const DB_MIGRATIONS_DIR_NAME = 'migrations';
export const DB_MIGRATIONS_DIR_NAME_CONSTANT_NAME = 'DB_MIGRATIONS_DIR_NAME';
export const DB_MIGRATIONS_DIR = join(BACKEND_DIR, 'src/db', DB_MIGRATIONS_DIR_NAME);
export const PUBLIC_MINIAPP_DIR_NAME = 'public';
export const PUBLIC_MINIAPP_DIR_NAME_CONSTANT_NAME = 'PUBLIC_FRONTEND_DIR_NAME';
export const MINIAPP_DIST_SRC = join(BACKEND_DIR, '..', 'miniapp', 'dist');
export const MINIAPP_DIST_DST = join(BACKEND_DIR, PUBLIC_MINIAPP_DIR_NAME);
export const DEFAULT_BUILD_TARGET = 'bun-linux-x64';
const buildTarget = process.env.BUILD_TARGET || DEFAULT_BUILD_TARGET;
export const BACKEND_BUILD_TARGET =
  buildTarget === 'host' ? undefined : (buildTarget as Bun.Build.CompileTarget);
