import type { ReminderRecord } from '#reminders/reminder.ts';
import { Service } from '#services/service.ts';

export type UserEvent =
  | { type: 'reminder.created'; reminder: ReminderRecord }
  | { type: 'reminder.deleted'; reminderId: string }
  | { type: 'reminder.sent'; reminderId: string; sentAt: Date };

type Listener = (event: UserEvent) => void;

export class EventsService extends Service {
  private readonly listenersByUser = new Map<string, Set<Listener>>();

  subscribe({ userId, listener }: { userId: string; listener: Listener }): () => void {
    const listeners = this.listenersByUser.get(userId) ?? new Set<Listener>();
    listeners.add(listener);
    this.listenersByUser.set(userId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listenersByUser.delete(userId);
      }
    };
  }

  publish({ userId, event }: { userId: string; event: UserEvent }): void {
    for (const listener of this.listenersByUser.get(userId) ?? []) {
      listener(event);
    }
  }
}
