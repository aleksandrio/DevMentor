import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiCall } from "@devmentor/ui/backend/api/api-call";
import { useRouter, useSearchParams } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";

vi.mock("next/navigation", () => ({ useRouter: vi.fn(), useSearchParams: vi.fn() }));
vi.mock("@devmentor/ui/backend/api/api-call", () => ({ apiCall: vi.fn() }));

const router = { push: vi.fn(), refresh: vi.fn() };

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>);
});

async function submit(displayName: string, email: string, password: string) {
  const user = userEvent.setup();
  render(<RegisterForm />);
  await user.type(screen.getByLabelText("Imię lub nazwa"), displayName);
  await user.type(screen.getByLabelText("E-mail"), email);
  await user.type(screen.getByLabelText("Hasło"), password);
  await user.click(screen.getByRole("button", { name: "Załóż konto" }));
}

describe("RegisterForm", () => {
  it("shows the password hint", () => {
    render(<RegisterForm />);
    expect(screen.getByText("Co najmniej 8 znaków.")).toBeTruthy();
  });

  it("posts the new account and goes to the home page without ?next=", async () => {
    vi.mocked(apiCall).mockResolvedValue({ ok: true, status: 201, data: { id: "u1" } });
    await submit("Ala", "ala@example.com", "password123");

    expect(apiCall).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: { displayName: "Ala", email: "ala@example.com", password: "password123" },
    });
    expect(router.push).toHaveBeenCalledWith("/");
    expect(router.refresh).toHaveBeenCalled();
  });

  it("validates on the client before calling the API", async () => {
    await submit("Ala", "ala@example.com", "short");

    expect(await screen.findByText("Hasło musi mieć co najmniej 8 znaków.")).toBeTruthy();
    expect(apiCall).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows server field errors next to the field", async () => {
    vi.mocked(apiCall).mockResolvedValue({
      ok: false,
      status: 400,
      error: { code: "validation_error", message: "Błąd", fieldErrors: { email: ["Ten adres jest zajęty."] } },
    });
    await submit("Ala", "ala@example.com", "password123");

    expect(await screen.findByText("Ten adres jest zajęty.")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();
  });
});
