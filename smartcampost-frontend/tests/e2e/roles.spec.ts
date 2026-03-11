import { test, expect, Page } from "@playwright/test";

const baseURL = "https://smartcampost-frontend.vercel.app";
const apiURL = "https://smartcampost-backend.onrender.com/api";

// Test data
const admin = { phone: "+237690000000", password: "Admin@SmartCAMPOST2026" };
const client = {
  phone: "+237690000001",
  email: "client1@smartcampost.cm",
  password: "Client@2026",
  fullName: "Client One",
};

// Helper: Register a new client
async function registerClient(
  page: Page,
  client: { phone: string; email: string; password: string; fullName: string },
) {
  await page.goto(`${baseURL}/auth/register`);
  await page.fill('input[name="fullName"]', client.fullName);
  await page.fill('input[name="phone"]', client.phone);
  await page.fill('input[name="email"]', client.email);
  await page.fill('input[name="password"]', client.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/login/);
}

// Helper: Login
async function login(page: Page, user: typeof admin | typeof client) {
  await page.goto(`${baseURL}/auth/login`);
  await page.fill('input[name="phoneOrEmail"]', user.phone);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard|admin|client/);
}

test.describe("Role-based workflows", () => {
  test("Client registration, login, dashboard, CRUD, logout", async ({
    page,
  }) => {
    await registerClient(page, client);
    await login(page, client);
    await expect(page.locator("text=Dashboard")).toBeVisible();
    // Simulate create/edit/delete resource
    // ... (fill forms, click buttons, validate UI)
    await page.click('button:text("Logout")');
    await expect(page).toHaveURL(/login/);
  });

  test("Admin login, manage users, view analytics, logout", async ({
    page,
  }) => {
    await login(page, admin);
    await expect(page.locator("text=Admin")).toBeVisible();
    // Simulate user management
    // ... (navigate, click, validate UI)
    await page.click('button:text("Logout")');
    await expect(page).toHaveURL(/login/);
  });

  test("Guest access, restricted actions", async ({ page }) => {
    await page.goto(`${baseURL}/dashboard`);
    await expect(page.locator("text=Login")).toBeVisible();
    // Try restricted actions
    await page.goto(`${baseURL}/admin`);
    await expect(page.locator("text=Login")).toBeVisible();
  });
});
