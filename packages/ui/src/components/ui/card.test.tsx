import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  it("renders every part with its slot and the default size", () => {
    render(
      <Card data-testid="card" className="extra">
        <CardHeader className="h">
          <CardTitle className="t">Tytuł</CardTitle>
          <CardDescription className="d">Opis</CardDescription>
          <CardAction className="a">Akcja</CardAction>
        </CardHeader>
        <CardContent className="c">Treść</CardContent>
        <CardFooter className="f">Stopka</CardFooter>
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveAttribute("data-size", "default");
    expect(card).toHaveClass("extra");
    const parts = [
      ["Tytuł", "card-title", "t"],
      ["Opis", "card-description", "d"],
      ["Akcja", "card-action", "a"],
      ["Treść", "card-content", "c"],
      ["Stopka", "card-footer", "f"],
    ] as const;
    for (const [text, slot, className] of parts) {
      const element = screen.getByText(text);
      expect(element).toHaveAttribute("data-slot", slot);
      expect(element).toHaveClass(className);
    }
    const header = screen.getByText("Tytuł").parentElement;
    expect(header).toHaveAttribute("data-slot", "card-header");
    expect(header).toHaveClass("h");
  });

  it("renders the small size", () => {
    render(
      <Card data-testid="card" size="sm">
        Mała
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveAttribute("data-size", "sm");
  });
});
