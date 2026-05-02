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

test("login request is posted with the expected payload", async ({ page }) => {
  let requestBody: { phone?: string; password?: string } | undefined;

  await page.route("**/api/auth/login", async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        role: "CLIENT",
        userId: "42",
        phone: "+237690000000",
        fullName: "Client One",
        accessToken: "token-123",
      }),
    });
  });

  await page.goto("/auth/login");
  await page.locator("#phoneOrEmail").fill("+237690000000");
  await page.locator("#password").fill("Client@2026");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/client$/);
  expect(requestBody).toEqual({
    phone: "+237690000000",
    password: "Client@2026",
  });
});
