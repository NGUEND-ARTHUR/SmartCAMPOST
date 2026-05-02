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

test("landing page renders and navigates to auth pages", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Smart Postal Services for Cameroon" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Register" })).toBeVisible();

  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);

  await page.goto("/");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page).toHaveURL(/\/auth\/register$/);
});

test("landing tracking search keeps the query in the URL", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("Tracking Number").fill("SCP123456");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/tracking\?ref=SCP123456$/);
});

test("landing page loads without runtime errors", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("/");

  expect(pageErrors).toHaveLength(0);
});
