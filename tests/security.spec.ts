import { test, expect } from '@playwright/test';

test.describe('Basic Security Tests', () => {
  const ADMIN_PHONE = '+237690000000';
  const ADMIN_PASSWORD = 'Admin@SmartCAMPOST2026';
  const CLIENT_PHONE = '+237655189919';
  const CLIENT_PASSWORD = 'Arthur@237';
  const BASE_URL = 'https://smartcampost-frontend.vercel.app/';

  test('1. CLIENT cannot access ADMIN routes', async ({ page }) => {
    // Login as client
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="phone"]').fill(CLIENT_PHONE);
    await page.locator('input[name="password"]').fill(CLIENT_PASSWORD);
    await page.locator('button:has-text("Se connecter")').click();
    await page.waitForURL('**/client');

    // Attempt to navigate to an admin route
    await page.goto(BASE_URL + 'admin');
    await page.waitForLoadState('networkidle');

    // Verify redirection away from admin route (e.g., back to client dashboard or login)
    // This might be a redirect to /client or /auth/login depending on implementation
    await expect(page).not.toHaveURL(/admin/);
    await page.screenshot({ path: 'screenshots/security-client-admin-access.png' });
  });

  test('2. Unauthenticated user redirected to login', async ({ page }) => {
    // Attempt to navigate to a protected route without logging in
    await page.goto(BASE_URL + 'client');
    await page.waitForLoadState('networkidle');

    // Verify redirection to login page
    await page.waitForURL('**/auth/login');
    await expect(page).toHaveURL(/auth\/login/);
    await page.screenshot({ path: 'screenshots/security-unauthenticated-redirect.png' });
  });

  test('3. Login with bad credentials (should show error)', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Attempt to login with incorrect credentials
    await page.locator('input[name="phone"]').fill('+237111111111'); // Non-existent phone
    await page.locator('input[name="password"]').fill('wrongpassword');
    await page.locator('button:has-text("Se connecter")').click();

    // Verify error message is displayed
    await expect(page.locator('text=Invalid credentials'), 'Expected error message for invalid login').toBeVisible();
    await page.screenshot({ path: 'screenshots/security-bad-credentials.png' });
  });
});
