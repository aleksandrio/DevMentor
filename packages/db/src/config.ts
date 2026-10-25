import { defineConfig, type Options } from "@mikro-orm/postgresql";
import { entities } from "./entities";

export interface DbConfig {
  /** PostgreSQL connection string, e.g. postgres://user:pass@host:5432/db */
  databaseUrl: string;
}

/** Runtime ORM options shared by the application and the CLI. */
export function createOrmOptions({ databaseUrl }: DbConfig): Options {
  return defineConfig({
    clientUrl: databaseUrl,
    entities,
    pool: { min: 0, max: 10, idleTimeoutMillis: 30_000 },
  });
}
