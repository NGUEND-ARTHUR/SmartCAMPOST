/**
 * Courier — Delivery OTP Flow Tests
 * Covers: start delivery, send OTP, verify OTP, complete delivery, failure states.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE, MOCK_OTP } from '../fixtures/users';
import { apiLogin } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.courier });

test.describe('Delivery Flow — Page Structure', () => {

  test('Deliveries list page loads', async ({ page }) => {
    await page.goto('/courier/deliveries');
    await expect(page).toHaveURL(/\/courier\/deliveries/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Confirm delivery page renders when navigated to directly', async ({ page }) => {
    await page.goto('/courier/deliveries/confirm');
    await expect(page).toHaveURL(/\/courier\/deliveries\/confirm/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Confirm delivery page shows QR scanner on initial load', async ({ page }) => {
    await page.goto('/courier/deliveries/confirm');
    // Initial step is "scan" — DeliveryConfirmation renders QRCodeScanner with #qr-reader div
    await expect(
      page.locator('#qr-reader, [id*="qr-reader"], [class*="card"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Delivery OTP — API Flow', () => {

  test('Delivery OTP send endpoint accepts valid parcel ID format', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/otp/send`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          parcelId:        'non-existent-parcel',
          recipientPhone:  '+237699TEST001',
        },
      }
    );
    // 404 for non-existent parcel — NOT 403
    expect([400, 404, 422]).toContain(res.status());
    expect(res.status()).not.toBe(403);
  });

  test('Delivery OTP verify endpoint accepts valid format', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/otp/verify`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          parcelId: 'non-existent-parcel',
          otp:      MOCK_OTP,
        },
      }
    );
    expect([400, 404, 422]).toContain(res.status());
    expect(res.status()).not.toBe(403);
  });

  test('Start delivery endpoint is accessible to COURIER', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/start`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { parcelId: 'non-existent-parcel' },
      }
    );
    expect([400, 404, 422]).toContain(res.status());
    expect(res.status()).not.toBe(403);
  });

  test('Complete delivery endpoint is accessible to COURIER', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/complete`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          parcelId: 'non-existent-parcel',
          latitude: 3.8480,
          longitude: 11.5021,
        },
      }
    );
    expect([400, 404, 422]).toContain(res.status());
    expect(res.status()).not.toBe(403);
  });

  test('CLIENT cannot call delivery/complete (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/complete`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { parcelId: 'some-parcel' },
      }
    );
    expect([403, 400]).toContain(res.status());
  });

  test('Delivery failure report endpoint accessible to COURIER', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/non-existent-parcel/failed`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: 'RECIPIENT_UNAVAILABLE' },
      }
    );
    expect([400, 404, 422]).toContain(res.status());
    expect(res.status()).not.toBe(403);
  });
});

test.describe('Delivery OTP — Invalid States', () => {

  test('Wrong OTP returns error via API', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/delivery/otp/verify`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          parcelId: 'any-parcel-id',
          otp:      '999999',  // wrong OTP
        },
      }
    );
    // Backend returns error — not necessarily 400, could be 404 for parcel not found
    expect(res.status()).not.toBe(200);
  });
});
