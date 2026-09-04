import { signInitData } from '../src/lib/telegram-init-data.ts';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('Set TELEGRAM_BOT_TOKEN');
}
const user = {
  id: 900_000_001,
  first_name: 'Local',
  last_name: 'Developer',
  username: 'local_dev',
};
const params = new URLSearchParams({
  auth_date: String(Math.floor(Date.now() / 1000)),
  query_id: crypto.randomUUID(),
  user: JSON.stringify(user),
});
params.set('hash', signInitData(params, token));
console.log(params.toString());
