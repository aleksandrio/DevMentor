import "server-only";
import { connection } from "next/server";
import { withScope, type Cradle } from "@devmentor/core";

/**
 * Runs `fn` in a fresh DI scope for the current request (see `withScope` in
 * @devmentor/core). Use it in Server Components and Server Actions of routes
 * that export `dynamic = "force-dynamic"`.
 */
export async function withRequestScope<T>(
  fn: (cradle: Cradle) => Promise<T>,
): Promise<T> {
  // Second line of defence next to force-dynamic: never touch the database
  // while prerendering, even if a route forgets the segment config.
  await connection();
  return withScope(fn);
}
