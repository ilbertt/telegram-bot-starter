import type { Bot } from 'grammy';
import { callbackCodec } from '#bot/callbacks/codec.ts';
import type { BotContext } from '#bot/context.ts';

export function installCallbackHandlers(bot: Bot<BotContext>): void {
  bot.on('callback_query:data', async (ctx) => {
    const action = callbackCodec.parse(ctx.callbackQuery.data);
    if (!action) {
      await ctx.answerCallbackQuery({ text: 'Unknown action' });
      return;
    }
    const userId = String(ctx.from.id);

    if (action.type === 'flow.cancel') {
      ctx.session.flow = null;
      await ctx.answerCallbackQuery({ text: 'Cancelled' });
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      return;
    }

    if (action.type === 'flow.confirm') {
      const flow = ctx.session.flow;
      if (flow?.state !== 'awaiting_confirmation' || !ctx.chat) {
        await ctx.answerCallbackQuery({ text: 'This confirmation has expired' });
        return;
      }
      await ctx.services.reminders.create({
        userId,
        chatId: String(ctx.chat.id),
        text: flow.text,
        dueAt: new Date(flow.dueAt),
      });
      ctx.session.flow = null;
      await ctx.answerCallbackQuery({ text: 'Reminder created' });
      await ctx.editMessageText(`Saved: ${flow.text} at ${flow.dueAt}`);
      return;
    }

    try {
      await ctx.services.reminders.delete({ id: action.reminderId, userId });
      await ctx.answerCallbackQuery({ text: 'Deleted' });
      await ctx.editMessageText('Reminder deleted.');
    } catch {
      await ctx.answerCallbackQuery({ text: 'Reminder not found' });
    }
  });
}
