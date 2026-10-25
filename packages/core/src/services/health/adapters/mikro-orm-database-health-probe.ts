import type { EntityManager } from "@devmentor/db";
import type { DatabaseHealthProbe } from "../database-health-probe.port";

export interface MikroOrmDatabaseHealthProbeDeps {
  /** Request-scoped fork of the ORM's EntityManager. */
  em: EntityManager;
}

export class MikroOrmDatabaseHealthProbe implements DatabaseHealthProbe {
  private readonly em: EntityManager;

  constructor({ em }: MikroOrmDatabaseHealthProbeDeps) {
    this.em = em;
  }

  async ping(): Promise<void> {
    await this.em.getConnection().execute("select 1");
  }
}
