import { test, expect } from "@playwright/test";

// Minimal smoke E2E tests with network interception to avoid requiring real backend credentials.

test.beforeEach(async ({ page }) => {
  // Intercept auth login and respond with a fake token + user
  await page.route("**/api/auth/login", (route) => {
    const req = route.request();
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: "1",
        fullName: "E2E Tester",
        phone: "+237600000000",
        role: "CLIENT",
        accessToken: "fake-jwt-token",
      }),
    });
  });

  // Intercept other common endpoints to return simple success
  await page.route("**/api/auth/login/otp/request", (route) =>
    route.fulfill({ status: 200 }),
  );
  await page.route("**/api/auth/login/otp/confirm", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: "1",
        fullName: "E2E Tester",
        accessToken: "fake-jwt-token",
        role: "CLIENT",
      }),
    }),
  );
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({ status: 201 }),
  );
  await page.route("**/api/parcels**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 0,
        number: 0,
        first: true,
        last: true,
      }),
    }),
  );
});

test("app root loads and navigates to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/SmartCAMPOST|Smart/gi);
  // navigate to login page
  await page.goto("/auth/login");
  // Check for login form elements instead of text (language-agnostic)
  await expect(page.locator("input[id=phoneOrEmail]")).toBeVisible({
    timeout: 5000,
  });
  await expect(page.locator("input[id=password]")).toBeVisible();
  await expect(page.locator("button[type=submit]")).toBeVisible();
});

test("login flow (mocked) redirects to dashboard", async ({ page }) => {
  await page.goto("/auth/login");
  // fill phone/email and password
  await page.fill("input[id=phoneOrEmail]", "+237600000000");
  await page.fill("input[id=password]", "password123");
  await page.click("button[type=submit]");
  // after successful mocked login, the app should attempt to redirect — assert that token stored
  await page.waitForTimeout(500); // slight wait for client-side redirect
  const stored = await page.evaluate(() =>
    localStorage.getItem("auth-storage"),
  );
  expect(stored).not.toBeNull();
});

test("open register page and submit (mocked)", async ({ page }) => {
  await page.goto("/auth/register");
  await page.fill("input[id=fullName]", "E2E Test");
  await page.fill("input[id=phone]", "+237600000001");
  await page.fill("input[id=password]", "password123");
  await page.click("button[type=submit]");
  // Check that form is still visible (registration form should still be shown after mock)
  await expect(page.locator("input[id=fullName]")).toBeVisible();
});
