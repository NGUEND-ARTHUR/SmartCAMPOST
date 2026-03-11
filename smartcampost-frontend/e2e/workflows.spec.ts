import { test, expect } from "@playwright/test";

const baseURL = "https://smartcampost-frontend.vercel.app";

// Simulate full user workflow

test("User workflow: register, login, dashboard, create/edit/delete, logout", async ({
  page,
}) => {
  // Register
  await page.goto(`${baseURL}/auth/register`);
  await page.fill('input[name="fullName"]', "Workflow User");
  await page.fill('input[name="phone"]', "+237690000002");
  await page.fill('input[name="email"]', "workflow@smartcampost.cm");
  await page.fill('input[name="password"]', "Workflow@2026");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/login/);

  // Login
  await page.goto(`${baseURL}/auth/login`);
  await page.fill('input[name="phoneOrEmail"]', "+237690000002");
  await page.fill('input[name="password"]', "Workflow@2026");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Dashboard")).toBeVisible();

  // Create resource (example: parcel)
  await page.goto(`${baseURL}/parcels/create`);
  await page.fill('input[name="parcelName"]', "Test Parcel");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Parcel created")).toBeVisible();

  // Edit resource
  await page.goto(`${baseURL}/parcels`);
  await page.click('button:text("Edit")');
  await page.fill('input[name="parcelName"]', "Updated Parcel");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Parcel updated")).toBeVisible();

  // Delete resource
  await page.click('button:text("Delete")');
  await expect(page.locator("text=Parcel deleted")).toBeVisible();

  // Logout
  await page.click('button:text("Logout")');
  await expect(page).toHaveURL(/login/);
});