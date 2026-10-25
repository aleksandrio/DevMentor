import type { Logger } from "../logger";
import type { EventId, EventMap } from "./event-map";

type Listener<Id extends EventId> = (payload: EventMap[Id]) => void | Promise<void>;

export interface EventBusDeps {
  logger: Logger;
}

/**
 * Typed in-process emitter for side effects (logging, notifications, cache
 * invalidation). Not a queue: listeners run during `emit`, and there are no
 * retries or workers in this project.
 */
export class EventBus {
  private readonly logger: Logger;
  private readonly listeners = new Map<EventId, Set<Listener<EventId>>>();

  constructor({ logger }: EventBusDeps) {
    this.logger = logger;
  }

  /** Subscribes to one event; returns the unsubscribe function. */
  on<Id extends EventId>(id: Id, listener: Listener<Id>): () => void {
    const listeners = this.listeners.get(id) ?? new Set();
    listeners.add(listener as Listener<EventId>);
    this.listeners.set(id, listeners);
    return () => listeners.delete(listener as Listener<EventId>);
  }

  /** Emit after a successful mutation. A failing listener is logged and never fails the caller. */
  async emit<Id extends EventId>(id: Id, payload: EventMap[Id]): Promise<void> {
    for (const listener of this.listeners.get(id) ?? []) {
      try {
        await listener(payload);
      } catch (error) {
        this.logger.error({ err: error, event: id }, "event listener failed");
      }
    }
  }
}
