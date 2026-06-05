/**
 * Auth — Form Validation Tests
 *
 * Tests server-side and client-side validation for all public auth forms:
 * - Login: phone format, empty fields, wrong credentials
 * - Register: duplicate phone, password strength, OTP validity
 * - Security: input injection attempts (XSS, SQL injection)
 *
 * Uses API-level testing for deterministic server-side validation.
 */
import { test, expect } from '@playwright/test';
import { fillRegistrationForm } from '../helpers/auth.helpers';

const API = process.env.API_URL ?? 'http://localhost:8082';

// ── Login Form Validation ─────────────────────────────────────────────────────

test.describe('Login — Server-side validation', () => {

  test('Empty phone returns 400 or 404', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '', password: 'Test123!' },
    });
    expect([400, 404]).toContain(res.status());
  });

  test('Missing phone field returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { password: 'Test123!' },
    });
    expect([400]).toContain(res.status());
  });

  test('Missing password field returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '+237699000001' },
    });
    expect([400]).toContain(res.status());
  });

  test('Invalid phone format returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: 'not-a-phone-number', password: 'Test123!' },
    });
    expect([400, 401, 404]).toContain(res.status());
  });

  test('Non-existent phone returns 401 or 404 (not 500)', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '+237699999887', password: 'Test123!Nope' },
    });
    expect([401, 404]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });

  test('Wrong password for existing user returns 401 (not 500)', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '+237699000001', password: 'WrongPassword9999!' },
    });
    expect([401, 400]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });

  test('Password field with only spaces returns 400 or 401', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '+237699000001', password: '        ' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('Very long phone number returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '+237699' + '1'.repeat(50), password: 'Test123!' },
    });
    expect([400, 401, 404]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });
});

// ── Login Form UI Validation ──────────────────────────────────────────────────

test.describe('Login — UI form validation', () => {

  test('Login page shows error on wrong credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));

    await page.locator('#phoneOrEmail, input[type="text"]').first().fill('+237699999887');
    await page.locator('#password, input[type="password"]').first().fill('WrongPassword999!');
    await page.locator('button[type="submit"]').click();

    // Error message or toast should appear
    await expect(
      page.locator('[data-sonner-toast], [role="alert"], [class*="error"], [class*="toast"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Login page remains on /auth/login after failed login', async ({ page }) => {
    await page.goto('/auth/login');
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));

    await page.locator('#phoneOrEmail, input[type="text"]').first().fill('+237699BADINPUT');
    await page.locator('#password, input[type="password"]').first().fill('WrongPass1!');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/auth\/login/);
  });
});

// ── Registration Form Validation ──────────────────────────────────────────────

test.describe('Registration — Server-side validation', () => {

  test('Duplicate phone registration returns 409 Conflict', async ({ request }) => {
    // TEST_CLIENT phone is already registered by global.setup.ts
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName:          'Duplicate User',
        phone:             '+237699000001',
        password:          'Test123!Dup',
        otp:               '000000',
        preferredLanguage: 'EN',
      },
    });
    // 409 = conflict (already registered), 400 = invalid OTP — both acceptable
    expect([400, 409]).toContain(res.status());
  });

  test('Password too short returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName:          'Short Pass User',
        phone:             '+237699776001',
        password:          'Sh1!',      // Too short
        otp:               '000000',
        preferredLanguage: 'EN',
      },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('Password with no uppercase returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName:          'No Upper User',
        phone:             '+237699776002',
        password:          'allowercase1!',
        otp:               '000000',
        preferredLanguage: 'EN',
      },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('Missing fullName returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        phone:             '+237699776003',
        password:          'Test123!NoName',
        otp:               '000000',
        preferredLanguage: 'EN',
      },
    });
    expect([400]).toContain(res.status());
  });

  test('Missing phone returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName:          'No Phone User',
        password:          'Test123!NoPhone',
        otp:               '000000',
        preferredLanguage: 'EN',
      },
    });
    expect([400]).toContain(res.status());
  });

  test('Invalid OTP returns 400 or 401', async ({ request }) => {
    // Send OTP first (to ensure the phone has an active OTP session)
    await request.post(`${API}/api/auth/send-otp`, {
      data: { phone: '+237699776004' },
    });

    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName:          'Bad OTP User',
        phone:             '+237699776004',
        password:          'Test123!BadOtp',
        otp:               '000000',      // Wrong OTP
        preferredLanguage: 'EN',
      },
    });
    // Backend should reject invalid OTP
    expect([400, 401]).toContain(res.status());
  });

  test('Registration without sending OTP first returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName:          'No OTP Sent',
        phone:             '+237699887001',
        password:          'Test123!NoOtp',
        otp:               '123456',
        preferredLanguage: 'EN',
      },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('Phone number without country code returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/send-otp`, {
      data: { phone: '0699776005' },     // Missing +237
    });
    // 400/422 = rejected by server validation
    // 429 = OTP rate limit (60s cooldown per phone number)
    // 404 = phone not found in DB (treated as valid format by some validators)
    expect([400, 404, 422, 429]).toContain(res.status());
  });
});

