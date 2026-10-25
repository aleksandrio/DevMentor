import { expect, test } from "@playwright/test";

test("home page renders with its styles", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Create Next App");
  await expect(
    page.getByRole("heading", { level: 1, name: /To get started, edit the/ }),
  ).toBeVisible();
  await expect(page.getByAltText("Next.js logo")).toBeVisible();

  // Tailwind utilities from the shared @devmentor/ui stylesheet are applied.
  const deploy = page.getByRole("link", { name: "Deploy Now" });
  await expect(deploy).toBeVisible();
  await expect(deploy).not.toHaveCSS("border-radius", "0px");
  await expect(deploy).toHaveCSS("display", "flex");
});
