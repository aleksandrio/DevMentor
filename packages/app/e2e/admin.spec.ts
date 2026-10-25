import { expect, test } from "@playwright/test";

const databaseConfigured = !!process.env.DATABASE_URL?.trim();

test.describe("admin panel", () => {
  test("renders the shadcn/ui card with styles", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveTitle("Panel administracyjny · DevMentor");
    const card = page.locator('[data-slot="card"]');
    await expect(card).toBeVisible();
    await expect(
      card.locator('[data-slot="card-title"]', {
        hasText: "Panel administracyjny",
      }),
    ).toBeVisible();
    // shadcn/ui tokens resolved: the card is rounded and the primary button
    // is filled with the --primary token. Compare computed values instead of a
    // literal colour: Chromium reports Tailwind 4 colours in lab() space.
    await expect(card).not.toHaveCSS("border-radius", "0px");
    const primary = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--primary)";
      document.body.append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    expect(primary).not.toBe("rgba(0, 0, 0, 0)");
    await expect(
      page.getByRole("link", { name: "Przejdź do strony głównej" }),
    ).toHaveCSS("background-color", primary);
  });

  test(`streams the database status (${databaseConfigured ? "up" : "not configured"})`, async ({
    page,
  }) => {
    await page.goto("/admin");

    const badge = page.locator('[data-slot="card-content"] [data-slot="badge"]');
    if (databaseConfigured) {
      await expect(badge).toHaveText(/^działa · \d+ ms$/);
    } else {
      await expect(badge).toHaveText("nieskonfigurowana (brak DATABASE_URL)");
    }
  });

  test("the button link navigates to the home page", async ({ page }) => {
    await page.goto("/admin");

    await page.getByRole("link", { name: "Przejdź do strony głównej" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("header links work", async ({ page }) => {
    await page.goto("/");
    await page.goto("/admin");
    await page.getByRole("link", { name: "Strona główna" }).click();
    await expect(page).toHaveURL("/");
  });
});
