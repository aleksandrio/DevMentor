import { expect, test } from "@playwright/test";
import { databaseConfigured } from "./support";

test("/api/health reports the database in the JSON envelope", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  if (databaseConfigured) {
    expect(body).toMatchObject({ ok: true, data: { database: { state: "up" } } });
  } else {
    expect(body).toEqual({ ok: true, data: { database: { state: "not-configured" } } });
  }
});
