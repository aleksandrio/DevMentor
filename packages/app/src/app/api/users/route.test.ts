// @vitest-environment node
// Server code: Node globals (Uint8Array, Request) instead of the jsdom realm.
import { makeCrudRoute, type Cradle } from "@devmentor/core";
import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@devmentor/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@devmentor/core")>()),
  makeCrudRoute: vi.fn(() => ({ GET: "GET handler", POST: "POST handler" })),
}));

// Captured at import time: mock calls are cleared before each test.
const calls = [...vi.mocked(makeCrudRoute).mock.calls];
const config = calls[0]![0];

describe("/api/users", () => {
  it("exports only GET from a CRUD route limited to admins", () => {
    expect(GET).toBe("GET handler");
    expect(calls).toHaveLength(1);
    expect(config.auth).toBe("admin");
    expect(config.schemas).toBeUndefined();
  });

  it("serves the user service from the request scope", () => {
    const userService = { list: vi.fn() };
    expect(config.service({ userService } as unknown as Cradle)).toBe(userService);
  });
});
