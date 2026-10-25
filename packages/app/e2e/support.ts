import { execFileSync } from "node:child_process";
import path from "node:path";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const databaseConfigured = !!process.env.DATABASE_URL?.trim();

export const CSRF_HEADERS = { "X-Requested-With": "devmentor" };

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function registerThroughUi(page: Page, email: string, password = "password123") {
  await page.goto("/register");
  await page.getByLabel("Imię lub nazwa").fill("Test User");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło").fill(password);
  await page.getByRole("button", { name: "Załóż konto" }).click();
  await expect(page).toHaveURL("/");
}

export async function loginThroughUi(page: Page, email: string, password = "password123") {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Hasło").fill(password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
}

export async function registerThroughApi(request: APIRequestContext, email: string) {
  const response = await request.post("/api/auth/register", {
    headers: CSRF_HEADERS,
    data: { email, password: "password123", displayName: "Test User" },
  });
  expect(response.status()).toBe(201);
}

/** Grants admin with the same CLI an operator uses (`npm run db:user:promote`). */
export function promoteToAdmin(email: string) {
  execFileSync("node", ["--import", "tsx", "src/scripts/promote-user.ts", "--email", email], {
    cwd: path.join(__dirname, "../../db"),
    stdio: "pipe",
  });
}
