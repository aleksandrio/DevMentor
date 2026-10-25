import { ForbiddenError } from "./errors";

// Auth rides on a cookie, so state-changing requests must prove they come
// from our own scripts: a plain HTML form or a cross-site request cannot set
// a custom header. apiCall in @devmentor/ui always sends it.
export const CSRF_HEADER = "X-Requested-With";
export const CSRF_HEADER_VALUE = "devmentor";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertCsrfHeader(request: Request): void {
  if (SAFE_METHODS.has(request.method)) {
    return;
  }
  if (request.headers.get(CSRF_HEADER) !== CSRF_HEADER_VALUE) {
    throw new ForbiddenError("Żądanie odrzucone: brak nagłówka ochrony CSRF.");
  }
}
