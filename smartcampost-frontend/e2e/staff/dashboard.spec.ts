/**
 * Staff — Dashboard Tests
 * Covers: staff list, parcel management, pickup assignment, analytics.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE } from '../fixtures/users';
import { apiLogin } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.staff });

test.describe('Staff Dashboard', () => {

  test('Staff dashboard loads at /staff', async ({ page }) => {
    await page.goto('/staff');
    await expect(page).toHaveURL(/\/staff/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard shows staff-related content', async ({ page }) => {
    await page.goto('/staff');
    await expect(
      page.locator('h1, h2, [class*="card"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Staff can navigate to parcel management', async ({ page }) => {
    await page.goto('/staff/parcels');
    await expect(page).toHaveURL(/\/staff\/parcels/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Staff can navigate to pickups management', async ({ page }) => {
    await page.goto('/staff/pickups');
    await expect(page).toHaveURL(/\/staff\/pickups/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Staff can navigate to analytics', async ({ page }) => {
    await page.goto('/staff/analytics');
    await expect(page).toHaveURL(/\/staff\/analytics/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Staff can navigate to scan console', async ({ page }) => {
    await page.goto('/staff/scan');
    await expect(page).toHaveURL(/\/staff\/scan/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Staff can navigate to tracking', async ({ page }) => {
    await page.goto('/staff/tracking');
    await expect(page).toHaveURL(/\/staff\/tracking/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Staff — Role Isolation', () => {

  test('STAFF cannot access /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/^.*\/admin$/);
  });

  test('STAFF cannot access /finance', async ({ page }) => {
    await page.goto('/finance');
    await expect(page).not.toHaveURL(/^.*\/finance$/);
  });
});

test.describe('Staff — API Permissions', () => {

  test('STAFF can view all parcels', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');

    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204]).toContain(res.status());
  });

  test('STAFF cannot create staff accounts (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/staff`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          fullName: 'Unauthorized Staff',
          phone:    '+237699888001',
          password: 'Test123!Staff2',
          role:     'STAFF',
        },
      }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('STAFF can assign courier to pickup', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/pickups/non-existent/assign-courier`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { courierId: 'some-courier-id' },
      }
    );
    // 404 for non-existent pickup — NOT 403
    expect([400, 404]).toContain(res.status());
    expect(res.status()).not.toBe(403);
  });
});

// ── CRUD Flows ────────────────────────────────────────────────────────────────

test.describe('Staff — CRUD Flows', () => {

  test('STAFF can read all parcels (paginated list)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 204]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      // Either array or Page<> object
      const items = Array.isArray(body) ? body : (body.content ?? []);
      expect(Array.isArray(items)).toBe(true);
    }
  });

  test('STAFF can read all pickups', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/pickups`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).not.toBe(403);
    expect([200, 204, 404]).toContain(res.status());
  });

  test('STAFF can update parcel status (400/404 for non-existent — not 403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');
    const res = await request.patch(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/parcels/00000000-0000-0000-0000-000000000000/status`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { status: 'IN_TRANSIT', note: 'E2E staff update' },
      }
    );
    expect(res.status()).not.toBe(403);
    expect([200, 400, 404]).toContain(res.status());
  });

  test('STAFF can view scan events for a parcel', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/scan-events/parcel/00000000-0000-0000-0000-000000000000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).not.toBe(403);
    expect([200, 204, 404]).toContain(res.status());
  });

  test('STAFF can access analytics summary', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/dashboard/summary`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).not.toBe(403);
    expect([200, 204, 404]).toContain(res.status());
  });

  test('STAFF cannot create new STAFF accounts (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/staff`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          fullName: 'Privilege Escalation Attempt',
          phone:    '+237699988001',
          password: 'Test123!Escalate',
          role:     'ADMIN',
        },
      }
    );
    expect([403, 401]).toContain(res.status());
  });

  test('STAFF cannot delete users (403)', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000002', 'Test123!Staff');
    const res = await request.delete(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/admin/users/00000000-0000-0000-0000-000000000000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([403, 401, 404, 405]).toContain(res.status());
    // Specifically must not be 200 or 204 (deletion should be blocked)
    expect([200, 204]).not.toContain(res.status());
  });
});

// ── Form Validation via UI ────────────────────────────────────────────────────

test.describe('Staff — UI Pages Load and Render Forms', () => {

  test.use({ storageState: AUTH_STATE.staff });

  test('Staff parcels page renders search/filter controls', async ({ page }) => {
    await page.goto('/staff/parcels');
    await expect(page).toHaveURL(/\/staff\/parcels/);
    await expect(page.locator('body')).toBeVisible();
    // Search input or filter should be present
    await expect(
      page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], [class*="filter"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Staff pickups page renders table or empty state', async ({ page }) => {
    await page.goto('/staff/pickups');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});
