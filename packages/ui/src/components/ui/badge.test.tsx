import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, badgeVariants } from "./badge";

describe("Badge", () => {
  it("renders a span with the default variant", () => {
    render(<Badge className="extra">Nowy</Badge>);
    const badge = screen.getByText("Nowy");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).toHaveClass("bg-primary", "extra");
  });

  it.each([
    ["secondary", "bg-secondary"],
    ["destructive", "text-destructive"],
    ["outline", "border-border"],
    ["ghost", "hover:bg-muted"],
    ["link", "hover:underline"],
  ] as const)("renders the %s variant", (variant, expectedClass) => {
    render(<Badge variant={variant}>Etykieta</Badge>);
    expect(screen.getByText("Etykieta")).toHaveClass(expectedClass);
    expect(badgeVariants({ variant })).toContain(expectedClass);
  });

  it("renders through a custom element", () => {
    render(<Badge render={<a href="/admin" />}>Link</Badge>);
    expect(screen.getByRole("link", { name: "Link" })).toHaveAttribute("data-slot", "badge");
  });
});
