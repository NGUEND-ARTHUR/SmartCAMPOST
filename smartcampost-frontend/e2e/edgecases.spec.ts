import { test, expect } from "@playwright/test";

const baseURL = "https://smartcampost-frontend.vercel.app";

// Edge case tests

test("Invalid input: empty forms", async ({ page }) => {
  await page.goto(`${baseURL}/auth/register`);
  await page.click('button[type="submit"]');
  await expect(page.locator("text=required")).toBeVisible();
});

test("Invalid input: large data", async ({ page }) => {
  await page.goto(`${baseURL}/parcels/create`);
  await page.fill('input[name="parcelName"]', "A".repeat(1000));
  await page.click('button[type="submit"]');
  await expect(page.locator("text=too long")).toBeVisible();
});

test("Unauthorized API access", async ({ request }) => {
  const res = await request.get(
    "https://smartcampost-backend.onrender.com/api/admin/users",
  );
  expect(res.status()).toBe(401);
});

test("Expired session", async ({ page }) => {
  await page.goto(`${baseURL}/auth/login`);
  // Simulate login, then expire session (mock or manipulate cookie)
  // ...
  await page.goto(`${baseURL}/dashboard`);
  await expect(page.locator("text=Login")).toBeVisible();
});