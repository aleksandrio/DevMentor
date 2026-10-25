import type { DatabaseHealthProbe } from "./database-health-probe";

export type DatabaseStatus =
  | { state: "up"; latencyMs: number }
  | { state: "down"; reason: string }
  | { state: "not-configured" };

export interface SystemHealthServiceDeps {
  /** `null` when the application runs without a configured database. */
  databaseHealthProbe: DatabaseHealthProbe | null;
}

export class SystemHealthService {
  private readonly databaseHealthProbe: DatabaseHealthProbe | null;

  constructor({ databaseHealthProbe }: SystemHealthServiceDeps) {
    this.databaseHealthProbe = databaseHealthProbe;
  }

  async checkDatabase(): Promise<DatabaseStatus> {
    if (!this.databaseHealthProbe) {
      return { state: "not-configured" };
    }
    const startedAt = performance.now();
    try {
      await this.databaseHealthProbe.ping();
    } catch (error) {
      return {
        state: "down",
        reason: error instanceof Error ? error.message : String(error),
      };
    }
    return {
      state: "up",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}
