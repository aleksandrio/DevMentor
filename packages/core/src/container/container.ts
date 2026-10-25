import {
  asClass,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from "awilix";
import { getOrm } from "@devmentor/db";
import { readAppConfig } from "../config/env";
import { createLogger } from "../logger";
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

  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });
  container.register({
    config: asValue(config),
    logger: asValue(createLogger(config)),
    orm: asValue(orm),
    databaseHealthProbe: orm
      ? asClass(MikroOrmDatabaseHealthProbe).scoped()
      : asValue(null),
    systemHealthService: asClass(SystemHealthService).scoped(),
  });
  return container;
}

let containerPromise: Promise<AwilixContainer<Cradle>> | undefined;

export function getContainer(): Promise<AwilixContainer<Cradle>> {
  containerPromise ??= buildContainer().catch((error: unknown) => {
    containerPromise = undefined;
    throw error;
  });
  return containerPromise;
}
