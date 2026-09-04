export type CallbackAction =
  | { type: 'flow.confirm' }
  | { type: 'flow.cancel' }
  | { type: 'reminder.delete'; reminderId: string };

export const callbackCodec = {
  confirm: 'flow:confirm',
  cancel: 'flow:cancel',
  delete(reminderId: string): string {
    return `reminder:delete:${reminderId}`;
  },
  parse(value: string): CallbackAction | null {
    if (value === 'flow:confirm') {
      return { type: 'flow.confirm' };
    }
    if (value === 'flow:cancel') {
      return { type: 'flow.cancel' };
    }
    const prefix = 'reminder:delete:';
    if (value.startsWith(prefix) && value.length > prefix.length) {
      return { type: 'reminder.delete', reminderId: value.slice(prefix.length) };
    }
    return null;
  },
} as const;
