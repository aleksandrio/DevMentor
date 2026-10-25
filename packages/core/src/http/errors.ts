// Typed errors thrown by services and route helpers. apiHandler maps them to
// an HTTP status and the JSON error envelope; anything else becomes a 500.

export type FieldErrors = Record<string, string[] | undefined>;

export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(fieldErrors?: FieldErrors, message = "Popraw zaznaczone pola.") {
    super("validation_error", message, 400, fieldErrors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Zaloguj się, aby kontynuować.") {
    super("unauthorized", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Nie masz uprawnień do tej operacji.") {
    super("forbidden", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Nie znaleziono zasobu.") {
    super("not_found", message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("conflict", message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(readonly retryAfterSeconds: number) {
    super("rate_limited", "Zbyt wiele prób. Spróbuj ponownie później.", 429);
  }
}
