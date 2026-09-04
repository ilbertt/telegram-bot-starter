import { type Bot, InlineKeyboard } from 'grammy';
import { callbackCodec } from '#bot/callbacks/codec.ts';
import type { BotContext } from '#bot/context.ts';

type Command = {
  command: 'start' | 'remind' | 'reminders' | 'cancel';
  description: string;
  handler: (ctx: BotContext) => Promise<unknown>;
};

const commands: readonly Command[] = [
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
      const reminders = await ctx.services.reminders.list(String(ctx.from!.id));
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
];

export function installCommands(bot: Bot<BotContext>): void {
  for (const command of commands) {
    bot.command(command.command, command.handler);
  }
}

export function telegramCommands(): Array<{ command: string; description: string }> {
  return commands.map(({ command, description }) => ({ command, description }));
}
