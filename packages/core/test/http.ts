import { CSRF_HEADER, CSRF_HEADER_VALUE } from "../src/http/csrf";
import { createSessionToken, SESSION_COOKIE, type Session } from "../src/http/auth";
import type { RouteHandler } from "../src/http/api-handler";

export const testSecret = new TextEncoder().encode("unit-test-secret-that-is-at-least-32-bytes");

interface TestRequest {
  method?: string;
  body?: unknown;
  session?: Session;
  token?: string;
  withCsrfHeader?: boolean;
  url?: string;
  params?: Record<string, string>;
}

/** Calls a route handler the way Next.js does and returns status and parsed envelope. */
export async function call(handler: RouteHandler, options: TestRequest = {}) {
  const { method = "GET", body, session, withCsrfHeader = true, url = "http://localhost/api/test", params = {} } = options;
  const headers = new Headers();
  if (withCsrfHeader) {
    headers.set(CSRF_HEADER, CSRF_HEADER_VALUE);
  }
  const token = options.token ?? (session ? await createSessionToken(session, testSecret) : undefined);
  if (token !== undefined) {
    headers.set("cookie", `other=1; ${SESSION_COOKIE}=${token}`);
  }
  const request = new Request(url, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const response = await handler(request, { params: Promise.resolve(params) });
  return { status: response.status, headers: response.headers, body: await response.json() };
}
