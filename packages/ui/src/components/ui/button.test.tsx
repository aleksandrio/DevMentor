import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders a button with the default variant and size and handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Zapisz</Button>);
    const button = screen.getByRole("button", { name: "Zapisz" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button.className).toBe(buttonVariants());

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("combines a variant, a size and a custom class", () => {
    render(
      <Button variant="destructive" size="sm" className="extra">
        Usuń
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Usuń" });
    expect(button).toHaveClass("text-destructive", "h-7", "extra");
  });

  it("does not fire clicks when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Wyślij
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Wyślij" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("buttonVariants", () => {
  it("produces classes usable on a link", () => {
    render(
      <a href="/admin" className={buttonVariants({ variant: "outline" })}>
        Panel
      </a>,
    );
    expect(screen.getByRole("link", { name: "Panel" })).toHaveClass("border-border");
  });
});
