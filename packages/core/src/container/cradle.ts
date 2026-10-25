import type { EntityManager, MikroORM } from "@devmentor/db";
import type { AppConfig } from "../config/env";
import type { Logger } from "../logger";
import type { DatabaseHealthProbe } from "../services/health/database-health-probe.port";
import type { SystemHealthService } from "../services/health/system-health.service";

/** Every dependency the container provides; one explicit entry per registration. */
export interface Cradle {
  // Singletons
  config: AppConfig;
  logger: Logger;
  orm: MikroORM | null;
  // Request scope (see scope.ts)
  /** Registered per scope; only when a database is configured. */
  em: EntityManager;
  databaseHealthProbe: DatabaseHealthProbe | null;
  systemHealthService: SystemHealthService;
}
