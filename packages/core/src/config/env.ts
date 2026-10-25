import { z } from "zod";

const logLevels = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

// HS256 needs a key at least as long as its 256-bit output.
const MIN_AUTH_SECRET_BYTES = 32;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Optional: without it the app runs, and every database feature reports "not configured". */
  DATABASE_URL: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
  LOG_LEVEL: z.enum(logLevels).default("info"),
  /** Signs session JWTs (HS256). Generate with `openssl rand -base64 32`. */
  AUTH_SECRET: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null)
    .refine(
      (value) => value === null || new TextEncoder().encode(value).length >= MIN_AUTH_SECRET_BYTES,
      `AUTH_SECRET must be at least ${MIN_AUTH_SECRET_BYTES} bytes long.`,
    ),
}).refine((env) => env.NODE_ENV !== "production" || env.AUTH_SECRET !== null, {
  message: "AUTH_SECRET is required in production.",
  path: ["AUTH_SECRET"],
});

export interface AppConfig {
  isProduction: boolean;
  /** `null` when DATABASE_URL is not set. */
  databaseUrl: string | null;
  logLevel: (typeof logLevels)[number];
  /** `null` when AUTH_SECRET is not set (allowed outside production); auth then fails closed. */
  authSecret: Uint8Array | null;
}

/** Validates the environment once, at container build time (never at module load). */
export function readAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const { NODE_ENV, DATABASE_URL, LOG_LEVEL, AUTH_SECRET } = parsed.data;
  return {
    isProduction: NODE_ENV === "production",
    databaseUrl: DATABASE_URL,
    logLevel: LOG_LEVEL,
    authSecret: AUTH_SECRET === null ? null : new TextEncoder().encode(AUTH_SECRET),
  };
}
