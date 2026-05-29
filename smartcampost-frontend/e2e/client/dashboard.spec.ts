/**
 * Client — Dashboard Tests
 * Covers: dashboard stats, navigation, parcel list, tracking link.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';

test.use({ storageState: AUTH_STATE.client });

test.describe('Client Dashboard', () => {

  test('Client dashboard loads at /client', async ({ page }) => {
    await page.goto('/client');
    await expect(page).toHaveURL(/\/client/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard renders stat cards', async ({ page }) => {
    await page.goto('/client');
    // Stats: In Transit, Delivered, Pending, Total
    await expect(
      page.locator('[class*="card"], [class*="stat"], [class*="Card"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Navigation shows client-specific links', async ({ page }) => {
    await page.goto('/client');
    await expect(
      page.locator('a[href*="/client/parcels"], a[href*="parcel"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Create parcel link is accessible from dashboard', async ({ page }) => {
    await page.goto('/client');
    const createLink = page.locator(
      'a[href*="/client/parcels/create"], button:has-text("Create"), a:has-text("Create")'
    ).first();
    await expect(createLink).toBeVisible({ timeout: 10_000 });
  });

  test('Client can navigate to parcel list', async ({ page }) => {
    await page.goto('/client/parcels');
    await expect(page).toHaveURL(/\/client\/parcels/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Client can navigate to payments page', async ({ page }) => {
    await page.goto('/client/payments');
    await expect(page).toHaveURL(/\/client\/payments/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Client can navigate to pickups page', async ({ page }) => {
    await page.goto('/client/pickups');
    await expect(page).toHaveURL(/\/client\/pickups/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Client can navigate to tracking page', async ({ page }) => {
    await page.goto('/client/tracking');
    await expect(page).toHaveURL(/\/client\/tracking/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Client can navigate to notifications', async ({ page }) => {
    await page.goto('/client/notifications');
    await expect(page).toHaveURL(/\/client\/notifications/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Client — Role Isolation', () => {

  test('CLIENT cannot access /admin (redirected)', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to / or show unauthorized
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test('CLIENT cannot access /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).not.toHaveURL(/^.*\/finance/);
  });

  test('CLIENT cannot access /risk', async ({ page }) => {
    await page.goto('/risk');
    await expect(page).not.toHaveURL(/^.*\/risk/);
  });

  test('CLIENT cannot access /staff', async ({ page }) => {
    await page.goto('/staff');
    await expect(page).not.toHaveURL(/^.*\/staff/);
  });
});
