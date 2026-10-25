// @vitest-environment node
// Server code: Node globals (Uint8Array, Request) instead of the jsdom realm.
import { withScope, type Cradle } from "@devmentor/core";
import { connection } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { withRequestScope } from "./request-scope";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@devmentor/core", () => ({ withScope: vi.fn() }));

describe("withRequestScope", () => {
  it("waits for the request connection, then runs fn in a DI scope", async () => {
    const order: string[] = [];
    vi.mocked(connection).mockImplementation(async () => {
      order.push("connection");
    });
    const cradle = { config: {} } as Cradle;
    vi.mocked(withScope).mockImplementation(async (fn) => {
      order.push("scope");
      return fn(cradle);
    });
    const fn = vi.fn(async (scoped: Cradle) => (scoped === cradle ? "result" : "wrong cradle"));

    await expect(withRequestScope(fn)).resolves.toBe("result");
    expect(order).toEqual(["connection", "scope"]);
  });

  it("never opens a scope while prerendering", async () => {
    vi.mocked(connection).mockRejectedValue(new Error("prerender bail-out"));
    await expect(withRequestScope(vi.fn())).rejects.toThrow("prerender bail-out");
    expect(withScope).not.toHaveBeenCalled();
  });
});
