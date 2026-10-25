import { render, screen } from "@testing-library/react";
import type { Session } from "@devmentor/core";
import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { getSession } from "@/server/session";
import UsersPage, { dynamic, metadata } from "./page";

vi.mock("@/server/session", () => ({ getSession: vi.fn() }));
vi.mock("./_components/users-table", () => ({ UsersTable: () => <p>tabela użytkowników</p> }));
vi.mock("next/navigation", () => ({
  // Like the real redirect: never returns.
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

function withSession(session: Session | null) {
  vi.mocked(getSession).mockResolvedValue(session);
}

describe("UsersPage", () => {
  it("is dynamic and has a title", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(metadata.title).toBe("Użytkownicy · Panel administracyjny");
  });

  it("sends a logged-out visitor to the login page and back", async () => {
    withSession(null);
    await expect(UsersPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login?next=/admin/users");
  });

  it.each(["student", "mentor"] as const)("refuses a %s", async (role) => {
    withSession({ userId: "u1", role });
    render(await UsersPage());
    expect(screen.getByText("Brak uprawnień")).toBeTruthy();
    expect(screen.queryByText("tabela użytkowników")).toBeNull();
  });

  it("shows the users table to an admin", async () => {
    withSession({ userId: "u1", role: "admin" });
    render(await UsersPage());
    expect(screen.getByText("Użytkownicy")).toBeTruthy();
    expect(screen.getByText("tabela użytkowników")).toBeTruthy();
  });
});
