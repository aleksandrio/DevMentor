import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { repoRoot } from "./paths";

const execFileAsync = promisify(execFile);

// Same major version as docker-compose.yml.
const POSTGRES_IMAGE = "postgres:17";

export interface EphemeralPostgres {
  databaseUrl: string;
  stop(): Promise<void>;
}

/**
 * Starts a throwaway PostgreSQL container and migrates it with the same
 * command developers use (`npm run db:migrate`). Testcontainers' reaper
 * removes the container even if this process dies.
 */
export async function startPostgres(): Promise<EphemeralPostgres> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase("devmentor")
    .withUsername("devmentor")
    .withPassword("devmentor")
    .start();
  const databaseUrl = container.getConnectionUri();
  try {
    await execFileAsync("npm", ["run", "db:migrate"], {
      cwd: repoRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
  } catch (error) {
    await container.stop();
    throw error;
  }
  return {
    databaseUrl,
    stop: async () => {
      await container.stop();
    },
  };
}
