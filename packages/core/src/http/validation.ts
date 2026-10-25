import { z } from "zod";
import { ValidationError } from "./errors";

/** Parses with a Zod schema; failures become a ValidationError with per-field messages. */
export function parseWith<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(z.flattenError(parsed.error).fieldErrors);
  }
  return parsed.data;
}

/**
 * Reads a JSON request body and parses it with `schema`. Only the schema's
 * output reaches services, so unknown fields (id, role, ownerId, ...) are
 * dropped: no mass assignment.
 */
export async function parseBody<Schema extends z.ZodType>(request: Request, schema: Schema): Promise<z.output<Schema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError(undefined, "Treść żądania musi być poprawnym JSON-em.");
  }
  return parseWith(schema, body);
}
