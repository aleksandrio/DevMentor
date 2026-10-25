import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserDto } from "@devmentor/core";
import { apiCall, type ApiCallOptions, type ApiResult } from "@devmentor/ui/backend/api/api-call";
import { describe, expect, it, vi } from "vitest";
import { UsersTable } from "./users-table";

vi.mock("@devmentor/ui/backend/api/api-call", () => ({ apiCall: vi.fn() }));

const users: UserDto[] = [
  { id: "u1", email: "ala@example.com", displayName: "Ala", role: "admin", createdAt: "2026-10-25T10:00:00.000Z" },
  { id: "u2", email: "bartek@example.com", displayName: "Bartek", role: "student", createdAt: "2026-10-24T08:30:00.000Z" },
  { id: "u3", email: "celina@example.com", displayName: "Celina", role: "mentor", createdAt: "2026-10-23T12:00:00.000Z" },
] as UserDto[];

const loaded: ApiResult<UserDto[]> = { ok: true, status: 200, data: users };

describe("UsersTable", () => {
  it("shows the loading state, then the users", async () => {
    vi.mocked(apiCall).mockResolvedValue(loaded);
    render(<UsersTable />);

    expect(screen.getByRole("status").textContent).toBe("Ładowanie…");
    expect(await screen.findByText("Ala")).toBeTruthy();
    expect(apiCall).toHaveBeenCalledWith("/api/users", { signal: expect.any(AbortSignal) });
    expect(screen.getByText("bartek@example.com")).toBeTruthy();
    expect(screen.getByText("administrator")).toBeTruthy();
    expect(screen.getByText("uczeń")).toBeTruthy();
    expect(screen.getByText("mentor")).toBeTruthy();
    const createdAt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(users[0]!.createdAt),
    );
    expect(screen.getByText(createdAt)).toBeTruthy();
    expect(screen.getByText("Konta zarejestrowane w serwisie")).toBeTruthy();
  });

  it("shows the empty state", async () => {
    vi.mocked(apiCall).mockResolvedValue({ ok: true, status: 200, data: [] });
    render(<UsersTable />);
    expect(await screen.findByText("Brak użytkowników")).toBeTruthy();
  });

  it("shows the API error and reloads on retry", async () => {
    vi.mocked(apiCall)
      .mockResolvedValueOnce({ ok: false, status: 403, error: { code: "forbidden", message: "Brak dostępu." } })
      .mockResolvedValueOnce(loaded);
    const user = userEvent.setup();
    render(<UsersTable />);

    expect((await screen.findByRole("alert")).textContent).toContain("Brak dostępu.");
    await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect(await screen.findByText("Ala")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(apiCall).toHaveBeenCalledTimes(2);
  });

  it("reports a rejected load that was not aborted", async () => {
    vi.mocked(apiCall).mockRejectedValue(new TypeError("boom"));
    render(<UsersTable />);
    expect((await screen.findByRole("alert")).textContent).toContain("Nie udało się wczytać listy użytkowników.");
  });

  it("ignores the rejection of an aborted load", async () => {
    // StrictMode mounts, unmounts (aborting the first load) and mounts again.
    const signals: AbortSignal[] = [];
    vi.mocked(apiCall).mockImplementation(
      (_path: string, options: ApiCallOptions = {}) =>
        new Promise((resolve, reject) => {
          const signal = options.signal!;
          signals.push(signal);
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          queueMicrotask(() => {
            if (!signal.aborted) {
              resolve(loaded as ApiResult<never>);
            }
          });
        }),
    );
    render(
      <StrictMode>
        <UsersTable />
      </StrictMode>,
    );

    expect(await screen.findByText("Ala")).toBeTruthy();
    expect(signals).toHaveLength(2);
    expect(signals[0]!.aborted).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("aborts the pending load on unmount", () => {
    vi.mocked(apiCall).mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<UsersTable />);
    const signal = vi.mocked(apiCall).mock.calls[0]![1]!.signal!;
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
