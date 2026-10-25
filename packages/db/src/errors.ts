import { UniqueConstraintViolationException } from "@mikro-orm/postgresql";

/** Lets services map a unique-constraint race to a domain error without importing MikroORM. */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof UniqueConstraintViolationException;
}
