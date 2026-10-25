import { describe, expect, it } from "vitest";
import { createOrmOptions } from "./config";
import { entities } from "./entities";

describe("createOrmOptions", () => {
  it("connects through the URL with the registered entities and a bounded pool", () => {
    const options = createOrmOptions({ databaseUrl: "postgres://a:b@db:5432/devmentor" });
    expect(options).toMatchObject({
      clientUrl: "postgres://a:b@db:5432/devmentor",
      entities,
      pool: { min: 0, max: 10, idleTimeoutMillis: 30_000 },
    });
  });
});
