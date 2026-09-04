import type { Context, SessionFlavor } from 'grammy';
import type { SessionData } from '#bot/session.ts';
import type { BotServices } from '#services/container.ts';

export type BotContext = Context &
  SessionFlavor<SessionData> & {
    services: BotServices;
  };
