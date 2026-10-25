import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiCall, type ApiResult } from "@devmentor/ui/backend/api/api-call";
import { useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { LogoutButton } from "./logout-button";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@devmentor/ui/backend/api/api-call", () => ({ apiCall: vi.fn() }));

describe("LogoutButton", () => {
  it("is disabled while logging out, then goes to the login page", async () => {
    const router = { push: vi.fn(), refresh: vi.fn() };
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
    let finish: (result: ApiResult<unknown>) => void = () => {};
    vi.mocked(apiCall).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<LogoutButton />);

    const button = screen.getByRole<HTMLButtonElement>("button", { name: "Wyloguj" });
    expect(button.disabled).toBe(false);
    await user.click(button);

    expect(apiCall).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(button.disabled).toBe(true);
    expect(router.push).not.toHaveBeenCalled();

    finish({ ok: true, status: 200, data: null });
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/login"));
    expect(router.refresh).toHaveBeenCalled();
  });
});
