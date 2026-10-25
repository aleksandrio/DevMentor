import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminPage, { dynamic } from "./page";

// The real DatabaseStatus is an async server component; a synchronous
// stand-in lets the page render in jsdom.
vi.mock("./_components/database-status", () => ({
  DatabaseStatus: () => <span>status bazy</span>,
  DatabaseStatusBadge: () => <span>sprawdzanie…</span>,
}));

describe("AdminPage", () => {
  it("reads the database on every request", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("shows the panel with the database status and a link home", () => {
    render(<AdminPage />);
    expect(screen.getByText("Panel administracyjny")).toBeTruthy();
    expect(screen.getByText("status bazy")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Przejdź do strony głównej" }).getAttribute("href")).toBe("/");
  });
});
