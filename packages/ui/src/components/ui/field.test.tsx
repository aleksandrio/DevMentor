import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field";

describe("Field layout", () => {
  it("renders a fieldset with a legend, group, field, label, content, title and description", () => {
    render(
      <FieldSet className="set">
        <FieldLegend>Dane konta</FieldLegend>
        <FieldGroup data-testid="group">
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <FieldContent data-testid="content">
              <FieldTitle>Tytuł pola</FieldTitle>
              <input id="email" />
              <FieldDescription>Użyjemy go do logowania.</FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>,
    );

    const fieldset = screen.getByRole("group", { name: "Dane konta" });
    expect(fieldset).toHaveAttribute("data-slot", "field-set");
    expect(fieldset).toHaveClass("set");
    expect(screen.getByText("Dane konta")).toHaveAttribute("data-variant", "legend");
    expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "field-group");
    const field = within(fieldset).getAllByRole("group")[0];
    expect(field).toHaveAttribute("data-slot", "field");
    expect(field).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("id", "email");
    expect(screen.getByText("E-mail")).toHaveAttribute("data-slot", "field-label");
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "field-content");
    expect(screen.getByText("Tytuł pola")).toHaveAttribute("data-slot", "field-label");
    expect(screen.getByText("Użyjemy go do logowania.")).toHaveAttribute("data-slot", "field-description");
  });

  it("renders the label legend variant and a horizontal field", () => {
    render(
      <>
        <fieldset>
          <FieldLegend variant="label">Etykieta</FieldLegend>
        </fieldset>
        <Field orientation="horizontal" aria-label="Poziome" />
      </>,
    );
    expect(screen.getByText("Etykieta")).toHaveAttribute("data-variant", "label");
    expect(screen.getByRole("group", { name: "Poziome" })).toHaveAttribute("data-orientation", "horizontal");
  });
});

describe("FieldSeparator", () => {
  it("renders only a separator line without content", () => {
    render(<FieldSeparator data-testid="sep" />);
    const separator = screen.getByTestId("sep");
    expect(separator).toHaveAttribute("data-content", "false");
    expect(within(separator).getByRole("separator")).toBeInTheDocument();
    expect(separator.querySelector("[data-slot=field-separator-content]")).toBeNull();
  });

  it("renders its content over the line", () => {
    render(<FieldSeparator data-testid="sep">albo</FieldSeparator>);
    expect(screen.getByTestId("sep")).toHaveAttribute("data-content", "true");
    expect(screen.getByText("albo")).toHaveAttribute("data-slot", "field-separator-content");
  });
});

describe("FieldError", () => {
  it("renders nothing without children or errors", () => {
    const { container } = render(
      <>
        <FieldError />
        <FieldError errors={[]} />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("prefers children over errors", () => {
    render(<FieldError errors={[{ message: "Z listy" }]}>Własny komunikat</FieldError>);
    expect(screen.getByRole("alert")).toHaveTextContent("Własny komunikat");
  });

  it("shows a single message for duplicated errors", () => {
    render(<FieldError errors={[{ message: "Wymagane" }, { message: "Wymagane" }]} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Wymagane");
    expect(within(alert).queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders nothing when the only error has no message", () => {
    const { container } = render(<FieldError errors={[undefined]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists several distinct errors and skips empty ones", () => {
    render(<FieldError errors={[{ message: "Za krótkie" }, undefined, { message: "Bez cyfry" }]} />);
    const items = within(screen.getByRole("alert")).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["Za krótkie", "Bez cyfry"]);
  });
});
