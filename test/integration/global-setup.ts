import type { TestProject } from "vitest/node";
import { buildApp, startApp } from "./app-server";
import { startPostgres } from "./postgres";
// Brings the typed `provide` keys (ProvidedContext) into scope.
import type {} from "./context";

/** Starts the database and the app once for every integration test file. */
export default async function setup(project: TestProject) {
  const postgres = await startPostgres();
  try {
    await buildApp(postgres.databaseUrl);
    const app = await startApp(postgres.databaseUrl);
    project.provide("databaseUrl", postgres.databaseUrl);
    project.provide("baseUrl", app.baseUrl);
    return async () => {
      await app.stop();
      await postgres.stop();
    };
  } catch (error) {
    await postgres.stop();
    throw error;
  }
}
