// `npm run app:ephemeral`: a throwaway PostgreSQL (testcontainers), migrated,
// and a production build of the app on a free port. Drive it by hand or with
// agent-browser; Ctrl+C stops the app and removes the container.
import { buildApp, startApp } from "./app-server";
import { startPostgres } from "./postgres";

const postgres = await startPostgres();
let app;
try {
  await buildApp(postgres.databaseUrl);
  app = await startApp(postgres.databaseUrl);
} catch (error) {
  await postgres.stop();
  throw error;
}

process.stdout.write(
  [
    "",
    `App:          ${app.baseUrl}`,
    `DATABASE_URL: ${postgres.databaseUrl}`,
    `Admin:        DATABASE_URL=${postgres.databaseUrl} npm run db:user:promote -- --email <e-mail>`,
    `Browser:      npx agent-browser open ${app.baseUrl}`,
    "Press Ctrl+C to stop.",
    "",
  ].join("\n"),
);

const running = app;
async function shutdown() {
  await running.stop();
  await postgres.stop();
  process.exit(0);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
