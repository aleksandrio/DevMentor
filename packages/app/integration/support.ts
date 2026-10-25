import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { testBaseUrl, testDatabaseUrl } from "../../../test/integration/context";

const execFileAsync = promisify(execFile);

export const CSRF_HEADERS = { "X-Requested-With": "devmentor" };

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}@example.com`;
}

export function appUrl(pathname: string): string {
  return new URL(pathname, testBaseUrl()).href;
}

export async function registerThroughApi(email: string, password = "password123"): Promise<void> {
  const response = await fetch(appUrl("/api/auth/register"), {
    method: "POST",
    headers: { ...CSRF_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName: "Test User" }),
  });
  if (response.status !== 201) {
    throw new Error(`registration failed with ${response.status}: ${await response.text()}`);
  }
}

/** Grants admin with the same CLI an operator uses (`npm run db:user:promote`). */
export async function promoteToAdmin(email: string): Promise<void> {
  await execFileAsync("npm", ["run", "db:user:promote", "--", "--email", email], {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
  });
}
