import { Elysia, t } from 'elysia';
import { telegramAuthPlugin } from '#lib/telegram-auth.ts';
import { ClientMessageSchema, ServerMessageSchema } from '#routes/api/events/model.ts';

const unsubscribeBySocket = new WeakMap<object, () => void>();

export const EventsController = new Elysia().use(telegramAuthPlugin).ws('/events', {
  telegramAuth: true,
  query: t.Object({ initData: t.Optional(t.String()) }),
  body: ClientMessageSchema,
  response: ServerMessageSchema,
  detail: {
    tags: ['Events'],
    summary: 'Subscribe to reminder changes',
    description: 'Upgrade with `?initData=<raw Telegram init data>`; events are scoped by user.',
  },
  open(ws) {
    unsubscribeBySocket.set(
      ws.raw,
      ws.data.services.events.subscribe({
        userId: String(ws.data.user.id),
        listener: (event) => ws.send(event),
      }),
    );
  },
  message(ws) {
    ws.send({ type: 'pong' });
  },
  close(ws) {
    unsubscribeBySocket.get(ws.raw)?.();
    unsubscribeBySocket.delete(ws.raw);
  },
});
