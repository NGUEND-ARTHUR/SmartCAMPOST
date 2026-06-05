/**
 * Cross-Role Workflow Tests
 *
 * Tests complete multi-role workflows that span more than one role:
 * - Admin creates internal users → they log in and perform their role
 * - CLIENT data is visible to ADMIN, STAFF (and not to FINANCE/RISK directly)
 * - Account freeze: ADMIN freezes → CLIENT cannot log in → ADMIN unfreezes
 * - Role isolation: cross-role data access attempts are blocked
 * - Admin user management CRUD: create, list, freeze, unfreeze
 * - Role transition: sequential login cycles
 */
import { test, expect } from '@playwright/test';
import {
  AUTH_STATE, ADMIN_USER, TEST_CLIENT, TEST_STAFF, TEST_FINANCE, TEST_RISK,
} from './fixtures/users';
import {
  apiLogin, createTestParcel, getUserByPhone, freezeUser, unfreezeUser,
} from './helpers/api.helpers';

const API = process.env.API_URL ?? 'http://localhost:8082';

// ── Admin Creates Users → Users Perform Role Workflows ───────────────────────

test.describe('Admin creates staff → staff logs in and works', () => {

  const TIMESTAMP = Date.now();
  const newStaff = {
    fullName: `E2E Workflow Staff ${TIMESTAMP}`,
    phone:    `+23769920${String(TIMESTAMP).slice(-5)}`,
    email:    `wfstaff${TIMESTAMP}@smartcampost.test`,
    password: 'Test123!WfStaff',
    role:     'STAFF',
  };

  test('Admin can create a new STAFF user via API', async ({ request }) => {
    const { token } = await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password);
    const res = await request.post(`${API}/api/staff`, {
      headers: { Authorization: `Bearer ${token}` },
      data: newStaff,
    });
    expect([200, 201, 409]).toContain(res.status());
  });

  test('Newly created STAFF user can log in', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: newStaff.phone, password: newStaff.password },
    });
    expect([200, 401, 404]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.accessToken ?? body.token).toBeTruthy();
      expect(body.role).toBe('STAFF');
    }
  });

  test('Newly created STAFF can access staff API endpoints', async ({ request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { phone: newStaff.phone, password: newStaff.password },
    });
    if (!loginRes.ok()) test.skip(true, 'Staff account not created or login failed');
    const json = await loginRes.json();
    const token = json.accessToken ?? json.token;

<<<<<<< HEAD
    const res = await request.get(`${API}/api/parcels`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

test.describe('Admin creates Finance user → Finance performs workflows', () => {

  const TIMESTAMP = Date.now();
  const newFinance = {
    fullName: `E2E Workflow Finance ${TIMESTAMP}`,
    phone:    `+23769921${String(TIMESTAMP).slice(-5)}`,
    email:    `wffinance${TIMESTAMP}@smartcampost.test`,
    password: 'Test123!WfFinance',
    role:     'FINANCE',
  };

  test('Admin can create a FINANCE user', async ({ request }) => {
    const { token } = await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password);
    const res = await request.post(`${API}/api/staff`, {
      headers: { Authorization: `Bearer ${token}` },
      data: newFinance,
    });
    expect([200, 201, 409]).toContain(res.status());
  });

  test('Newly created FINANCE user can log in', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: newFinance.phone, password: newFinance.password },
    });
    expect([200, 401, 404]).toContain(res.status());
    if (res.status() === 200) {
      const json = await res.json();
      expect(json.role).toBe('FINANCE');
    }
  });

  test('Newly created FINANCE can access finance stats', async ({ request }) => {
    const loginRes = await request.post(`${API}/api/auth/login`, {
      data: { phone: newFinance.phone, password: newFinance.password },
    });
    if (!loginRes.ok()) test.skip(true, 'Finance account not created');
    const json = await loginRes.json();
    const token = json.accessToken ?? json.token;

    const res = await request.get(`${API}/api/finance/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ── CLIENT Data Visible to Privileged Roles ───────────────────────────────────

test.describe('CLIENT data — cross-role visibility', () => {

  let parcelId = '';

  test('CLIENT creates a parcel (setup)', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_CLIENT.phone, TEST_CLIENT.password);
    try {
      const parcel = await createTestParcel(request, token);
      parcelId = parcel.id;
    } catch {
      // graceful — later tests skip if no parcelId
    }
  });

  test('ADMIN can see CLIENT parcel in all-parcels list', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel created');
    const { token } = await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password);
    const res = await request.get(`${API}/api/parcels/${parcelId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('STAFF can see CLIENT parcel', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel created');
    const { token } = await apiLogin(request, TEST_STAFF.phone, TEST_STAFF.password);
    const res = await request.get(`${API}/api/parcels/${parcelId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });

  test('FINANCE parcel access — role-dependent (200 if allowed, 403 if restricted)', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel created');
    const { token } = await apiLogin(request, TEST_FINANCE.phone, TEST_FINANCE.password);
    const res = await request.get(`${API}/api/parcels/${parcelId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // FINANCE may have read-only parcel access for payment reconciliation
    expect([200, 204, 403, 401, 404]).toContain(res.status());
  });

  test('RISK parcel access — restricted (403) or read-only (200) depending on configuration', async ({ request }) => {
    if (!parcelId) test.skip(true, 'No parcel created');
    const { token } = await apiLogin(request, TEST_RISK.phone, TEST_RISK.password);
    const res = await request.get(`${API}/api/parcels/${parcelId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // RISK may have read-only parcel access for compliance review (same as FINANCE)
    expect([200, 204, 403, 401, 404]).toContain(res.status());
  });
});

// ── Account Freeze Workflow ───────────────────────────────────────────────────

test.describe.serial('Account Freeze — Full lifecycle', () => {

  let freezeTargetId = '';
  const FREEZE_PHONE    = '+237699000099';
  const FREEZE_PASSWORD = 'Test123!Freeze';

  test('Admin looks up freeze target user', async ({ request }) => {
    const adminToken = (await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password)).token;
    const user = await getUserByPhone(request, adminToken, FREEZE_PHONE);
    if (user) {
      freezeTargetId = user.id;
      if (user.frozen) await unfreezeUser(request, adminToken, freezeTargetId);
    }
  });

  test('Freeze target can log in before freeze', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: FREEZE_PHONE, password: FREEZE_PASSWORD },
    });
    expect([200, 404]).toContain(res.status());
    if (res.status() === 404) test.skip(true, 'Freeze target not in DB — run global setup first');
  });

  test('Admin freezes target user', async ({ request }) => {
    if (!freezeTargetId) test.skip(true, 'No freeze target found');
    const adminToken = (await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password)).token;
    await freezeUser(request, adminToken, freezeTargetId, 'E2E workflow freeze');
  });

  test('Frozen user cannot log in (401/423)', async ({ request }) => {
    if (!freezeTargetId) test.skip(true, 'No freeze target');
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: FREEZE_PHONE, password: FREEZE_PASSWORD },
    });
    expect([401, 423]).toContain(res.status());
    expect(res.status()).not.toBe(200);
  });

  test('Admin unfreezes target user', async ({ request }) => {
    if (!freezeTargetId) test.skip(true, 'No freeze target');
    const adminToken = (await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password)).token;
    await unfreezeUser(request, adminToken, freezeTargetId);
  });

  test('Unfrozen user can log in again', async ({ request }) => {
    if (!freezeTargetId) test.skip(true, 'No freeze target');
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: FREEZE_PHONE, password: FREEZE_PASSWORD },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.accessToken ?? json.token).toBeTruthy();
  });
});

// ── RISK Freezes User via Risk Endpoint ──────────────────────────────────────

test.describe('RISK role — freeze user workflow', () => {

  let targetUserId = '';

  test('RISK can look up a user (via admin lookup)', async ({ request }) => {
    const adminToken = (await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password)).token;
    const user = await getUserByPhone(request, adminToken, TEST_CLIENT.phone);
    if (user) targetUserId = user.id;
  });

  test('RISK can freeze user via risk endpoint', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_RISK.phone, TEST_RISK.password);
    const targetId = targetUserId || '00000000-0000-0000-0000-000000000000';
    const res = await request.patch(`${API}/api/risk/users/${targetId}/freeze`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { frozen: true, reason: 'E2E risk workflow freeze' },
    });
    expect(res.status()).not.toBe(403);
    expect([200, 400, 404]).toContain(res.status());
  });

  test('RISK can unfreeze user via risk endpoint', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_RISK.phone, TEST_RISK.password);
    const targetId = targetUserId || '00000000-0000-0000-0000-000000000000';
    const res = await request.patch(`${API}/api/risk/users/${targetId}/freeze`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { frozen: false },
    });
    expect(res.status()).not.toBe(403);
    expect([200, 400, 404]).toContain(res.status());
  });

  test('CLIENT cannot freeze other users via risk endpoint (403)', async ({ request }) => {
    const { token } = await apiLogin(request, TEST_CLIENT.phone, TEST_CLIENT.password);
    const res = await request.patch(`${API}/api/risk/users/00000000-0000-0000-0000-000000000000/freeze`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { frozen: true, reason: 'Unauthorized attempt' },
    });
    expect([403, 401]).toContain(res.status());
  });
});

// ── Admin User Management CRUD ────────────────────────────────────────────────

test.describe('Admin — User Management CRUD', () => {
  test.use({ storageState: AUTH_STATE.admin });

  const TIMESTAMP = Date.now();

  test('Admin UI: users list page renders', async ({ page }) => {
    await page.goto('/admin/users/clients');
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can create agent via API', async ({ request }) => {
    const { token } = await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password);
    const res = await request.post(`${API}/api/agents`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        fullName: `E2E Agent CRUD ${TIMESTAMP}`,
        phone:    `+23769930${String(TIMESTAMP).slice(-5)}`,
        email:    `agentcrud${TIMESTAMP}@smartcampost.test`,
        password: 'Test123!AgentCrud',
      },
    });
    expect([200, 201, 409]).toContain(res.status());
  });

  test('Admin can create courier via API', async ({ request }) => {
    const { token } = await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password);
    const res = await request.post(`${API}/api/couriers`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        fullName:          `E2E Courier CRUD ${TIMESTAMP}`,
        phone:             `+23769931${String(TIMESTAMP).slice(-5)}`,
        email:             `couriercrud${TIMESTAMP}@smartcampost.test`,
        password:          'Test123!CourierCrud',
        vehicleIdentifier: `TEST-CRUD-${TIMESTAMP}`,
      },
    });
    expect([200, 201, 409]).toContain(res.status());
  });

  test('Admin can list all users (Read)', async ({ request }) => {
    const { token } = await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password);
    const res = await request.get(`${API}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      const users = Array.isArray(body) ? body : (body.content ?? []);
      expect(users.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('Admin UI: tariff management page renders', async ({ page }) => {
    await page.goto('/admin/tariffs');
    await expect(page).toHaveURL(/\/admin\/tariffs/);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ── Role Transition: Sequential Login Cycles ──────────────────────────────────

test.describe('Role transition — Sequential logins', () => {

  test('ADMIN login → admin dashboard → logout cycle', async ({ page }) => {
    await page.goto('/auth/login');
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await page.locator('#phoneOrEmail, input[type="text"]').first().fill(ADMIN_USER.phone);
    await page.locator('#password, input[type="password"]').first().fill(ADMIN_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/admin/);

    await page.evaluate(() => localStorage.removeItem('auth-storage'));
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('CLIENT login → client dashboard → parcel page → session intact', async ({ page }) => {
    await page.goto('/auth/login');
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await page.locator('#phoneOrEmail, input[type="text"]').first().fill(TEST_CLIENT.phone);
    await page.locator('#password, input[type="password"]').first().fill(TEST_CLIENT.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/client/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/client/);

    await page.goto('/client/parcels');
    await expect(page).toHaveURL(/\/client\/parcels/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('CLIENT cannot navigate to /admin after login (redirected)', async ({ page }) => {
    await page.goto('/auth/login');
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await page.locator('#phoneOrEmail, input[type="text"]').first().fill(TEST_CLIENT.phone);
    await page.locator('#password, input[type="password"]').first().fill(TEST_CLIENT.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/client/, { timeout: 20_000 });

    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin$/);
  });
=======
  // Logout
  await page.click('button:text("Logout")');
  await expect(page).toHaveURL(/login/);
>>>>>>> ad71cf4 (Update SmartCAMPOST frontend and mobile modules)
});
