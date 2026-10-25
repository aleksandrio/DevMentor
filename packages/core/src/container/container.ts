import {
  asClass,
  asFunction,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from "awilix";
import { getOrm } from "@devmentor/db";
import { readAppConfig } from "../config/env";
import { EventBus } from "../events/event-bus";
import { registerEventSubscribers } from "../events/subscribers";
import { AUTH_RATE_LIMIT, FailureRateLimiter } from "../http/rate-limit";
import { ServiceUnavailableError } from "../http/errors";
import { createLogger } from "../logger";
import { AuthService } from "../services/auth/auth.service";
import { UserService } from "../services/auth/user.service";
import { MikroOrmDatabaseHealthProbe } from "../services/health/adapters/mikro-orm-database-health-probe";
import { SystemHealthService } from "../services/health/system-health.service";
import type { Cradle } from "./cradle";

// Composition root: the only place that knows how the application is wired.
// Every dependency is registered here explicitly (no auto-loading).
async function buildContainer(): Promise<AwilixContainer<Cradle>> {
  const config = readAppConfig();
  // MikroORM 7 connects lazily, so this does not touch the database yet.
  const orm = config.databaseUrl
    ? await getOrm({ databaseUrl: config.databaseUrl })
    : null;

  const logger = createLogger(config);
  const eventBus = new EventBus({ logger });
  registerEventSubscribers(eventBus, logger);

  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });
  container.register({
    config: asValue(config),
    logger: asValue(logger),
    orm: asValue(orm),
    eventBus: asValue(eventBus),
    authRateLimiter: asValue(new FailureRateLimiter(AUTH_RATE_LIMIT)),
    databaseHealthProbe: orm
      ? asClass(MikroOrmDatabaseHealthProbe).scoped()
      : asValue(null),
    systemHealthService: asClass(SystemHealthService).scoped(),
    userService: orm
      ? asClass(UserService).scoped()
      : asFunction(databaseNotConfigured).scoped(),
    authService: asClass(AuthService).scoped(),
  });
  return container;
}

function databaseNotConfigured(): never {
  throw new ServiceUnavailableError("Baza danych nie jest skonfigurowana (brak DATABASE_URL).");
}

let containerPromise: Promise<AwilixContainer<Cradle>> | undefined;

export function getContainer(): Promise<AwilixContainer<Cradle>> {
  containerPromise ??= buildContainer().catch((error: unknown) => {
    containerPromise = undefined;
    throw error;
  });
  return containerPromise;
}
