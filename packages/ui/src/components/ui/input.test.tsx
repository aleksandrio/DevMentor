import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders a typed input that accepts text", async () => {
    render(<Input aria-label="E-mail" type="email" className="extra" />);
    const input = screen.getByRole("textbox", { name: "E-mail" });
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("data-slot", "input");
    expect(input).toHaveClass("extra");

    await userEvent.type(input, "a@example.com");
    expect(input).toHaveValue("a@example.com");
  });
});
