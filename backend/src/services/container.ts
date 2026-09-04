import { sql } from '#db/client.ts';
import { AssetsRepository } from '#repositories/assets.repository.ts';
import { HealthRepository } from '#repositories/health.repository.ts';
import { RemindersRepository } from '#repositories/reminders.repository.ts';
import { SessionRepository } from '#repositories/session.repository.ts';
import { UsersRepository } from '#repositories/users.repository.ts';
import { AssetsService } from '#services/assets.service.ts';
import { EventsService } from '#services/events.service.ts';
import { HealthService } from '#services/health.service.ts';
import { RemindersService } from '#services/reminders.service.ts';
import { UsersService } from '#services/users.service.ts';

const assetsRepo = new AssetsRepository(sql);
const healthRepo = new HealthRepository(sql);
const remindersRepo = new RemindersRepository(sql);
const usersRepo = new UsersRepository(sql);

export const sessionRepository = new SessionRepository(sql);
const events = new EventsService();

export const services = {
  assets: new AssetsService(assetsRepo),
  events,
  health: new HealthService(healthRepo),
  reminders: new RemindersService(remindersRepo, events),
  users: new UsersService(usersRepo),
};

export type BotServices = typeof services;
