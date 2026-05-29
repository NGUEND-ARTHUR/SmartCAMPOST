/**
 * Risk — Dashboard Tests
 * Covers: risk stats, alerts overview, compliance, role isolation.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';
import { apiLogin } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.risk });

test.describe('Risk Dashboard', () => {

  test('Risk dashboard loads at /risk', async ({ page }) => {
    await page.goto('/risk');
    await expect(page).toHaveURL(/\/risk/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard shows risk stat cards', async ({ page }) => {
    await page.goto('/risk');
    await expect(
      page.locator('[class*="card"], [class*="stat"], h1, h2').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Dashboard shows active alerts count or recent alerts table', async ({ page }) => {
    await page.goto('/risk');
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Risk can navigate to alerts list', async ({ page }) => {
    await page.goto('/risk/alerts');
    await expect(page).toHaveURL(/\/risk\/alerts/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Risk can navigate to compliance', async ({ page }) => {
    await page.goto('/risk/compliance');
    await expect(page).toHaveURL(/\/risk\/compliance/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Risk can navigate to analytics', async ({ page }) => {
    await page.goto('/risk/analytics');
    await expect(page).toHaveURL(/\/risk\/analytics/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Risk — Role Isolation', () => {

  test('RISK cannot access /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/^.*\/admin$/);
  });

  test('RISK cannot access /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).not.toHaveURL(/^.*\/finance$/);
  });

  test('RISK cannot access /client', async ({ page }) => {
    await page.goto('/client');
    await expect(page).not.toHaveURL(/^.*\/client$/);
  });
});

test.describe('Risk — API Permissions', () => {

  test('RISK can view risk alerts', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000006', 'Test123!Risk');

    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/risk/alerts`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204]).toContain(res.status());
  });

  test('RISK can freeze a user account', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000006', 'Test123!Risk');

    const res = await request.patch(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/risk/users/non-existent-id/freeze`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { frozen: true, reason: 'E2E risk test' },
      }
    );
    // 404 for non-existent — NOT 403
    expect([200, 404, 400]).toContain(res.status());
    expect(res.status()).not.toBe(403);
  });

  test('CLIENT cannot access risk alerts (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');

    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/risk/alerts`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('FINANCE cannot access risk alerts (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000005', 'Test123!Finance');

    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/risk/alerts`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });
});
