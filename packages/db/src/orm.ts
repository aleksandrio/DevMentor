import { MikroORM } from "@mikro-orm/postgresql";
import { createOrmOptions, type DbConfig } from "./config";

// One ORM (and connection pool) per process. Kept on globalThis so Next.js
// HMR in development reuses it instead of opening a new pool on every reload.
const globalForOrm = globalThis as typeof globalThis & {
  __devmentorOrm?: Promise<MikroORM>;
};

export function getOrm(config: DbConfig): Promise<MikroORM> {
  globalForOrm.__devmentorOrm ??= MikroORM.init(createOrmOptions(config)).catch(
    (error: unknown) => {
      // Do not cache a failed connection attempt; retry on the next call.
      globalForOrm.__devmentorOrm = undefined;
      throw error;
    },
  );
  return globalForOrm.__devmentorOrm;
}
