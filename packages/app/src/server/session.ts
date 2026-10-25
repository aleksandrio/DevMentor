import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type Session } from "@devmentor/core";
import { withRequestScope } from "./request-scope";

/** The verified session of the current request, for Server Components; `null` when logged out. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return withRequestScope(({ config }) => verifySessionToken(token, config.authSecret));
}
