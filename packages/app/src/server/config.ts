import "server-only";

export interface AppConfig {
  /** `null` when DATABASE_URL is not set; the app still runs, without data. */
  databaseUrl: string | null;
}

export function readAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return { databaseUrl: env.DATABASE_URL?.trim() || null };
}
