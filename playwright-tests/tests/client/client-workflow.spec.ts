import { test, expect } from '@playwright/test';
import { registerClient } from '../../test-utils/api';

test.describe('Client workflows (registration, auth, session)', () => {
  test('Client self-registration validates request contract', async ({ request }) => {
    const payload = {
      name: 'E2E Client',
      phone: '+237690000201',
      email: 'e2e.client@example.com',
      password: 'Client@1234',
      otp: '000000' // intentionally invalid in most environments
    };

    const res = await registerClient(request, payload);
    // The backend contract requires fullName, not name. This should fail fast as a validation check.
    expect([400, 422]).toContain(res.status());
  });

  test('Client registration rejects duplicate-looking payload contract', async ({ request }) => {
    const payload = {
      fullName: 'E2E Client Duplicate',
      phone: 'invalid-phone',
      email: 'not-an-email',
      password: 'Client@1234',
      otp: '000000'
    };
    const res = await registerClient(request, payload);
    // Validation errors are expected here.
    expect([400, 422]).toContain(res.status());
  });

  test('Client self-registration succeeds when valid OTP data is supplied', async ({ request }) => {
    const otp = process.env.TEST_CLIENT_OTP;
    const phone = process.env.TEST_CLIENT_PHONE;
    const email = process.env.TEST_CLIENT_EMAIL || `client.${Date.now()}@example.com`;

    test.skip(!otp || !phone, 'Set TEST_CLIENT_OTP and TEST_CLIENT_PHONE to enable the positive client registration test');

    const res = await registerClient(request, {
      fullName: `E2E Client ${Date.now()}`,
      phone,
      email,
      preferredLanguage: 'en',
      password: 'Client@1234',
      otp,
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.accessToken || body.tokenType).toBeTruthy();
    expect(String(body.role).toUpperCase()).toBe('CLIENT');
  });
});
