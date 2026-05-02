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

test("empty tracking submission keeps the user on the landing page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/\/$/);
});

test("unknown routes redirect back to the landing page", async ({ page }) => {
  await page.goto("/does-not-exist");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Smart Postal Services for Cameroon" }),
  ).toBeVisible();
});
