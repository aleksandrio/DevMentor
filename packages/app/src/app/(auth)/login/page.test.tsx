import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginPage, { metadata } from "./page";

vi.mock("./_components/login-form", () => ({ LoginForm: () => <form aria-label="formularz logowania" /> }));

describe("LoginPage", () => {
  it("has a title", () => {
    expect(metadata.title).toBe("Logowanie · DevMentor");
  });

  it("renders the form and a link to registration", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Zaloguj się" })).toBeTruthy();
    expect(screen.getByRole("form", { name: "formularz logowania" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Załóż konto" }).getAttribute("href")).toBe("/register");
  });
});
