import { Elysia, StatusMap, t } from 'elysia';
import { ErrorResponseSchema } from '#lib/errors.ts';
import { telegramAuthPlugin } from '#lib/telegram-auth.ts';
import {
  CreateReminderBodySchema,
  ReminderSchema,
  toReminderResponse,
} from '#routes/api/reminders/model.ts';

export const RemindersController = new Elysia()
  .use(telegramAuthPlugin)
  .guard({
    telegramAuth: true,
    response: { [StatusMap.Unauthorized]: ErrorResponseSchema },
  })
  .get(
    '/reminders',
    async ({ services, user }) =>
      (await services.reminders.list(String(user.id))).map(toReminderResponse),
    {
      response: { [StatusMap.OK]: t.Array(ReminderSchema) },
      detail: { tags: ['Reminders'], summary: 'List reminders' },
    },
  )
  .post(
    '/reminders',
    async ({ body, services, user, status }) => {
      const reminder = await services.reminders.create({
        userId: String(user.id),
        chatId: body.chatId ?? String(user.id),
        text: body.text,
        dueAt: body.dueAt,
      });
      return status(StatusMap.Created, toReminderResponse(reminder));
    },
    {
      body: CreateReminderBodySchema,
      response: {
        [StatusMap.Created]: ReminderSchema,
        [StatusMap['Bad Request']]: ErrorResponseSchema,
      },
      detail: { tags: ['Reminders'], summary: 'Create a reminder' },
    },
  )
  .delete(
    '/reminders/:reminderId',
    async ({ params, services, user, status }) => {
      await services.reminders.delete({ id: params.reminderId, userId: String(user.id) });
      return status(StatusMap.OK, { deleted: true as const });
    },
    {
      params: t.Object({ reminderId: t.String() }),
      response: {
        [StatusMap.OK]: t.Object({ deleted: t.Literal(true) }),
        [StatusMap['Not Found']]: ErrorResponseSchema,
      },
      detail: { tags: ['Reminders'], summary: 'Delete a reminder' },
    },
  );
