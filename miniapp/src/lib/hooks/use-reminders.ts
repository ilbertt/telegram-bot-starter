import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersQuery } from '../../queries/reminders.ts';
import { api } from '../api.ts';
import { apiErrorMessage } from '../api-error.ts';

export function useReminders() {
  return useQuery(remindersQuery);
}

export function useCreateReminder() {
  const client = useQueryClient();
  return useMutation({
    async mutationFn({ text, dueAt }: { text: string; dueAt: Date }) {
      const { data, error } = await api.api.reminders.post({ text, dueAt });
      if (error) {
        throw new Error(apiErrorMessage(error));
      }
      return data;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: remindersQuery.queryKey }),
  });
}

export function useDeleteReminder() {
  const client = useQueryClient();
  return useMutation({
    async mutationFn(reminderId: string) {
      const { error } = await api.api.reminders({ reminderId }).delete();
      if (error) {
        throw new Error(apiErrorMessage(error));
      }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: remindersQuery.queryKey }),
  });
}
