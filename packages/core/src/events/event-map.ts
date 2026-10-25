import type { UserRole } from "@devmentor/db";

/** Every domain event, keyed `concept.entity.action` (past tense), with its payload. */
export interface EventMap {
  "auth.user.registered": { userId: string; role: UserRole };
}

export type EventId = keyof EventMap;
