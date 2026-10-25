import { describe, expect, it } from "vitest";
import { z } from "zod";
import { loginSchema } from "./login.schema";
import { registerSchema } from "./register.schema";

describe("auth schemas", () => {
  it("normalizes the e-mail and drops unknown fields", () => {
    const parsed = registerSchema.parse({
      email: "  Ala@Example.COM ",
      displayName: " Ala ",
      password: "password123",
      role: "admin",
    });
    expect(parsed).toEqual({ email: "ala@example.com", displayName: "Ala", password: "password123" });
  });

  it("reports every missing field in Polish", () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(z.flattenError(result.error!).fieldErrors).toEqual({
      email: ["Podaj adres e-mail."],
      displayName: ["Podaj imię lub nazwę."],
      password: ["Podaj hasło."],
    });
    expect(loginSchema.safeParse({}).error?.issues.map((issue) => issue.message)).toEqual([
      "Podaj adres e-mail.",
      "Podaj hasło.",
    ]);
  });

  it("rejects passwords bcrypt would truncate", () => {
    const result = registerSchema.safeParse({ email: "a@b.pl", displayName: "Ala", password: "ą".repeat(37) });
    expect(z.flattenError(result.error!).fieldErrors.password).toEqual(["Hasło może mieć najwyżej 72 bajty."]);
  });
});
