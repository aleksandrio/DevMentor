import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ApiResult } from "../api/api-call";
import { CrudForm, type CrudFormField } from "./crud-form";

const schema = z.object({
  name: z.string().min(1, "Imię jest wymagane"),
  age: z.number({ error: "Podaj wiek" }).min(18, "Minimum 18 lat"),
});

type Values = z.output<typeof schema>;
type Saved = { id: string };

const fields: CrudFormField<"name" | "age">[] = [
  { name: "name", label: "Imię", autoComplete: "name", description: "Tak, jak w dokumencie." },
  { name: "age", label: "Wiek", type: "number" },
];

const success: ApiResult<Saved> = { ok: true, status: 201, data: { id: "1" } };

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function getForm(): HTMLFormElement {
  const form = screen.getByRole("button", { name: /Zapisz|Zapisywanie/ }).closest("form");
  if (!form) {
    throw new Error("form not found");
  }
  return form;
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Imię"), "Ala");
  await user.type(screen.getByLabelText("Wiek"), "30");
}

describe("CrudForm", () => {
  it("renders labelled fields with types, descriptions and initial values", () => {
    render(
      <CrudForm
        schema={schema}
        fields={fields}
        initialValues={{ name: "Ola" }}
        submitLabel="Zapisz"
        onSubmit={vi.fn<(values: Values) => Promise<ApiResult<Saved>>>()}
      />,
    );

    const name = screen.getByLabelText("Imię");
    expect(name).toHaveValue("Ola");
    expect(name).toHaveAttribute("type", "text");
    expect(name).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText("Wiek")).toHaveAttribute("type", "number");
    expect(screen.getByText("Tak, jak w dokumencie.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Anuluj" })).not.toBeInTheDocument();
  });

  it("shows client-side validation errors and does not submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>();
    render(<CrudForm schema={schema} fields={fields} submitLabel="Zapisz" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(screen.getByText("Imię jest wymagane")).toBeInTheDocument();
    expect(screen.getByText("Podaj wiek")).toBeInTheDocument();
    expect(screen.getByLabelText("Imię")).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits parsed values with numbers converted and calls onSuccess", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>().mockResolvedValue(success);
    const onSuccess = vi.fn();
    render(
      <CrudForm
        schema={schema}
        fields={fields}
        submitLabel="Zapisz"
        onSubmit={onSubmit}
        onSuccess={onSuccess}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Zapisz" }));
    expect(screen.getByText("Imię jest wymagane")).toBeInTheDocument();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Ala", age: 30 });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: "1" }));
    expect(screen.queryByText("Imię jest wymagane")).not.toBeInTheDocument();
  });

  it("works without onSuccess", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>().mockResolvedValue(success);
    render(<CrudForm schema={schema} fields={fields} submitLabel="Zapisz" onSubmit={onSubmit} />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Zapisz" })).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows server field errors next to the matching fields", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>().mockResolvedValue({
      ok: false,
      status: 400,
      error: { code: "validation_error", message: "Błędne dane", fieldErrors: { name: ["Imię zajęte"] } },
    });
    render(<CrudForm schema={schema} fields={fields} submitLabel="Zapisz" onSubmit={onSubmit} />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(await screen.findByText("Imię zajęte")).toBeInTheDocument();
    expect(screen.queryByText("Błędne dane")).not.toBeInTheDocument();
  });

  it("shows a form-level message when the server returns no field errors", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>().mockResolvedValue({
      ok: false,
      status: 500,
      error: { code: "internal_error", message: "Coś poszło nie tak" },
    });
    render(<CrudForm schema={schema} fields={fields} submitLabel="Zapisz" onSubmit={onSubmit} />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Coś poszło nie tak");
  });

  it("shows the pending label, disables the fields and ignores a second submit", async () => {
    const user = userEvent.setup();
    const pending = deferred<ApiResult<Saved>>();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>().mockReturnValue(pending.promise);
    render(
      <CrudForm
        schema={schema}
        fields={fields}
        submitLabel="Zapisz"
        pendingLabel="Trwa zapis…"
        onSubmit={onSubmit}
      />,
    );

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    const pendingButton = await screen.findByRole("button", { name: "Trwa zapis…" });
    expect(pendingButton.closest("fieldset")).toBeDisabled();
    expect(screen.getByLabelText("Imię")).toBeDisabled();

    fireEvent.submit(pendingButton.closest("form") as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    pending.resolve(success);
    expect(await screen.findByRole("button", { name: "Zapisz" })).toBeEnabled();
  });

  it("uses the default pending label", async () => {
    const user = userEvent.setup();
    const pending = deferred<ApiResult<Saved>>();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>().mockReturnValue(pending.promise);
    render(<CrudForm schema={schema} fields={fields} submitLabel="Zapisz" onSubmit={onSubmit} />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Zapisz" }));

    expect(await screen.findByRole("button", { name: "Zapisywanie…" })).toBeInTheDocument();
    pending.resolve(success);
    expect(await screen.findByRole("button", { name: "Zapisz" })).toBeInTheDocument();
  });

  it.each([
    ["Ctrl", "{Control>}{Enter}{/Control}"],
    ["Cmd", "{Meta>}{Enter}{/Meta}"],
  ])("submits on %s+Enter", async (_label, keys) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>().mockResolvedValue(success);
    render(<CrudForm schema={schema} fields={fields} submitLabel="Zapisz" onSubmit={onSubmit} />);

    await fillValid(user);
    await user.keyboard(keys);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Ala", age: 30 }));
  });

  it("renders a cancel button and cancels on Escape when onCancel is given", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <CrudForm
        schema={schema}
        fields={fields}
        submitLabel="Zapisz"
        onSubmit={vi.fn<(values: Values) => Promise<ApiResult<Saved>>>()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Anuluj" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByLabelText("Imię"));
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("ignores Escape without onCancel and plain keys", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>();
    render(<CrudForm schema={schema} fields={fields} submitLabel="Zapisz" onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText("Imię"));
    await user.keyboard("{Escape}a");

    expect(screen.getByLabelText("Imię")).toHaveValue("a");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("treats a field missing from the submitted form data as empty", async () => {
    const onSubmit = vi.fn<(values: Values) => Promise<ApiResult<Saved>>>();
    render(
      <fieldset disabled>
        <CrudForm schema={schema} fields={fields} submitLabel="Zapisz" onSubmit={onSubmit} />
      </fieldset>,
    );

    fireEvent.submit(getForm());

    expect(await screen.findByText("Imię jest wymagane")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
