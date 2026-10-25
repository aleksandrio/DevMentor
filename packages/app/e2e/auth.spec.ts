import { expect, test } from "@playwright/test";
import {
  CSRF_HEADERS,
  databaseConfigured,
  loginThroughUi,
  promoteToAdmin,
  registerThroughApi,
  registerThroughUi,
  uniqueEmail,
} from "./support";

test.describe("auth forms without a server round-trip", () => {
  test("login shows Polish field errors for an empty form", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page.getByText("Podaj poprawny adres e-mail.")).toBeVisible();
    await expect(page.getByText("Podaj hasło.")).toBeVisible();
  });

  test("Ctrl+Enter submits the form", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("E-mail").press("Control+Enter");
    await expect(page.getByText("Podaj imię lub nazwę (min. 2 znaki).")).toBeVisible();
  });

  test("the home page links to login and registration", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Załóż konto" }).click();
    await expect(page).toHaveURL("/register");
    await page.getByRole("link", { name: "Zaloguj się" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("state-changing API calls need the CSRF header", async ({ request }) => {
    const response = await request.post("/api/auth/login", { data: { email: "a@b.pl", password: "x" } });
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "forbidden" } });
  });
});

test.describe("auth with a database", () => {
  test.skip(!databaseConfigured, "needs DATABASE_URL and a migrated database");

  test("registration signs the user in with an HttpOnly session cookie", async ({ page, context }) => {
    await registerThroughUi(page, uniqueEmail("register"));
    const cookie = (await context.cookies()).find(({ name }) => name === "devmentor_session");
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });
  });

  test("a duplicate e-mail is rejected without details", async ({ request }) => {
    const email = uniqueEmail("duplicate");
    await registerThroughApi(request, email);
    const response = await request.post("/api/auth/register", {
      headers: CSRF_HEADERS,
      data: { email, password: "password123", displayName: "Again" },
    });
    expect(response.status()).toBe(409);
  });

  test("wrong password and unknown e-mail get the same message", async ({ page, request }) => {
    const email = uniqueEmail("login");
    await registerThroughApi(request, email);
    await page.goto("/login");
    await loginThroughUi(page, email, "wrong-password");
    await expect(page.getByText("Nieprawidłowe dane logowania.")).toBeVisible();
    await loginThroughUi(page, uniqueEmail("unknown"), "wrong-password");
    await expect(page.getByText("Nieprawidłowe dane logowania.")).toBeVisible();
  });

  test("the sixth failed login in a window is rate limited", async ({ request }) => {
    const email = uniqueEmail("limited");
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await request.post("/api/auth/login", {
        headers: CSRF_HEADERS,
        data: { email, password: "wrong-password" },
      });
      statuses.push(response.status());
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
  });

  test("/admin/users: login redirect, 403 for students, user list for admins", async ({ page, request }) => {
    const email = uniqueEmail("admin");
    await registerThroughApi(request, email);

    await page.goto("/admin/users");
    await expect(page).toHaveURL("/login?next=/admin/users");
    await loginThroughUi(page, email);
    await expect(page).toHaveURL("/admin/users");
    await expect(page.getByText("Brak uprawnień")).toBeVisible();
    expect((await page.request.get("/api/users")).status()).toBe(403);

    promoteToAdmin(email);
    // The role is part of the session token: log in again to pick it up.
    await page.getByRole("button", { name: "Wyloguj" }).click();
    await expect(page).toHaveURL("/login");
    await page.goto("/login?next=/admin/users");
    await loginThroughUi(page, email);
    await expect(page).toHaveURL("/admin/users");

    const table = page.locator('[data-slot="data-table"]');
    await expect(table.getByRole("cell", { name: email })).toBeVisible();
    await expect(table.getByRole("row").filter({ hasText: email }).getByText("administrator")).toBeVisible();
  });
});

test("/api/users answers 401 without a session", async ({ request }) => {
  const response = await request.get("/api/users");
  expect(response.status()).toBe(401);
});
