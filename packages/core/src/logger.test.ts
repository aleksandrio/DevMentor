import { Writable } from "node:stream";
import { pino } from "pino";
import { describe, expect, it, vi } from "vitest";

vi.mock("pino", async (importOriginal) => {
  const actual = await importOriginal<typeof import("pino")>();
  return { ...actual, pino: vi.fn(actual.pino) };
});

const { createLogger } = await import("./logger");

describe("createLogger", () => {
  it("uses the configured level and redacts credentials at the top level and one level deep", () => {
    const logger = createLogger({ logLevel: "debug" });
    expect(logger.level).toBe("debug");

    const lines: string[] = [];
    const sink = new Writable({
      write(chunk, _encoding, done) {
        lines.push(String(chunk));
        done();
      },
    });
    const options = vi.mocked(pino).mock.calls[0][0] as Parameters<typeof pino>[0];
    pino(options as object, sink).info(
      { password: "hunter2", user: { passwordHash: "$2b$", token: "jwt" }, headers: { cookie: "s=1", "set-cookie": "s=1", authorization: "Bearer x" } },
      "login",
    );
    const line = lines.join("");
    for (const secret of ["hunter2", "$2b$", "jwt", "s=1", "Bearer x"]) {
      expect(line).not.toContain(secret);
    }
    expect(line).toContain("[Redacted]");
  });
});
