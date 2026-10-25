import { inject } from "vitest";

declare module "vitest" {
  export interface ProvidedContext {
    /** Migrated PostgreSQL in a throwaway container. */
    databaseUrl: string;
    /** Production build of the app (`next start`) against that database. */
    baseUrl: string;
  }
}

/** Connection string of the integration-test database (see global-setup.ts). */
export function testDatabaseUrl(): string {
  return inject("databaseUrl");
}

/** Base URL of the app under test (see global-setup.ts). */
export function testBaseUrl(): string {
  return inject("baseUrl");
}
