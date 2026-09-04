import { Elysia } from 'elysia';
import { NotFoundError } from '#lib/errors.ts';
import { RoutePrefix } from '#lib/routes/prefixes.ts';
import { ServicesPlugin } from '#services/plugins.ts';

function createFrontendAssetsController() {
  const controller = new Elysia().use(ServicesPlugin);
  for (const [path, response] of controller.decorator.services.assets.routes()) {
    controller.get(path, response, { detail: { hide: true } });
  }
  return controller;
}

function createFrontendFallbackController() {
  const controller = new Elysia().use(ServicesPlugin);
  controller.mount((request) => {
    const pathname = new URL(request.url).pathname;
    const response = !pathname.startsWith(RoutePrefix.Api)
      ? controller.decorator.services.assets.fallback(pathname)
      : null;
    if (!response) {
      throw new NotFoundError();
    }
    return response;
  });
  return controller;
}

export const FrontendAssetsController = createFrontendAssetsController();
export const FrontendFallbackController = createFrontendFallbackController();
