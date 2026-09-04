import type { User } from 'grammy/types';
import { Repository } from '#repositories/repository.ts';

export class UsersRepository extends Repository {
  async upsert(user: User): Promise<void> {
    const now = new Date().toISOString();
    await this.sql.UpsertTelegramUser`
      INSERT INTO telegram_user (
        id, username, first_name, last_name, language_code, created_at, updated_at
      ) VALUES (
        ${String(user.id)}, ${user.username ?? null}, ${user.first_name},
        ${user.last_name ?? null}, ${user.language_code ?? null}, ${now}, ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        language_code = excluded.language_code,
        updated_at = excluded.updated_at
    `;
  }
}
