import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { remindersQuery } from '../../queries/reminders.ts';
import { api } from '../api.ts';
import { initData } from '../telegram.ts';

export function useEvents(): void {
  const client = useQueryClient();
  useEffect(() => {
    const socket = api.api.events.subscribe({ query: { initData: initData() } });
    socket.subscribe((message) => {
      if (message.data.type !== 'pong') {
        void client.invalidateQueries({ queryKey: remindersQuery.queryKey });
      }
    });
    const timer = setInterval(() => socket.send({ type: 'ping' }), 25_000);
    return () => {
      clearInterval(timer);
      socket.close();
    };
  }, [client]);
}
