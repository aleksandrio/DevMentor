/**
 * Pins the class name MikroORM falls back to when looking up metadata.
 *
 * Next.js bundles @devmentor/db separately for pages and for route handlers,
 * so each gets its own copy of every entity class, while the ORM (a process
 * singleton) knows only the copy that initialized it. MikroORM then matches
 * by class name, which the production minifier mangles (`User` → `u`).
 * Call this on every entity class, with the `name` given to defineEntity.
 */
export function pinEntityName<Entity extends abstract new (...args: never[]) => unknown>(
  entity: Entity,
  name: string,
): void {
  Object.defineProperty(entity, "name", { value: name });
}
