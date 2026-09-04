import { Elysia } from 'elysia';
import { createLogger } from '#lib/logger.ts';
import { services } from '#services/container.ts';

export function loggerPlugin(name: string) {
  const logger = createLogger(name);
  return new Elysia({ name: `logger.${name}` }).derive({ as: 'scoped' }, () => ({ logger }));
}

export const ServicesPlugin = new Elysia({ name: 'services' }).decorate('services', services);
