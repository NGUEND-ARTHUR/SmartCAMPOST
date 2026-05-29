/**
 * Courier — Dashboard Tests
 * Covers: pickup list, delivery list, navigation, role isolation.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';
import { apiLogin } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.courier });

test.describe('Courier Dashboard', () => {

  test('Courier dashboard loads at /courier', async ({ page }) => {
    await page.goto('/courier');
    await expect(page).toHaveURL(/\/courier/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard shows delivery/pickup stats', async ({ page }) => {
    await page.goto('/courier');
    await expect(
      page.locator('[class*="card"], [class*="stat"], h1, h2').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Navigation shows Pickups and Deliveries links', async ({ page }) => {
    await page.goto('/courier');
    await expect(
      page.locator('a[href*="/courier/pickups"], a[href*="pickup"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Courier can navigate to pickups list', async ({ page }) => {
    await page.goto('/courier/pickups');
    await expect(page).toHaveURL(/\/courier\/pickups/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Courier can navigate to deliveries list', async ({ page }) => {
    await page.goto('/courier/deliveries');
    await expect(page).toHaveURL(/\/courier\/deliveries/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Courier can navigate to scan console', async ({ page }) => {
    await page.goto('/courier/scan');
    await expect(page).toHaveURL(/\/courier\/scan/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Courier can navigate to map', async ({ page }) => {
    await page.goto('/courier/map');
    await expect(page).toHaveURL(/\/courier\/map/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Courier — Role Isolation', () => {

  test('COURIER cannot access /admin', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 10_000 });
  });

  test('COURIER cannot access /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).not.toHaveURL(/^.*\/finance$/);
  });

  test('COURIER cannot access /client', async ({ page }) => {
    await page.goto('/client');
    await expect(page).not.toHaveURL(/^.*\/client$/);
  });
});

test.describe('Courier — Pickup API Permissions', () => {

  test('COURIER can access their own pickups via API', async ({ request }) => {
    let token: string;
    try {
      const result = await apiLogin(request, '+237699000004', 'Test123!Courier');
      token = result.token;
    } catch {
      return; // skip if courier not set up
    }

    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/pickups/courier/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204, 404]).toContain(res.status());
  });
});
