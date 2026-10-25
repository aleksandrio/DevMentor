import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarketingLayout from "./layout";

describe("MarketingLayout", () => {
  it("links to login and registration above the page", () => {
    const { container } = render(
      <MarketingLayout params={Promise.resolve({})}>
        <p>strona główna</p>
      </MarketingLayout>,
    );
    expect(screen.getByRole("link", { name: "Zaloguj się" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: "Załóż konto" }).getAttribute("href")).toBe("/register");
    expect(container.lastElementChild?.textContent).toBe("strona główna");
  });
});
