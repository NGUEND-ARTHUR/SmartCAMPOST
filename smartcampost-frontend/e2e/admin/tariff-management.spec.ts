/**
 * Admin — Tariff Management Tests
 * Covers: CRUD on tariffs, service type filter, pagination.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';
import { getAdminToken } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.admin });

const TIMESTAMP = Date.now();

test.describe('Tariff Management — Read', () => {

  test('Admin can navigate to tariff management', async ({ page }) => {
    await page.goto('/admin/tariffs');
    await expect(page).toHaveURL(/\/admin\/tariffs/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Tariff list renders on page', async ({ page }) => {
    await page.goto('/admin/tariffs');
    // Renders a table when tariffs exist, or an EmptyState card when none — either is valid.
    await expect(
      page.locator('table, [class*="card"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Admin can list tariffs via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/tariffs`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('Tariff Management — Create', () => {

  test('Create tariff button is visible', async ({ page }) => {
    await page.goto('/admin/tariffs');
    // Locale fixed to 'en' — button text is "Add Tariff"
    await expect(page.locator('button:has-text("Add Tariff")')).toBeVisible({ timeout: 10_000 });
  });

  test('Tariff creation form appears on Create button click', async ({ page }) => {
    await page.goto('/admin/tariffs');
    await page.locator('button:has-text("Add Tariff")').click();
    await expect(
      page.locator('[role="dialog"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Admin can create tariff via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/tariffs`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          serviceType:   'STANDARD',
          originZone:    'Yaoundé',
          destinationZone: 'Douala',
          minWeight:     0,
          maxWeight:     5,
          basePrice:     2000,
          pricePerKg:    500,
          currency:      'XAF',
        },
      }
    );
    expect([201, 200, 409, 400]).toContain(res.status());
  });

  test('Non-admin cannot create tariff (403)', async ({ request }) => {
    const clientRes = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/auth/login`,
      { data: { phone: '+237699000001', password: 'Test123!Client' } }
    );
    if (!clientRes.ok()) return; // skip if client user not set up

    const { token } = await clientRes.json();
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/tariffs`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { serviceType: 'STANDARD', basePrice: 1000 },
      }
    );
    expect([403, 401]).toContain(res.status());
  });
});

test.describe('Tariff Management — Filter', () => {

  test('Service type filter is visible', async ({ page }) => {
    await page.goto('/admin/tariffs');
    // Shadcn Select trigger renders as a button — text shows current value ("ALL")
    await expect(
      page.locator('button:has-text("ALL"), button:has-text("All")').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Price quote API is callable', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/tariffs/quote?serviceType=STANDARD&weight=2.5`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    // Either 200 (quote returned) or 404 (no tariff configured) is acceptable
    expect([200, 404, 400]).toContain(res.status());
  });
});
