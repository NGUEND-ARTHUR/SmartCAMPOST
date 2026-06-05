import { test, expect, type Page } from "@playwright/test";

async function useEnglishLocale(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "en");
  });
}

test.beforeEach(async ({ page }) => {
  await useEnglishLocale(page);
});

test("login form shows required-field validation", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Required")).toHaveCount(2);
});

test("register form shows required-field validation and OTP action", async ({
  page,
}) => {
  await page.goto("/auth/register");

  await expect(page.getByRole("button", { name: "Send OTP" })).toBeVisible();
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByText("Required")).toHaveCount(3);
});
