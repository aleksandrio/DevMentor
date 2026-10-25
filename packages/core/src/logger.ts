import { pino, type Logger } from "pino";
import type { AppConfig } from "./config/env";

export type { Logger };

// Never log credentials: these paths are replaced with "[Redacted]" wherever
// they appear in a logged object (top level or one level deep).
const redactedKeys = ["password", "passwordHash", "token", "authorization", "cookie", "set-cookie"];
const redactPaths = redactedKeys.flatMap((key) => [`["${key}"]`, `*["${key}"]`]);

export function createLogger({ logLevel }: Pick<AppConfig, "logLevel">): Logger {
  return pino({ level: logLevel, redact: { paths: redactPaths } });
}
