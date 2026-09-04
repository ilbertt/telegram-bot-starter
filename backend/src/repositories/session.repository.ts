import type { StorageAdapter } from 'grammy';
import type { SessionData } from '#bot/session.ts';
import { Repository } from '#repositories/repository.ts';

export class SessionRepository extends Repository implements StorageAdapter<SessionData> {
  async read(key: string): Promise<SessionData | undefined> {
    const [row] = await this.sql.ReadBotSession`
      SELECT value FROM bot_session WHERE key = ${key}
    `;
    return row ? (JSON.parse(row.value) as SessionData) : undefined;
  }

  async write(key: string, value: SessionData): Promise<void> {
    await this.sql.WriteBotSession`
      INSERT INTO bot_session (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}, ${new Date().toISOString()})
      ON CONFLICT (key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `;
  }

  async delete(key: string): Promise<void> {
    await this.sql.DeleteBotSession`DELETE FROM bot_session WHERE key = ${key}`;
  }
}
