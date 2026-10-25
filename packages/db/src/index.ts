import "server-only";

export type { DbConfig } from "./config";
export { getOrm } from "./orm";
export {
  MikroOrmDatabaseHealthProbe,
  type MikroOrmDatabaseHealthProbeDeps,
} from "./health/mikro-orm-database-health-probe";
export type { EntityManager, MikroORM } from "@mikro-orm/postgresql";
