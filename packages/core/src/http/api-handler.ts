import type { UserRole } from "@devmentor/db";
import { getContainer } from "../container/container";
import type { Cradle } from "../container/cradle";
import { withScope } from "../container/scope";
import { requireRole, requireSession, type Session } from "./auth";
import { assertCsrfHeader } from "./csrf";
import { AppError, RateLimitError } from "./errors";

/** Who may call a route: anyone, any logged-in user, or only users with one role. */
export type AuthRequirement = "public" | "session" | UserRole;

type RouteParams = Record<string, string | string[] | undefined>;

export interface HandlerContext<Auth extends AuthRequirement, Params extends RouteParams> {
  request: Request;
  params: Params;
  /** Always set unless the route is public. */
  session: Auth extends "public" ? null : Session;
  cradle: Cradle;
}

/** Return this from a handler to set a status or headers (e.g. Set-Cookie) on the success envelope. */
export class ApiResponse<T> {
  constructor(
    readonly data: T,
    readonly init: { status?: number; headers?: HeadersInit } = {},
  ) {}
}

export type RouteHandler = (
  request: Request,
  context: { params: Promise<RouteParams> },
) => Promise<Response>;

const INTERNAL_ERROR_MESSAGE = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.";

function successResponse(result: unknown): Response {
  if (result instanceof ApiResponse) {
    return Response.json({ ok: true, data: result.data ?? null }, result.init);
  }
  return Response.json({ ok: true, data: result ?? null });
}

function appErrorResponse(error: AppError): Response {
  const headers = new Headers();
  if (error instanceof RateLimitError) {
    headers.set("Retry-After", String(error.retryAfterSeconds));
  }
  return Response.json(
    {
      ok: false,
      error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors },
    },
    { status: error.status, headers },
  );
}

function internalErrorResponse(): Response {
  // Never leak the stack or the message of an unexpected error to the client.
  return Response.json(
    { ok: false, error: { code: "internal_error", message: INTERNAL_ERROR_MESSAGE } },
    { status: 500 },
  );
}

async function logUnexpected(error: unknown, request: Request): Promise<void> {
  const context = { err: error, method: request.method, url: new URL(request.url).pathname };
  try {
    const { logger } = (await getContainer()).cradle;
    logger.error(context, "unhandled error in API route");
  } catch {
    // The container itself failed (e.g. invalid environment): no logger exists.
    console.error("unhandled error in API route", context);
  }
}

async function authenticate(
  request: Request,
  auth: AuthRequirement,
  cradle: Cradle,
): Promise<Session | null> {
  if (auth === "public") {
    return null;
  }
  const session = await requireSession(request, cradle.config.authSecret);
  if (auth !== "session") {
    requireRole(session, auth);
  }
  return session;
}

/**
 * Wraps a route function: CSRF check, authentication (default: any logged-in
 * user), a request DI scope, the JSON envelope and error mapping. Route files
 * never write their own try/catch.
 */
export function apiHandler<T, Auth extends AuthRequirement = "session", Params extends RouteParams = RouteParams>(
  handler: (context: HandlerContext<Auth, Params>) => Promise<T | ApiResponse<T>>,
  options: { auth?: Auth } = {},
): RouteHandler {
  const auth: AuthRequirement = options.auth ?? "session";
  return async (request, routeContext) => {
    try {
      assertCsrfHeader(request);
      const params = (await routeContext.params) as Params;
      return await withScope(async (cradle) => {
        const session = await authenticate(request, auth, cradle);
        const result = await handler({
          request,
          params,
          session: session as HandlerContext<Auth, Params>["session"],
          cradle,
        });
        return successResponse(result);
      });
    } catch (error) {
      if (error instanceof AppError) {
        return appErrorResponse(error);
      }
      await logUnexpected(error, request);
      return internalErrorResponse();
    }
  };
}
