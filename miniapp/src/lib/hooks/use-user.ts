import { useQuery } from '@tanstack/react-query';
import { api } from '../api.ts';
import { apiErrorMessage } from '../api-error.ts';

export function useUser() {
  return useQuery({
    queryKey: ['me'],
    async queryFn() {
      const { data, error } = await api.api.me.get();
      if (error) {
        throw new Error(apiErrorMessage(error));
      }
      return data;
    },
  });
}
