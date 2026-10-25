import type { DatabaseStatus as DatabaseStatusData } from "@devmentor/core";
import { Badge } from "@devmentor/ui/components/ui/badge";
import { withRequestScope } from "@/server/request-scope";

export async function DatabaseStatus() {
  const status = await withRequestScope(
    async ({ systemHealthService, logger }) => {
      const result = await systemHealthService.checkDatabase();
      if (result.state === "down") {
        // Keep connection details in the server log instead of the page.
        logger.error({ reason: result.reason }, "database health check failed");
      }
      return result;
    },
  );
  return <DatabaseStatusBadge status={status} />;
}

export function DatabaseStatusBadge({ status }: { status?: DatabaseStatusData }) {
  switch (status?.state) {
    case undefined:
      return <Badge variant="outline">sprawdzanie…</Badge>;
    case "up":
      return <Badge>działa · {status.latencyMs} ms</Badge>;
    case "down":
      return <Badge variant="destructive">niedostępna</Badge>;
    case "not-configured":
      return <Badge variant="outline">nieskonfigurowana (brak DATABASE_URL)</Badge>;
  }
}
