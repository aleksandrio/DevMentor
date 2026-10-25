import "server-only";
import {
  asClass,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from "awilix";
import { SystemHealthService, type DatabaseHealthProbe } from "@devmentor/core";
import {
  getOrm,
  MikroOrmDatabaseHealthProbe,
  type EntityManager,
  type MikroORM,
} from "@devmentor/db";
import { readAppConfig, type AppConfig } from "./config";

// Composition root: the only place that knows how the application is wired.
// Every dependency is registered here explicitly (no auto-loading).
export interface Cradle {
  // Singletons
  config: AppConfig;
  orm: MikroORM | null;
  // Request scope (see request-scope.ts)
  /** Registered per request; only when a database is configured. */
  em: EntityManager;
  databaseHealthProbe: DatabaseHealthProbe | null;
  systemHealthService: SystemHealthService;
}

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
