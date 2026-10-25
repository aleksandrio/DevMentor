import { randomUUID } from "node:crypto";
import { p } from "@mikro-orm/postgresql";

/**
 * Columns every entity shares; spread into `properties` of defineEntity.
 * UUID keys avoid sequential-ID enumeration of other users' records.
 */
export const baseProperties = {
  id: p.uuid().primary().onCreate(() => randomUUID()),
  createdAt: p.datetime().onCreate(() => new Date()),
  updatedAt: p
    .datetime()
    .onCreate(() => new Date())
    .onUpdate(() => new Date()),
};
