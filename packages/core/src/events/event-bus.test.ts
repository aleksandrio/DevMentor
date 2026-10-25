import { describe, expect, it, vi } from "vitest";
import type { Logger } from "../logger";
import { EventBus } from "./event-bus";
import { registerEventSubscribers } from "./subscribers";

function fakeLogger() {
  return { info: vi.fn(), error: vi.fn() } as unknown as Logger & { info: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
}

const payload = { userId: "u1", role: "student" } as const;

describe("EventBus", () => {
  it("delivers a payload to every listener until it unsubscribes", async () => {
    const bus = new EventBus({ logger: fakeLogger() });
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribe = bus.on("auth.user.registered", first);
    bus.on("auth.user.registered", second);

    await bus.emit("auth.user.registered", payload);
    unsubscribe();
    await bus.emit("auth.user.registered", payload);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledWith(payload);
  });

  it("does nothing for an event without listeners", async () => {
    await expect(new EventBus({ logger: fakeLogger() }).emit("auth.user.registered", payload)).resolves.toBeUndefined();
  });

  it("logs a failing listener and still runs the others", async () => {
    const logger = fakeLogger();
    const bus = new EventBus({ logger });
    const failure = new Error("smtp down");
    const after = vi.fn();
    bus.on("auth.user.registered", async () => Promise.reject(failure));
    bus.on("auth.user.registered", after);

    await bus.emit("auth.user.registered", payload);
    expect(logger.error).toHaveBeenCalledWith({ err: failure, event: "auth.user.registered" }, "event listener failed");
    expect(after).toHaveBeenCalled();
  });
});

describe("registerEventSubscribers", () => {
  it("logs every registration", async () => {
    const logger = fakeLogger();
    const bus = new EventBus({ logger });
    registerEventSubscribers(bus, logger);

    await bus.emit("auth.user.registered", payload);
    expect(logger.info).toHaveBeenCalledWith({ event: "auth.user.registered", userId: "u1", role: "student" }, "user registered");
  });
});
