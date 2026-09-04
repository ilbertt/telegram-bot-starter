import type { User } from 'grammy/types';
import type { UsersRepository } from '#repositories/users.repository.ts';
import { Service } from '#services/service.ts';

export class UsersService extends Service {
  constructor(private readonly usersRepo: UsersRepository) {
    super();
  }

  async upsert(user: User): Promise<void> {
    await this.usersRepo.upsert(user);
  }
}
