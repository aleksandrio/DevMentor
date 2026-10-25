import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AuthLayout from "./layout";

describe("AuthLayout", () => {
  it("renders a link home and the page", () => {
    render(
      <AuthLayout params={Promise.resolve({})}>
        <p>formularz</p>
      </AuthLayout>,
    );
    expect(screen.getByRole("link", { name: "DevMentor" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("main").textContent).toBe("formularz");
  });
});
