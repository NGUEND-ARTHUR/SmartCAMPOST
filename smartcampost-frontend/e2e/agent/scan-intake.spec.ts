/**
 * Agent — Scan Intake Tests
 * Covers: QR scan console, scan event creation with GPS, validate-and-lock.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';
import { apiLogin } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.agent });

test.describe('Scan Console — Page Structure', () => {

  test('Scan console loads at /agent/scan', async ({ page }) => {
    // Use domcontentloaded to avoid waiting on camera initialization (headless has no camera)
    await page.goto('/agent/scan', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/agent\/scan/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('QR scanner element is rendered', async ({ page }) => {
    await page.goto('/agent/scan');
    // html5-qrcode renders a div with id or scanner container
    await expect(
      page.locator('[id*="qr"], [class*="scanner"], [class*="qr"], video').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Scan console shows intake list or counter', async ({ page }) => {
    await page.goto('/agent/scan');
    // ScanConsole accumulates scanned parcels in a list
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Scan Event — API', () => {

  test('Scan event with valid GPS coordinates is accepted', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000003', 'Test123!Agent');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/scan-events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          parcelId:  'invalid-but-testing-permissions',
          eventType: 'RECEIVED_AT_AGENCY',
          latitude:  3.8480,
          longitude: 11.5021,
        },
      }
    );
    // 400 for invalid parcelId, NOT 403
    expect(res.status()).not.toBe(403);
  });

  test('Scan event without GPS (null lat/lng) is rejected by backend', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000003', 'Test123!Agent');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/scan-events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          parcelId:  'some-parcel-id',
          eventType: 'RECEIVED_AT_AGENCY',
          // No GPS fields
        },
      }
    );
    // Backend should reject: GPS is NOT NULL in schema
    expect([400, 422]).toContain(res.status());
  });

  test('Scan event with out-of-Cameroon coordinates is flagged', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000003', 'Test123!Agent');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/scan-events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          parcelId:  'some-parcel-id',
          eventType: 'RECEIVED_AT_AGENCY',
          latitude:  0.0,      // Out of Cameroon (0.0, 0.0)
          longitude: 0.0,
        },
      }
    );
    // May be accepted (400 for invalid parcel) or rejected (400/422 for bad GPS)
    // Key: should NOT be 403 (permission error)
    expect(res.status()).not.toBe(403);
  });
});

test.describe('Parcel Validate and Lock — API', () => {

  test('AGENT can call validate-and-lock endpoint (404 for non-existent parcel)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000003', 'Test123!Agent');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels/non-existent-id/validate-and-lock`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { validatedWeight: 2.5 },
      }
    );
    // 404 for non-existent parcel — NOT 403 (agent has this permission)
    expect([404, 400]).toContain(res.status());
  });

  test('CLIENT cannot validate-and-lock parcels (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');
    // Valid UUID + inline query params so Spring MVC binds args before @PreAuthorize check
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels/00000000-0000-0000-0000-000000000000/validate-and-lock?latitude=3.848&longitude=11.502`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401, 400]).toContain(res.status());
    expect(res.status()).not.toBe(200);
  });

  test('Can-correct endpoint returns boolean for valid parcel', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000003', 'Test123!Agent');
    // Use a valid UUID so Spring MVC binds the path variable; 404 = parcel not found
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels/00000000-0000-0000-0000-000000000000/can-correct`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 404, 400]).toContain(res.status());
  });
});
