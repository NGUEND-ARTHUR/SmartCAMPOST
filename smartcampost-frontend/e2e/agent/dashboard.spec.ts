/**
 * Agent — Dashboard Tests
 * Covers: agent dashboard, task list, navigation, role isolation.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';
import { apiLogin } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.agent });

test.describe('Agent Dashboard', () => {

  test('Agent dashboard loads at /agent', async ({ page }) => {
    await page.goto('/agent', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/agent/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard shows task-related content', async ({ page }) => {
    await page.goto('/agent');
    await expect(
      page.locator('h1, h2, [class*="card"], [class*="task"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Navigation shows Scan link', async ({ page }) => {
    await page.goto('/agent');
    const scanLink = page.locator('a[href*="/agent/scan"]').first();
    await expect(scanLink).toBeVisible({ timeout: 10_000 });
  });

  test('Agent can navigate to scan console', async ({ page }) => {
    await page.goto('/agent/scan');
    await expect(page).toHaveURL(/\/agent\/scan/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Agent can navigate to map', async ({ page }) => {
    await page.goto('/agent/map');
    await expect(page).toHaveURL(/\/agent\/map/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Agent can navigate to notifications', async ({ page }) => {
    await page.goto('/agent/notifications');
    await expect(page).toHaveURL(/\/agent\/notifications/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Agent — Role Isolation', () => {

  test('AGENT cannot access /admin (redirected)', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/^.*\/admin$/);
  });

  test('AGENT cannot access /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).not.toHaveURL(/^.*\/finance$/);
  });

  test('AGENT cannot access /risk', async ({ page }) => {
    await page.goto('/risk');
    await expect(page).not.toHaveURL(/^.*\/risk$/);
  });

  test('AGENT cannot access /client routes', async ({ page }) => {
    await page.goto('/client');
    await expect(page).not.toHaveURL(/^.*\/client$/);
  });
});

test.describe('Agent — API Permissions', () => {

  test('AGENT can create scan events via API', async ({ request }) => {
    let token: string;
    try {
      const result = await apiLogin(request, '+237699000003', 'Test123!Agent');
      token = result.token;
    } catch {
      return; // skip if agent not set up
    }

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/scan-events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          parcelId:   'invalid-parcel-id',
          eventType:  'RECEIVED_AT_AGENCY',
          latitude:   3.8480,
          longitude:  11.5021,
          notes:      'E2E test scan',
        },
      }
    );
    // 400 or 404 for invalid parcel — but NOT 403 (agent has scan permission)
    expect(res.status()).not.toBe(403);
  });

  test('AGENT cannot create parcels (403)', async ({ request }) => {
    const loginRes = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/auth/login`,
      { data: { phone: '+237699000003', password: 'Test123!Agent' } }
    );
    if (!loginRes.ok()) return;

    const { token } = await loginRes.json();
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { senderAddressId: 'x', recipientAddressId: 'y', weight: 1.0 },
      }
    );
    expect(res.status()).toBe(403);
  });
});
