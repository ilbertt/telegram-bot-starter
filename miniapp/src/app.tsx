import { type SyntheticEvent, useState } from 'react';
import { useEvents } from './lib/hooks/use-events.ts';
import { useCreateReminder, useDeleteReminder, useReminders } from './lib/hooks/use-reminders.ts';
import { useUser } from './lib/hooks/use-user.ts';
import { isInsideTelegram, saveDevelopmentInitData } from './lib/telegram.ts';

function BrowserSetup() {
  const [value, setValue] = useState('');
  if (isInsideTelegram()) {
    return null;
  }
  return (
    <aside>
      <strong>Browser development</strong>
      <p>
        Run <code>bun backend dev:init-data</code>, paste the output, then reload.
      </p>
      <textarea value={value} onChange={(event) => setValue(event.target.value)} />
      <button
        type="button"
        onClick={() => {
          saveDevelopmentInitData(value);
          location.reload();
        }}
      >
        Save
      </button>
    </aside>
  );
}

export function App() {
  const user = useUser();
  const reminders = useReminders();
  const create = useCreateReminder();
  const remove = useDeleteReminder();
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  useEvents();

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate(
      { text, dueAt: new Date(dueAt) },
      {
        onSuccess: () => {
          setText('');
          setDueAt('');
        },
      },
    );
  }

  return (
    <main>
      <BrowserSetup />
      <header>
        <span className="eyebrow">Telegram reminders</span>
        <h1>{user.data ? `Hello, ${user.data.first_name}` : 'Your reminders'}</h1>
      </header>
      <form onSubmit={submit}>
        <label>
          Reminder
          <input
            required
            maxLength={500}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <label>
          When
          <input
            required
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </label>
        <button type="submit" disabled={create.isPending}>
          Create reminder
        </button>
      </form>
      {create.error && <p className="error">{create.error.message}</p>}
      <section>
        {reminders.isLoading && <p>Loading…</p>}
        {reminders.error && <p className="error">{reminders.error.message}</p>}
        {reminders.data?.map((reminder) => (
          <article key={reminder.id}>
            <div>
              <strong>{reminder.text}</strong>
              <time>{new Date(reminder.dueAt).toLocaleString()}</time>
            </div>
            <button type="button" className="secondary" onClick={() => remove.mutate(reminder.id)}>
              Delete
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
