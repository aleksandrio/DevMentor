import { asValue } from "awilix";
import { getContainer } from "./container";
import type { Cradle } from "./cradle";

/**
 * Runs `fn` with a fresh DI scope: its own forked EntityManager and its own
 * scoped services. Call it at the edge of a request or job and pass the
 * resolved services down; never resolve from the container deeper in the code.
 */
export async function withScope<T>(fn: (cradle: Cradle) => Promise<T>): Promise<T> {
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
