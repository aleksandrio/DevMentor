import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingMessage } from "./loading-message";

describe("LoadingMessage", () => {
  it("announces the default label as a status", () => {
    render(<LoadingMessage />);
    expect(screen.getByRole("status")).toHaveTextContent("Ładowanie…");
  });

  it("shows a custom label", () => {
    render(<LoadingMessage label="Wczytywanie listy…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Wczytywanie listy…");
  });
});
