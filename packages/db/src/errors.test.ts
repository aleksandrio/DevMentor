import { UniqueConstraintViolationException } from "@mikro-orm/postgresql";
import { describe, expect, it } from "vitest";
import { isUniqueConstraintViolation } from "./errors";

describe("isUniqueConstraintViolation", () => {
  it("recognizes only MikroORM's unique-constraint exception", () => {
    expect(isUniqueConstraintViolation(new UniqueConstraintViolationException(new Error("duplicate key")))).toBe(true);
    expect(isUniqueConstraintViolation(new Error("duplicate key"))).toBe(false);
    expect(isUniqueConstraintViolation(null)).toBe(false);
  });
});
