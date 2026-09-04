import { queryOptions } from '@tanstack/react-query';
import { api } from '../lib/api.ts';
import { apiErrorMessage } from '../lib/api-error.ts';

export const remindersQuery = queryOptions({
  queryKey: ['reminders'],
  async queryFn() {
    const { data, error } = await api.api.reminders.get();
    if (error) {
      throw new Error(apiErrorMessage(error));
    }
    return data;
  },
});

export type Reminder = NonNullable<
  Awaited<ReturnType<typeof api.api.reminders.get>>['data']
>[number];
