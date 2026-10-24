import "server-only";
import { asValue } from "awilix";
import { connection } from "next/server";
import { getContainer, type Cradle } from "./container";

/**
 * Runs `fn` with a fresh DI scope for the current request: its own forked
 * EntityManager and its own scoped services. Use it at the edge of a request
 * (Server Component, Server Action, Route Handler) and pass the resolved
 * services down; never resolve from the container deeper in the code.
 */
export async function withRequestScope<T>(
  fn: (cradle: Cradle) => Promise<T>,
): Promise<T> {
  // Never touch the database while prerendering; wait for a real request.
  await connection();

  const container = await getContainer();
  const scope = container.createScope();
  const { orm } = container.cradle;
  if (orm) {
    scope.register({ em: asValue(orm.em.fork()) });
  }
  try {
    return await fn(scope.cradle);
  } finally {
    await scope.dispose();
  }
}
