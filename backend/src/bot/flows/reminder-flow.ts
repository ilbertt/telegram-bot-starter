import { type Bot, InlineKeyboard } from 'grammy';
import { callbackCodec } from '#bot/callbacks/codec.ts';
import type { BotContext } from '#bot/context.ts';

export function installFlowHandlers(bot: Bot<BotContext>): void {
  bot.on('message:text', async (ctx, next) => {
    const flow = ctx.session.flow;
    if (!flow) {
      return next();
    }

    if (flow.state === 'awaiting_due') {
      try {
        const dueAt = ctx.services.reminders.parseDueAt(ctx.message.text);
        ctx.session.flow = { state: 'awaiting_text', dueAt: dueAt.toISOString() };
        await ctx.reply('What should I remind you about?');
      } catch {
        await ctx.reply('I could not parse that. Use ISO-8601 or a relative value like 10m.');
      }
      return;
    }

    if (flow.state === 'awaiting_text') {
      const text = ctx.message.text.trim();
      if (!text) {
        await ctx.reply('Reminder text cannot be empty.');
        return;
      }
      ctx.session.flow = { state: 'awaiting_confirmation', dueAt: flow.dueAt, text };
      await ctx.reply(`Create “${text}” for ${flow.dueAt}?`, {
        reply_markup: new InlineKeyboard()
          .text('Confirm', callbackCodec.confirm)
          .text('Cancel', callbackCodec.cancel),
      });
      return;
    }

    await ctx.reply('Use the confirmation buttons, or /cancel.');
  });
}