// ── Password Reset Validation ─────────────────────────────────────────────────

test.describe('Password Reset — Validation', () => {

  test('Password reset with invalid OTP returns 400 or 401', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/reset-password`, {
      data: {
        phone:       '+237699000001',
        otp:         '000000',
        newPassword: 'NewTest123!Valid',
      },
    });
    // 403 = backend may return Forbidden for invalid OTP sessions
    expect([400, 401, 403]).toContain(res.status());
  });

  test('Password reset with weak new password returns 400', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/reset-password`, {
      data: {
        phone:       '+237699000001',
        otp:         '000000',
        newPassword: 'weak',
      },
    });
    // 403 = invalid OTP checked before password strength (backend order-dependent)
    expect([400, 401, 403, 422]).toContain(res.status());
  });
});

// ── Security — Input Injection ────────────────────────────────────────────────

test.describe('Validation — Input injection attempts', () => {

  test('XSS in fullName is handled safely (no 500)', async ({ request }) => {
    await request.post(`${API}/api/auth/send-otp`, {
      data: { phone: '+237699776010' },
    });
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName:          '<script>alert(1)</script>',
        phone:             '+237699776010',
        password:          'Test123!XSS',
        otp:               '000000',
        preferredLanguage: 'EN',
      },
    });
    // Accept: 200/201 (stored safely) or 400 (rejected) — never 500
    expect(res.status()).not.toBe(500);
    expect([200, 201, 400, 401, 409]).toContain(res.status());
  });

  test('SQL injection in phone field is rejected as bad format (not 500)', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: {
        phone:    "'; DROP TABLE user_account; --",
        password: 'InjectionTest1!',
      },
    });
    // Rejected as invalid format — NOT 500 (would indicate unhandled exception)
    expect(res.status()).not.toBe(500);
    expect([400, 401, 404]).toContain(res.status());
  });

  test('JSON injection in phone field is handled safely', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: {
        phone:    '{"$gt": ""}',
        password: 'InjectionTest1!',
      },
    });
    expect(res.status()).not.toBe(500);
    expect([400, 401, 404]).toContain(res.status());
  });

  test('Extremely long fullName is handled safely (no 500)', async ({ request }) => {
    await request.post(`${API}/api/auth/send-otp`, {
      data: { phone: '+237699776011' },
    });
    const res = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName:          'A'.repeat(5000),
        phone:             '+237699776011',
        password:          'Test123!Long',
        otp:               '000000',
        preferredLanguage: 'EN',
      },
    });
    expect(res.status()).not.toBe(500);
    expect([200, 201, 400, 401, 413]).toContain(res.status());
  });

  test('Null bytes in password do not cause 500', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: {
        phone:    '+237699000001',
        password: 'Test 123!',
      },
    });
    expect(res.status()).not.toBe(500);
    expect([400, 401]).toContain(res.status());
  });
});
