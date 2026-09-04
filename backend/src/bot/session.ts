import type { Context } from 'grammy';

export type ReminderFlow =
  | { state: 'awaiting_due' }
  | { state: 'awaiting_text'; dueAt: string }
  | { state: 'awaiting_confirmation'; dueAt: string; text: string };

export type SessionData = { flow: ReminderFlow | null };

export function initialSession(): SessionData {
  return { flow: null };
}

export function sessionKey(ctx: Context): string | undefined {
  if (!ctx.chat || !ctx.from) {
    return undefined;
  }
  return `${String(ctx.chat.id)}:${String(ctx.from.id)}`;
}
