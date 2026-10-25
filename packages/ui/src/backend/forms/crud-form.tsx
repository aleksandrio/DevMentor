"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { z } from "zod";
import { Button } from "@devmentor/ui/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@devmentor/ui/components/ui/field";
import { Input } from "@devmentor/ui/components/ui/input";
import type { ApiResult, FieldErrors } from "../api/api-call";

export interface CrudFormField<Name extends string = string> {
  name: Name;
  label: string;
  type?: "text" | "email" | "password" | "number";
  autoComplete?: string;
  description?: string;
}

interface CrudFormProps<Schema extends z.ZodType, Data> {
  /** The same Zod schema the API route validates with. */
  schema: Schema;
  fields: CrudFormField<Extract<keyof z.input<Schema>, string>>[];
  initialValues?: Partial<Record<Extract<keyof z.input<Schema>, string>, string>>;
  submitLabel: string;
  pendingLabel?: string;
  /** Usually an `apiCall`; its `fieldErrors` are shown next to the matching fields. */
  onSubmit: (values: z.output<Schema>) => Promise<ApiResult<Data>>;
  onSuccess?: (data: Data) => void;
  /** Renders a cancel button and enables Escape. */
  onCancel?: () => void;
}

function readValues(form: HTMLFormElement, fields: CrudFormField[]): Record<string, unknown> {
  const formData = new FormData(form);
  return Object.fromEntries(
    fields.map(({ name, type }) => {
      const raw = formData.get(name);
      const text = typeof raw === "string" ? raw : "";
      return [name, type === "number" && text !== "" ? Number(text) : text];
    }),
  );
}

/**
 * Schema-driven create/edit form: client-side validation with the shared
 * schema, server field errors, pending state, Cmd/Ctrl+Enter submits and
 * Escape cancels.
 */
export function CrudForm<Schema extends z.ZodType, Data>({
  schema,
  fields,
  initialValues,
  submitLabel,
  pendingLabel = "Zapisywanie…",
  onSubmit,
  onSuccess,
  onCancel,
}: CrudFormProps<Schema, Data>) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) {
      return;
    }
    setFormError(null);

    const parsed = schema.safeParse(readValues(event.currentTarget, fields));
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors as FieldErrors);
      return;
    }
    setFieldErrors({});

    setIsPending(true);
    const result = await onSubmit(parsed.data);
    setIsPending(false);
    if (result.ok) {
      onSuccess?.(result.data);
      return;
    }
    setFieldErrors(result.error.fieldErrors ?? {});
    if (!result.error.fieldErrors) {
      setFormError(result.error.message);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    } else if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} onKeyDown={handleKeyDown} data-slot="crud-form">
      <fieldset disabled={isPending}>
        <FieldGroup>
          {fields.map((field) => {
            const id = `crud-form-${field.name}`;
            const errors = fieldErrors[field.name];
            return (
              <Field key={field.name} data-invalid={!!errors?.length}>
                <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                <Input
                  id={id}
                  name={field.name}
                  type={field.type ?? "text"}
                  autoComplete={field.autoComplete}
                  defaultValue={initialValues?.[field.name]}
                  aria-invalid={!!errors?.length}
                />
                {field.description && <FieldDescription>{field.description}</FieldDescription>}
                <FieldError errors={errors?.map((message) => ({ message }))} />
              </Field>
            );
          })}
          {formError && <FieldError>{formError}</FieldError>}
          <Field orientation="horizontal">
            <Button type="submit">{isPending ? pendingLabel : submitLabel}</Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Anuluj
              </Button>
            )}
          </Field>
        </FieldGroup>
      </fieldset>
    </form>
  );
}
