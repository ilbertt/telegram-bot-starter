CREATE TABLE telegram_user (
  id            text NOT NULL PRIMARY KEY,
  username      text,
  first_name    text,
  last_name     text,
  language_code text,
  created_at    text NOT NULL,
  updated_at    text NOT NULL
);

CREATE TABLE bot_session (
  key        text NOT NULL PRIMARY KEY,
  value      text NOT NULL,
  updated_at text NOT NULL
);

CREATE TABLE reminder (
  id         text NOT NULL PRIMARY KEY,
  user_id    text NOT NULL REFERENCES telegram_user(id) ON DELETE CASCADE,
  chat_id    text NOT NULL,
  text       text NOT NULL,
  due_at     text NOT NULL,
  sent_at    text,
  created_at text NOT NULL
);

CREATE INDEX reminder_owner_due_idx ON reminder(user_id, due_at);
CREATE INDEX reminder_due_unsent_idx ON reminder(due_at) WHERE sent_at IS NULL;
