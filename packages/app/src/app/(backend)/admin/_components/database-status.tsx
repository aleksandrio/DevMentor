import type { DatabaseStatus as DatabaseStatusData } from "@devmentor/core";
import { Badge } from "@devmentor/ui/components/badge";
import { withRequestScope } from "@/server/request-scope";

export async function DatabaseStatus() {
  const status = await withRequestScope(({ systemHealthService }) =>
    systemHealthService.checkDatabase(),
  );
  if (status.state === "down") {
    // The panel has no authentication yet, so keep connection details in the
    // server log instead of the page.
    console.error(`[admin] database health check failed: ${status.reason}`);
  }
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
