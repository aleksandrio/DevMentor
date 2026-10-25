import type { Logger } from "../logger";
import type { EventBus } from "./event-bus";

/** Every in-process subscriber, registered once when the container is built. */
export function registerEventSubscribers(eventBus: EventBus, logger: Logger): void {
  eventBus.on("auth.user.registered", ({ userId, role }) => {
    logger.info({ event: "auth.user.registered", userId, role }, "user registered");
  });
}
