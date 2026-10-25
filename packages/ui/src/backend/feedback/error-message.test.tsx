import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorMessage } from "./error-message";

describe("ErrorMessage", () => {
  it("shows the default title and the message as an alert without a retry button", () => {
    render(<ErrorMessage message="Serwer nie odpowiada." />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Coś poszło nie tak");
    expect(alert).toHaveTextContent("Serwer nie odpowiada.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a custom title and calls onRetry", async () => {
    const onRetry = vi.fn();
    render(<ErrorMessage title="Błąd ładowania" message="Spróbuj później." onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Błąd ładowania");

    await userEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
