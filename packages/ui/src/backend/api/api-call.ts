// The only sanctioned fetch() call site for /api/* (engineering standards).
// The envelope shape mirrors @devmentor/core's apiHandler; ui must not import
// core, so the type is declared here as well.

/** Sent on every call; the server rejects state-changing requests without it (CSRF). */
export const CSRF_HEADER = "X-Requested-With";
export const CSRF_HEADER_VALUE = "devmentor";

export type FieldErrors = Record<string, string[] | undefined>;

export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: FieldErrors;
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError };

export interface ApiCallOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

const NETWORK_ERROR: ApiError = {
  code: "network_error",
  message: "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.",
};
const MALFORMED_RESPONSE: ApiError = {
  code: "malformed_response",
  message: "Serwer zwrócił nieoczekiwaną odpowiedź.",
};

/** Parses a response body as JSON; `null` for an empty or non-JSON body. */
export async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    // A proxy error page or a crashed server: the caller reports it as malformed.
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toApiResult<T>(status: number, body: unknown): ApiResult<T> {
  if (!isRecord(body) || typeof body.ok !== "boolean") {
    return { ok: false, status, error: MALFORMED_RESPONSE };
  }
  if (body.ok) {
    return { ok: true, status, data: body.data as T };
  }
  const error = body.error;
  if (!isRecord(error) || typeof error.code !== "string" || typeof error.message !== "string") {
    return { ok: false, status, error: MALFORMED_RESPONSE };
  }
  return {
    ok: false,
    status,
    error: {
      code: error.code,
      message: error.message,
      fieldErrors: isRecord(error.fieldErrors) ? (error.fieldErrors as FieldErrors) : undefined,
    },
  };
}

/** Calls an `/api/*` endpoint and returns the typed envelope; never throws for HTTP or network errors. */
export async function apiCall<T>(path: string, options: ApiCallOptions = {}): Promise<ApiResult<T>> {
  const { method = "GET", body, signal } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    [CSRF_HEADER]: CSRF_HEADER_VALUE,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
  return toApiResult<T>(response.status, await readJsonSafe(response));
}

export class ApiCallError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, { code, message, fieldErrors }: ApiError) {
    super(message);
    this.name = "ApiCallError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Like `apiCall`, but returns the data directly and throws `ApiCallError` on failure. */
export async function apiCallOrThrow<T>(path: string, options?: ApiCallOptions): Promise<T> {
  const result = await apiCall<T>(path, options);
  if (!result.ok) {
    throw new ApiCallError(result.status, result.error);
  }
  return result.data;
}
