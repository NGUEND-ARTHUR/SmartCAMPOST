/**
 * Permissions — Role Boundary Tests
 * Covers: every role's access to every other role's routes (UI + API).
 *
 * Business rules enforced:
 * - CLIENT: access only /client/* routes
 * - AGENT: access only /agent/* routes
 * - COURIER: access only /courier/* routes
 * - STAFF: access only /staff/* routes (+ analytics)
 * - ADMIN: access all /* routes
 * - FINANCE: access only /finance/* routes
 * - RISK: access only /risk/* routes
 */

import { test, expect } from '@playwright/test';
import { AUTH_STATE } from '../fixtures/users';
import { apiLogin } from '../helpers/api.helpers';

// ── CLIENT cannot access other roles' routes ──────────────────────────────────

test.describe('CLIENT — Route Access Boundaries', () => {
  test.use({ storageState: AUTH_STATE.client });

  test('CLIENT redirected away from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/^http.*\/admin$/);
  });

  test('CLIENT redirected away from /staff', async ({ page }) => {
    await page.goto('/staff');
    await expect(page).not.toHaveURL(/^http.*\/staff$/);
  });

  test('CLIENT redirected away from /agent', async ({ page }) => {
    await page.goto('/agent');
    await expect(page).not.toHaveURL(/^http.*\/agent$/);
  });

  test('CLIENT redirected away from /courier', async ({ page }) => {
    await page.goto('/courier');
    await expect(page).not.toHaveURL(/^http.*\/courier$/);
  });

  test('CLIENT redirected away from /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).not.toHaveURL(/^http.*\/finance$/);
  });

  test('CLIENT redirected away from /risk', async ({ page }) => {
    await page.goto('/risk');
    await expect(page).not.toHaveURL(/^http.*\/risk$/);
  });
});

// ── FINANCE cannot access parcel management ───────────────────────────────────

test.describe('FINANCE — Route Access Boundaries', () => {
  test.use({ storageState: AUTH_STATE.finance });

  test('FINANCE redirected from /admin/parcels', async ({ page }) => {
    await page.goto('/admin/parcels');
    await expect(page).not.toHaveURL(/\/admin\/parcels/);
  });

  test('FINANCE redirected from /admin/users/staff', async ({ page }) => {
    await page.goto('/admin/users/staff');
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });

  test('FINANCE redirected from /risk', async ({ page }) => {
    await page.goto('/risk');
    await expect(page).not.toHaveURL(/^http.*\/risk$/);
  });
});

// ── RISK cannot access financial data ─────────────────────────────────────────

test.describe('RISK — Route Access Boundaries', () => {
  test.use({ storageState: AUTH_STATE.risk });

  test('RISK redirected from /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).not.toHaveURL(/^http.*\/finance$/);
  });

  test('RISK redirected from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/^http.*\/admin$/);
  });
});

// ── API-Level Permission Boundaries ──────────────────────────────────────────

test.describe('API — Permission Enforcement', () => {

  test('Unauthenticated request returns 401 on protected endpoints', async ({ request }) => {
    const endpoints = [
      '/api/parcels',
      '/api/parcels/me',
      '/api/dashboard/summary',
      '/api/notifications/me',
      '/api/finance/stats',
      '/api/risk/alerts',
      '/api/admin/users',
    ];

    for (const endpoint of endpoints) {
      const res = await request.get(
        `${process.env.API_URL ?? 'http://localhost:8082'}${endpoint}`
      );
      expect([401, 403]).toContain(res.status());
    }
  });

  test('CLIENT token cannot access /api/admin/users', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/admin/users`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('CLIENT token cannot access /api/finance/stats', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/finance/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('CLIENT token cannot access /api/risk/alerts', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/risk/alerts`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('FINANCE token cannot access /api/risk/alerts', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000005', 'Test123!Finance');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/risk/alerts`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('RISK token cannot access /api/finance/stats', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000006', 'Test123!Risk');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/finance/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('AGENT token cannot create parcels', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000003', 'Test123!Agent');
    // Use valid UUID format + required fields so Spring MVC can bind args before @PreAuthorize runs
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          senderAddressId:    '00000000-0000-0000-0000-000000000000',
          recipientAddressId: '00000000-0000-0000-0000-000000000001',
          weight:             1.0,
          serviceType:        'STANDARD',
          deliveryOption:     'AGENCY',
          paymentOption:      'PREPAID',
        },
      }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('COURIER token cannot create parcels', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000004', 'Test123!Courier');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          senderAddressId:    '00000000-0000-0000-0000-000000000000',
          recipientAddressId: '00000000-0000-0000-0000-000000000001',
          weight:             1.0,
          serviceType:        'STANDARD',
          deliveryOption:     'AGENCY',
          paymentOption:      'PREPAID',
        },
      }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('STAFF token cannot create staff accounts', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/staff`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { fullName: 'Hack', phone: '+237699888999', password: 'Test123!', role: 'STAFF' },
      }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('ADMIN token CAN access all resources', async ({ request }) => {
    // Admin login uses phone — email is null in the bootstrapped DB
    const { token } = await apiLogin(request, '+237690000000', 'Admin@SmartCAMPOST2026');

    // Admin can access finance stats
    const financeRes = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/finance/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204]).toContain(financeRes.status());

    // Admin can access risk alerts
    const riskRes = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/risk/alerts`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204]).toContain(riskRes.status());

    // Admin can list all users
    const usersRes = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/admin/users`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204]).toContain(usersRes.status());
  });
});

// ── Role Escalation Attempt ───────────────────────────────────────────────────

test.describe('Security — Role Escalation Attempts', () => {

  test('Cannot inject role via register endpoint', async ({ request }) => {
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/auth/register`,
      {
        data: {
          fullName: 'Role Inject Test',
          phone:    '+237699777001',
          password: 'Test123!Inject',
          otp:      '000000',
          role:     'ADMIN',  // Attempted role injection
          preferredLanguage: 'EN',
        },
      }
    );
    // If registration succeeds, verify the role is CLIENT (not ADMIN)
    if (res.ok()) {
      const body = await res.json();
      // Registration endpoint hardcodes role=CLIENT
      // The returned user should NOT be ADMIN
      const bodyStr = JSON.stringify(body);
      expect(bodyStr).not.toContain('"role":"ADMIN"');
      expect(bodyStr).not.toContain('"ADMIN"');
    }
    // OR registration may fail — that's also acceptable
    expect([200, 201, 400, 409, 422]).toContain(res.status());
  });

  test('Expired/tampered JWT returns 401', async ({ request }) => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrIiwicm9sZSI6IkFETUlOIn0.fake_signature';
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/admin/users`,
      { headers: { Authorization: `Bearer ${fakeToken}` } }
    );
    expect([401, 403]).toContain(res.status());
  });

  test('Missing Authorization header returns 401', async ({ request }) => {
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels/me`
    );
    expect([401, 403]).toContain(res.status());
  });
});
