import playwright, { type Page } from "../../../node_modules/@playwright/test/index.js";

const { expect, test } = playwright;

async function useEnglishLocale(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "en");
  });
}

test.beforeEach(async ({ page }) => {
  await useEnglishLocale(page);
});

test("client route redirects anonymous visitors to login", async ({ page }) => {
  await page.goto("/client");

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
});

test("admin route redirects anonymous visitors to login", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
});

test("legacy protected routes also redirect to login", async ({ page }) => {
  await page.goto("/courier/deliveries/123");

  await expect(page).toHaveURL(/\/auth\/login$/);
});
