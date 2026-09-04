import { treaty } from '@elysiajs/eden';
import type { App } from 'backend/types';
import { initData } from './telegram.ts';

type ApiClient = ReturnType<typeof treaty<App>>;

export const api: ApiClient = treaty<App>(window.location.origin, {
  headers: () => ({ Authorization: `tma ${initData()}` }),
});
