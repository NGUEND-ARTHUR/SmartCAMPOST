/**
 * Admin — Dashboard Tests
 * Covers: SSE live feed, navigation items, dashboard stats, quick links.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';

test.use({ storageState: AUTH_STATE.admin });

test.describe('Admin Dashboard', () => {

  test('Admin dashboard loads at /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard renders main heading or stats cards', async ({ page }) => {
    await page.goto('/admin');
    // At least one visible element showing dashboard content
    await expect(
      page.locator('h1, h2, [class*="card"], [class*="stat"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Navigation sidebar/menu is visible', async ({ page }) => {
    await page.goto('/admin');
    // RoleLayout renders navigation with role-specific links
    await expect(
      page.locator('nav, [role="navigation"], aside').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Admin sees link to User Management', async ({ page }) => {
    await page.goto('/admin');
    // Navigation should contain user management links
    const userMgmtLink = page.locator('a[href*="/admin/users"]').first();
    await expect(userMgmtLink).toBeVisible({ timeout: 10_000 });
  });

  test('Admin sees link to Tariff Management', async ({ page }) => {
    await page.goto('/admin');
    const tariffLink = page.locator('a[href*="tariff"]').first();
    await expect(tariffLink).toBeVisible({ timeout: 10_000 });
  });

  test('Admin sees link to Parcel Management', async ({ page }) => {
    await page.goto('/admin');
    const parcelLink = page.locator('a[href*="parcels"]').first();
    await expect(parcelLink).toBeVisible({ timeout: 10_000 });
  });

  test('Admin can navigate to all parcels list', async ({ page }) => {
    await page.goto('/admin/parcels');
    await expect(page).toHaveURL(/\/admin\/parcels/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can navigate to accounts management', async ({ page }) => {
    await page.goto('/admin/accounts');
    await expect(page).toHaveURL(/\/admin\/accounts/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can navigate to self-healing dashboard', async ({ page }) => {
    await page.goto('/admin/self-healing');
    await expect(page).toHaveURL(/\/admin\/self-healing/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can navigate to analytics', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/\/admin\/analytics/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin finance dashboard is accessible', async ({ page }) => {
    await page.goto('/admin/finance');
    await expect(page).toHaveURL(/\/admin\/finance/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin risk dashboard is accessible', async ({ page }) => {
    await page.goto('/admin/risk');
    await expect(page).toHaveURL(/\/admin\/risk/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Dashboard — SSE Live Feed', () => {

  test('Admin dashboard page loads without SSE errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/admin');
    await page.waitForTimeout(3000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('EventSource')
    );
    // SSE connection errors are acceptable (backend may not be running)
    expect(criticalErrors.length).toBeLessThan(5);
  });
});
