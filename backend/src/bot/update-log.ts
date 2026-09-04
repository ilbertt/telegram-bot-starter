import type { Context } from 'grammy';

function updateType(ctx: Context): string {
  return Object.keys(ctx.update).find((key) => key !== 'update_id') ?? 'unknown';
}

function commandName(ctx: Context): string | null {
  const entity = ctx.entities('bot_command').find(({ offset }) => offset === 0);
  const name = entity?.text.slice(1).split('@', 1)[0];
  return name ? `/${name}` : null;
}

export function formatTelegramUpdate(ctx: Context): string {
  const parts = ['update received', `update_id=${ctx.update.update_id}`, `type=${updateType(ctx)}`];
  const command = commandName(ctx);
  if (command) {
    parts.push(`command=${command}`);
  }
  if (ctx.from) {
    parts.push(`username=${ctx.from.username ? `@${ctx.from.username}` : '-'}`);
    parts.push(`user_id=${ctx.from.id}`);
  }
  if (ctx.chatId !== undefined) {
    parts.push(`chat_id=${ctx.chatId}`);
  }
  return parts.join(' ');
}
