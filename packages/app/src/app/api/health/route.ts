import { apiHandler } from "@devmentor/core";

export const dynamic = "force-dynamic";

export const GET = apiHandler(
  async ({ cradle: { systemHealthService, logger } }) => {
    const database = await systemHealthService.checkDatabase();
    if (database.state === "down") {
      // Connection details stay in the server log, never in a public response.
      logger.error({ reason: database.reason }, "database health check failed");
      return { database: { state: "down" } };
    }
    return { database };
  },
  { auth: "public" },
);
