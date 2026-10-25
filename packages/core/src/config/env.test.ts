import { describe, expect, it } from "vitest";
import { readAppConfig } from "./env";

const secret = "a-secret-that-is-at-least-32-bytes-long";

describe("readAppConfig", () => {
  it("applies defaults for an empty environment", () => {
    expect(readAppConfig({})).toEqual({
      isProduction: false,
      databaseUrl: null,
      logLevel: "info",
      authSecret: null,
    });
  });

  it("reads and normalizes every variable", () => {
    const config = readAppConfig({
      NODE_ENV: "production",
      DATABASE_URL: "  postgres://db/devmentor  ",
      LOG_LEVEL: "warn",
      AUTH_SECRET: ` ${secret} `,
    });
    expect(config).toMatchObject({ isProduction: true, databaseUrl: "postgres://db/devmentor", logLevel: "warn" });
    expect(new TextDecoder().decode(config.authSecret!)).toBe(secret);
  });

  it("treats blank optional variables as unset", () => {
    expect(readAppConfig({ DATABASE_URL: "  ", AUTH_SECRET: "" })).toMatchObject({ databaseUrl: null, authSecret: null });
  });

  it("rejects a short secret, a missing secret in production and unknown values", () => {
    expect(() => readAppConfig({ AUTH_SECRET: "short" })).toThrow("AUTH_SECRET must be at least 32 bytes long.");
    expect(() => readAppConfig({ NODE_ENV: "production" })).toThrow("AUTH_SECRET is required in production.");
    expect(() => readAppConfig({ LOG_LEVEL: "loud" })).toThrow("Invalid environment configuration");
  });
});
