import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RegisterPage, { metadata } from "./page";

vi.mock("./_components/register-form", () => ({
  RegisterForm: () => <form aria-label="formularz rejestracji" />,
}));

describe("RegisterPage", () => {
  it("has a title", () => {
    expect(metadata.title).toBe("Rejestracja · DevMentor");
  });

  it("renders the form and a link to login", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "Załóż konto" })).toBeTruthy();
    expect(screen.getByRole("form", { name: "formularz rejestracji" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Zaloguj się" }).getAttribute("href")).toBe("/login");
  });
});
