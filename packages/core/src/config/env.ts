import { z } from "zod";

const logLevels = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Optional: without it the app runs, and every database feature reports "not configured". */
  DATABASE_URL: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  LOG_LEVEL: z.enum(logLevels).default("info"),
});

export interface AppConfig {
  isProduction: boolean;
  /** `null` when DATABASE_URL is not set. */
  databaseUrl: string | null;
  logLevel: (typeof logLevels)[number];
}

/** Validates the environment once, at container build time (never at module load). */
export function readAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const { NODE_ENV, DATABASE_URL, LOG_LEVEL } = parsed.data;
  return {
    isProduction: NODE_ENV === "production",
    databaseUrl: DATABASE_URL,
    logLevel: LOG_LEVEL,
  };
}
