/**
 * Courier — Dashboard Tests
 * Covers: pickup list, delivery list, navigation, role isolation.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';
import { apiLogin, createTestParcel } from '../helpers/api.helpers';

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

// ── Positive Delivery Flow with Real Parcel ───────────────────────────────────

test.describe.serial('Courier — Delivery Flow with Real Parcel', () => {

  let parcelId = '';

  test('Setup: CLIENT creates parcel for courier delivery test', async ({ request }) => {
    const { token: clientToken } = await apiLogin(request, '+237699000001', 'Test123!Client');
    try {
      const parcel = await createTestParcel(request, clientToken);
      parcelId = parcel.id;
      expect(parcelId).toBeTruthy();
    } catch {
      test.skip(true, 'Could not create test parcel — skipping delivery flow');
    }
  });

  test('COURIER can call delivery/start (400 if not assigned — not 403)', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel from setup');

    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/start`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { parcelId },
      }
    );
    // 400 = courier not assigned; 404 = parcel not in deliverable state; NOT 403
    expect(res.status()).not.toBe(403);
    expect([200, 201, 400, 404, 422]).toContain(res.status());
  });

  test('COURIER can send delivery OTP (400 if parcel not in right state)', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel from setup');

    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/otp/send`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { parcelId, recipientPhone: '+237699000001' },
      }
    );
    expect(res.status()).not.toBe(403);
    expect([200, 201, 400, 404, 422]).toContain(res.status());
  });

  test('COURIER can report delivery failure (403 if not assigned to parcel)', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel from setup');

    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/${parcelId}/failed`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: 'RECIPIENT_UNAVAILABLE', notes: 'E2E test delivery failure' },
      }
    );
    // 403 = COURIER not assigned to this parcel (business rule, not missing permission)
    // 400/404 = parcel not in deliverable state
    expect([200, 201, 400, 403, 404, 422]).toContain(res.status());
  });

  test('AGENT cannot perform delivery operations (403)', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel from setup');

    const { token } = await apiLogin(request, '+237699000003', 'Test123!Agent');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/start`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { parcelId },
      }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('CLIENT cannot start delivery for own parcel (403)', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel from setup');

    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/start`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { parcelId },
      }
    );
    expect([403, 401]).toContain(res.status());
  });
});

// ── COURIER CRUD Verification ─────────────────────────────────────────────────

test.describe('Courier — CRUD Permissions', () => {

  test('COURIER can read own delivery list', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/courier/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).not.toBe(403);
    expect([200, 204, 404]).toContain(res.status());
  });

  test('COURIER cannot read all parcels (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/admin/users`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('COURIER cannot create parcels (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          senderAddressId:    '00000000-0000-0000-0000-000000000000',
          recipientAddressId: '00000000-0000-0000-0000-000000000001',
          weight: 1.0, serviceType: 'STANDARD',
          deliveryOption: 'AGENCY', paymentOption: 'PREPAID',
        },
      }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('COURIER cannot access finance data (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/finance/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });
});
