/**
 * Guest / Unauthenticated Role — Complete Public Access Tests
 *
 * Covers every requirement for the guest role:
 * - Public pages accessible without login
 * - ALL protected routes redirect unauthenticated users to /auth/login
 * - Public API endpoints accessible without token
 * - Protected API endpoints reject requests without valid token
 * - Tampered/expired tokens are rejected
 */
import { test, expect } from '@playwright/test';

const API = process.env.API_URL ?? 'http://localhost:8082';

// ── Public Pages ─────────────────────────────────────────────────────────────

test.describe('Guest — Public Pages', () => {

  test('Landing page (/) is accessible without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/auth\/login/);
  });

  test('Login page accessible and renders form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/auth\/login/);
    await expect(
      page.locator('#phoneOrEmail, input[type="text"], input[name="phone"]').first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('#password, input[type="password"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Register page accessible and renders form', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/auth\/register/);
    await expect(
      page.locator('#fullName, input[name="fullName"]').first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('#phone, input[name="phone"], input[type="tel"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Send OTP button is visible on register page', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(
      page.locator('button:has-text("OTP"), button:has-text("Send"), button:has-text("Envoyer")').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ── Protected Routes → Redirect to Login ─────────────────────────────────────

test.describe('Guest — ADMIN routes redirect to login', () => {
  const routes = ['/admin', '/admin/users/clients', '/admin/users/staff', '/admin/tariffs', '/admin/parcels'];
  for (const route of routes) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
    });
  }
});

test.describe('Guest — CLIENT routes redirect to login', () => {
  const routes = ['/client', '/client/parcels', '/client/parcels/create', '/client/payments', '/client/pickups', '/client/tracking', '/client/notifications'];
  for (const route of routes) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
    });
  }
});

test.describe('Guest — STAFF routes redirect to login', () => {
  const routes = ['/staff', '/staff/parcels', '/staff/pickups', '/staff/scan', '/staff/analytics'];
  for (const route of routes) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
    });
  }
});

test.describe('Guest — AGENT routes redirect to login', () => {
  const routes = ['/agent', '/agent/scan', '/agent/map', '/agent/notifications'];
  for (const route of routes) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
    });
  }
});

test.describe('Guest — COURIER routes redirect to login', () => {
  const routes = ['/courier', '/courier/pickups', '/courier/deliveries', '/courier/deliveries/confirm', '/courier/scan'];
  for (const route of routes) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
    });
  }
});

test.describe('Guest — FINANCE routes redirect to login', () => {
  const routes = ['/finance', '/finance/payments', '/finance/refunds', '/finance/analytics'];
  for (const route of routes) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
    });
  }
});

test.describe('Guest — RISK routes redirect to login', () => {
  const routes = ['/risk', '/risk/alerts', '/risk/compliance', '/risk/analytics'];
  for (const route of routes) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/auth\/login/, { timeout: 15_000 });
    });
  }
});

// ── Public API Endpoints ──────────────────────────────────────────────────────

test.describe('Guest — Public API endpoints', () => {

  test('GET /actuator/health returns 200 without auth', async ({ request }) => {
    const res = await request.get(`${API}/actuator/health`);
    expect([200, 204]).toContain(res.status());
  });

  test('POST /api/auth/login is publicly accessible (rejects bad creds, not 403)', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '+237699GUEST01', password: 'WrongPass1!' },
    });
    expect([400, 401, 404]).toContain(res.status());
    expect(res.status()).not.toBe(403);
  });

  test('POST /api/auth/send-otp is publicly accessible', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/send-otp`, {
      data: { phone: '+237699000001' },
    });
    expect([200, 400, 429]).toContain(res.status());
    expect([401, 403]).not.toContain(res.status());
  });

  test('GET /api/track/{ref} returns 404 (not 401) — public endpoint', async ({ request }) => {
    const res = await request.get(`${API}/api/track/SCP-GUEST-PUBLIC-001`);
    expect([200, 404, 400]).toContain(res.status());
    expect([401, 403]).not.toContain(res.status());
  });
});

// ── Protected API Endpoints Return 401/403 Without Token ─────────────────────

test.describe('Guest — Protected API endpoints return 401/403', () => {

  const protectedGet = [
    '/api/parcels',
    '/api/parcels/me',
    '/api/admin/users',
    '/api/finance/stats',
    '/api/finance/refunds',
    '/api/risk/alerts',
    '/api/notifications/me',
    '/api/dashboard/summary',
    '/api/addresses',
    '/api/pickups/courier/me',
  ];

  for (const path of protectedGet) {
    test(`GET ${path} returns 401/403 without token`, async ({ request }) => {
      const res = await request.get(`${API}${path}`);
      expect([401, 403]).toContain(res.status());
    });
  }

  test('POST /api/parcels returns 401/403 without token', async ({ request }) => {
    const res = await request.post(`${API}/api/parcels`, {
      data: { weight: 1.0, serviceType: 'STANDARD' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/scan-events returns 401/403 without token', async ({ request }) => {
    const res = await request.post(`${API}/api/scan-events`, {
      data: { parcelId: 'anything', eventType: 'RECEIVED_AT_AGENCY', latitude: 3.8, longitude: 11.5 },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('GET /actuator/beans returns 401/403 without token', async ({ request }) => {
    const res = await request.get(`${API}/actuator/beans`);
    expect([401, 403]).toContain(res.status());
  });
});

// ── Invalid / Expired Tokens Rejected ────────────────────────────────────────

test.describe('Guest — Token tampering rejected', () => {

  test('Tampered JWT signature returns 401/403', async ({ request }) => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrZXIiLCJyb2xlIjoiQURNSU4ifQ.INVALID_SIGNATURE';
    const res = await request.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('None-algorithm JWT (alg=none attack) returns 401/403', async ({ request }) => {
    // header: {"alg":"none"} → base64url = eyJhbGciOiJub25lIn0
    const noneToken = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiJ9.';
    const res = await request.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${noneToken}` },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Malformed Authorization header (no Bearer prefix) returns 401/403', async ({ request }) => {
    const res = await request.get(`${API}/api/parcels/me`, {
      headers: { Authorization: 'not-a-bearer-token' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Empty Bearer token returns 401/403', async ({ request }) => {
    const res = await request.get(`${API}/api/parcels/me`, {
      headers: { Authorization: 'Bearer ' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Expired token payload (past exp) returns 401/403', async ({ request }) => {
    // exp = 1 (Jan 1, 1970) — definitely expired
    const expiredPayload = Buffer.from(JSON.stringify({ sub: 'user', role: 'CLIENT', exp: 1 })).toString('base64url');
    const expiredToken = `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.fake_sig`;
    const res = await request.get(`${API}/api/parcels/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    expect([401, 403]).toContain(res.status());
  });
});
