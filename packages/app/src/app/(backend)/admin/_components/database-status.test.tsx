import { render, screen } from "@testing-library/react";
import type { Cradle, DatabaseStatus as DatabaseStatusData } from "@devmentor/core";
import { describe, expect, it, vi } from "vitest";
import { withRequestScope } from "@/server/request-scope";
import { DatabaseStatus, DatabaseStatusBadge } from "./database-status";

vi.mock("@/server/request-scope", () => ({ withRequestScope: vi.fn() }));

function withHealth(status: DatabaseStatusData) {
  const logger = { error: vi.fn() };
  const cradle = { systemHealthService: { checkDatabase: vi.fn().mockResolvedValue(status) }, logger };
  vi.mocked(withRequestScope).mockImplementation((fn) => fn(cradle as unknown as Cradle));
  return logger;
}

describe("DatabaseStatus", () => {
  it("shows the latency of a working database", async () => {
    const logger = withHealth({ state: "up", latencyMs: 4 });
    render(await DatabaseStatus());
    expect(screen.getByText("działa · 4 ms")).toBeTruthy();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("hides the reason of a down database and logs it instead", async () => {
    const logger = withHealth({ state: "down", reason: "password authentication failed" });
    const { container } = render(await DatabaseStatus());
    expect(screen.getByText("niedostępna")).toBeTruthy();
    expect(container.textContent).not.toContain("password");
    expect(logger.error).toHaveBeenCalledWith(
      { reason: "password authentication failed" },
      "database health check failed",
    );
  });

  it("explains a missing DATABASE_URL", async () => {
    withHealth({ state: "not-configured" });
    render(await DatabaseStatus());
    expect(screen.getByText("nieskonfigurowana (brak DATABASE_URL)")).toBeTruthy();
  });
});

describe("DatabaseStatusBadge", () => {
  it("shows the pending state without a status", () => {
    render(<DatabaseStatusBadge />);
    expect(screen.getByText("sprawdzanie…")).toBeTruthy();
  });
});
