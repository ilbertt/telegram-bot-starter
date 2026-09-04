import { type Bot, type CommandContext, InlineKeyboard, type MiddlewareFn } from 'grammy';
import type { User } from 'grammy/types';
import { callbackCodec } from '#bot/callbacks/codec.ts';
import type { BotContext } from '#bot/context.ts';

type UserBotContext = BotContext & { from: User };

type Command = {
  command: string;
  description: string;
  handler: MiddlewareFn<CommandContext<UserBotContext>>;
};

const commands = [
  {
    command: 'start',
    description: 'Show help',
    handler: (ctx) =>
      ctx.reply(
        'I keep durable reminders. Use /remind to create one, /reminders to list them, or /cancel to stop a flow.',
      ),
  },
  {
    command: 'remind',
    description: 'Create a reminder',
    handler: (ctx) => {
      ctx.session.flow = { state: 'awaiting_due' };
      return ctx.reply('When should I remind you? Send ISO-8601 or a relative value: 10m, 2h, 3d.');
    },
  },
  {
    command: 'reminders',
    description: 'List reminders',
    handler: async (ctx) => {
      const reminders = await ctx.services.reminders.list(String(ctx.from.id));
      if (reminders.length === 0) {
        return ctx.reply('You have no reminders.');
      }
      for (const reminder of reminders) {
        const status = reminder.sentAt ? 'sent' : reminder.dueAt.toISOString();
        await ctx.reply(`${reminder.text}\n${status}`, {
          reply_markup: new InlineKeyboard().text('Delete', callbackCodec.delete(reminder.id)),
        });
      }
    },
  },
  {
    command: 'cancel',
    description: 'Cancel the active flow',
    handler: (ctx) => {
      const active = ctx.session.flow !== null;
      ctx.session.flow = null;
      return ctx.reply(active ? 'Cancelled.' : 'Nothing to cancel.');
    },
  },
] as const satisfies readonly Command[];

export type BotCommandName = (typeof commands)[number]['command'];

export function installCommands(bot: Bot<BotContext>): void {
  const userBot = bot.filter((ctx): ctx is UserBotContext => ctx.from !== undefined);
  for (const command of commands) {
    userBot.command(command.command, command.handler);
  }
}

export function telegramCommands(): Array<{ command: BotCommandName; description: string }> {
  return commands.map(({ command, description }) => ({ command, description }));
}
