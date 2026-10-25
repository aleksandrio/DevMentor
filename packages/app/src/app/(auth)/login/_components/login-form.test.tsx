import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiCall } from "@devmentor/ui/backend/api/api-call";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(), useSearchParams: vi.fn() }));
vi.mock("@devmentor/ui/backend/api/api-call", () => ({ apiCall: vi.fn() }));

const router = { push: vi.fn(), refresh: vi.fn() };

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams("next=/admin/users") as unknown as ReturnType<typeof useSearchParams>,
  );
});

async function submit(email: string, password: string) {
  const user = userEvent.setup();
  render(<LoginForm />);
  await user.type(screen.getByLabelText("E-mail"), email);
  await user.type(screen.getByLabelText("Hasło"), password);
  await user.click(screen.getByRole("button", { name: "Zaloguj się" }));
}

describe("LoginForm", () => {
  it("posts the credentials and returns to the ?next= path", async () => {
    vi.mocked(apiCall).mockResolvedValue({ ok: true, status: 200, data: { userId: "u1", role: "admin" } });
    await submit(" Ala@Example.com ", "secret");

    expect(apiCall).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: { email: "ala@example.com", password: "secret" },
    });
    expect(router.push).toHaveBeenCalledWith("/admin/users");
    expect(router.refresh).toHaveBeenCalled();
  });

  it("shows the server error and stays on the page", async () => {
    vi.mocked(apiCall).mockResolvedValue({
      ok: false,
      status: 401,
      error: { code: "unauthorized", message: "Nieprawidłowy e-mail lub hasło." },
    });
    await submit("ala@example.com", "wrong");

    expect(await screen.findByText("Nieprawidłowy e-mail lub hasło.")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });
});
