import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("shows only the title when nothing else is given", () => {
    const { container } = render(<EmptyState title="Brak użytkowników" />);
    expect(screen.getByText("Brak użytkowników")).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("shows the description and the action", () => {
    render(
      <EmptyState
        title="Brak użytkowników"
        description="Dodaj pierwszego użytkownika."
        action={<button type="button">Dodaj</button>}
      />,
    );
    expect(screen.getByText("Dodaj pierwszego użytkownika.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dodaj" })).toBeInTheDocument();
  });
});
