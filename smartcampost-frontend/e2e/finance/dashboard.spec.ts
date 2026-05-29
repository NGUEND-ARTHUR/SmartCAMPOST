/**
 * Finance — Dashboard Tests
 * Covers: finance stats, payment list, refunds, analytics.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';
import { apiLogin } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.finance });

test.describe('Finance Dashboard', () => {

  test('Finance dashboard loads at /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).toHaveURL(/\/finance/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard shows financial stat cards', async ({ page }) => {
    await page.goto('/finance');
    await expect(
      page.locator('[class*="card"], [class*="stat"], h1, h2').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Finance can navigate to payments list', async ({ page }) => {
    await page.goto('/finance/payments');
    await expect(page).toHaveURL(/\/finance\/payments/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Finance can navigate to refunds page', async ({ page }) => {
    await page.goto('/finance/refunds');
    await expect(page).toHaveURL(/\/finance\/refunds/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Finance can navigate to analytics', async ({ page }) => {
    await page.goto('/finance/analytics');
    await expect(page).toHaveURL(/\/finance\/analytics/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Finance can navigate to map', async ({ page }) => {
    await page.goto('/finance/map');
    await expect(page).toHaveURL(/\/finance\/map/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Finance — Role Isolation', () => {

  test('FINANCE cannot access /admin', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 10_000 });
  });

  test('FINANCE cannot access /risk', async ({ page }) => {
    await page.goto('/risk');
    await expect(page).not.toHaveURL(/^.*\/risk$/);
  });

  test('FINANCE cannot access /client', async ({ page }) => {
    await page.goto('/client');
    await expect(page).not.toHaveURL(/^.*\/client$/);
  });

  test('FINANCE cannot manage parcels', async ({ page }) => {
    await page.goto('/admin/parcels');
    // Should redirect away from admin parcels
    await expect(page).not.toHaveURL(/\/admin\/parcels/);
  });
});

test.describe('Finance — API Permissions', () => {

  test('FINANCE can access finance stats', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000005', 'Test123!Finance');

    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/finance/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204]).toContain(res.status());
  });

  test('FINANCE can access refunds list', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000005', 'Test123!Finance');

    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/finance/refunds`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204]).toContain(res.status());
  });

  test('FINANCE cannot create staff (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000005', 'Test123!Finance');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/staff`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          fullName: 'Unauthorized',
          phone:    '+237699888002',
          password: 'Test123!Unauth',
          role:     'STAFF',
        },
      }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('CLIENT cannot access finance stats (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');

    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/finance/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });
});
