import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("Label", () => {
  it("labels its control", () => {
    render(
      <>
        <Label htmlFor="name" className="extra">
          Imię
        </Label>
        <input id="name" />
      </>,
    );
    expect(screen.getByLabelText("Imię")).toHaveAttribute("id", "name");
    expect(screen.getByText("Imię")).toHaveAttribute("data-slot", "label");
    expect(screen.getByText("Imię")).toHaveClass("extra");
  });
});
