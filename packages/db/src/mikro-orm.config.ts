// MikroORM CLI configuration (migrations, schema tools). Not imported by the
// application, which builds its ORM through getOrm().
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Migrator } from "@mikro-orm/migrations";
import { defineConfig } from "@mikro-orm/postgresql";
import { createOrmOptions } from "./config";

const rootEnvFile = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnvFile)) {
  // Same file Next.js loads; variables already set in the shell take precedence.
  process.loadEnvFile(rootEnvFile);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set (see .env.example).");
}

const migrationsDir = fileURLToPath(new URL("./migrations", import.meta.url));

export default defineConfig({
  ...createOrmOptions({ databaseUrl }),
  extensions: [Migrator],
  migrations: { path: migrationsDir, pathTs: migrationsDir },
});
