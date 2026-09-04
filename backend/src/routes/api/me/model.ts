import { t } from 'elysia';

export const TelegramUserSchema = t.Object({
  id: t.Number(),
  first_name: t.String(),
  last_name: t.Optional(t.String()),
  username: t.Optional(t.String()),
  language_code: t.Optional(t.String()),
  is_bot: t.Boolean(),
});
