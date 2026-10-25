import type { EntityManager, MikroORM } from "@devmentor/db";
import type { AppConfig } from "../config/env";
import type { EventBus } from "../events/event-bus";
import type { FailureRateLimiter } from "../http/rate-limit";
import type { Logger } from "../logger";
import type { DatabaseHealthProbe } from "../services/health/database-health-probe.port";
import type { SystemHealthService } from "../services/health/system-health.service";

/** Every dependency the container provides; one explicit entry per registration. */
export interface Cradle {
  // Singletons
  config: AppConfig;
  logger: Logger;
  orm: MikroORM | null;
  eventBus: EventBus;
  /** Login and registration failures per IP + email. */
  authRateLimiter: FailureRateLimiter;
  // Request scope (see scope.ts)
  /** Registered per scope; only when a database is configured. */
  em: EntityManager;
  databaseHealthProbe: DatabaseHealthProbe | null;
  systemHealthService: SystemHealthService;
}
