import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the logos and the external links", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("page.tsx");
    expect(screen.getByAltText("Next.js logo")).toBeTruthy();
    expect(screen.getByAltText("Vercel logomark")).toBeTruthy();
    const deploy = screen.getByRole("link", { name: /Deploy Now/ });
    expect(deploy.getAttribute("target")).toBe("_blank");
    expect(deploy.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByRole("link", { name: "Documentation" }).getAttribute("href")).toContain("nextjs.org/docs");
  });
});
