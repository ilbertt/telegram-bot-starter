import { Elysia, StatusMap } from 'elysia';
import { GetHealthResponseSchema } from '#routes/api/health/model.ts';
import { ServicesPlugin } from '#services/plugins.ts';

export const HealthController = new Elysia()
  .use(ServicesPlugin)
  .get(
    '/health',
    async ({ services, status }) => status(StatusMap.OK, await services.health.check()),
    {
      response: { [StatusMap.OK]: GetHealthResponseSchema },
      detail: { tags: ['Health'], summary: 'Check health' },
    },
  );
