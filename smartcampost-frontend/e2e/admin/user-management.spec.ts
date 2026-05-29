/**
 * Admin — User Management Tests
 * Covers: create staff/agent/courier/finance/risk, list users, filter by role.
 *
 * IMPORTANT: Only ADMIN can create internal users.
 * CLIENT self-registers — all other roles require ADMIN creation.
 */

import { test, expect } from '../fixtures';
import { AUTH_STATE, TEST_CLIENT } from '../fixtures/users';
import { getAdminToken } from '../helpers/api.helpers';

test.use({ storageState: AUTH_STATE.admin });

const TIMESTAMP = Date.now();

test.describe('Staff Management — Create', () => {

  test('Admin can navigate to staff management page', async ({ page }) => {
    await page.goto('/admin/users/staff');
    await expect(page).toHaveURL(/\/admin\/users\/staff/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Staff creation form renders when Create button clicked', async ({ page }) => {
    await page.goto('/admin/users/staff');
    const createBtn = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();
    // Modal or inline form should appear
    await expect(
      page.locator('dialog, [role="dialog"], form').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Admin can create a new STAFF user via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/staff`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          fullName: `Test Staff ${TIMESTAMP}`,
          phone:    `+23769900${TIMESTAMP.toString().slice(-5)}`,
          email:    `staff${TIMESTAMP}@smartcampost.test`,
          password: 'Test123!Staff',
          role:     'STAFF',
        },
      }
    );
    expect([201, 200, 409]).toContain(res.status());
  });

  test('Admin can create a new FINANCE user via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/staff`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          fullName: `Test Finance ${TIMESTAMP}`,
          phone:    `+23769901${TIMESTAMP.toString().slice(-5)}`,
          email:    `finance${TIMESTAMP}@smartcampost.test`,
          password: 'Test123!Finance',
          role:     'FINANCE',
        },
      }
    );
    expect([201, 200, 409]).toContain(res.status());
  });

  test('Admin can create a new RISK user via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/staff`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          fullName: `Test Risk ${TIMESTAMP}`,
          phone:    `+23769902${TIMESTAMP.toString().slice(-5)}`,
          email:    `risk${TIMESTAMP}@smartcampost.test`,
          password: 'Test123!Risk',
          role:     'RISK',
        },
      }
    );
    expect([201, 200, 409]).toContain(res.status());
  });

  test('Non-ADMIN token cannot create staff (API returns 403)', async ({ request }) => {
    const clientRes = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/auth/login`,
      { data: { phone: TEST_CLIENT.phone, password: TEST_CLIENT.password } }
    );
    const { token: clientToken } = await clientRes.json();

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/staff`,
      {
        headers: { Authorization: `Bearer ${clientToken}` },
        data: {
          fullName: 'Hack Staff',
          phone:    '+237699999888',
          email:    'hack@smartcampost.test',
          password: 'Hack123!Staff',
          role:     'STAFF',
        },
      }
    );
    expect(res.status()).toBe(403);
  });
});

test.describe('Agent Management — Create', () => {

  test('Admin can navigate to agent management', async ({ page }) => {
    await page.goto('/admin/users/agents');
    await expect(page).toHaveURL(/\/admin\/users\/agents/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can create a new AGENT via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/agents`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          fullName: `Test Agent ${TIMESTAMP}`,
          phone:    `+23769903${TIMESTAMP.toString().slice(-5)}`,
          email:    `agent${TIMESTAMP}@smartcampost.test`,
          password: 'Test123!Agent',
        },
      }
    );
    expect([201, 200, 409]).toContain(res.status());
  });

  test('Non-ADMIN cannot create agent (403)', async ({ request }) => {
    const clientRes = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/auth/login`,
      { data: { phone: TEST_CLIENT.phone, password: TEST_CLIENT.password } }
    );
    const { token: clientToken } = await clientRes.json();

    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/agents`,
      {
        headers: { Authorization: `Bearer ${clientToken}` },
        data: {
          fullName: 'Hack Agent',
          phone:    '+237699888777',
          email:    'hackagent@smartcampost.test',
          password: 'Hack123!Agent',
        },
      }
    );
    expect(res.status()).toBe(403);
  });
});

test.describe('Courier Management — Create', () => {

  test('Admin can navigate to courier management', async ({ page }) => {
    await page.goto('/admin/users/couriers');
    await expect(page).toHaveURL(/\/admin\/users\/couriers/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can create a new COURIER via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.post(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/couriers`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          fullName:          `Test Courier ${TIMESTAMP}`,
          phone:             `+23769904${TIMESTAMP.toString().slice(-5)}`,
          email:             `courier${TIMESTAMP}@smartcampost.test`,
          password:          'Test123!Courier',
          vehicleIdentifier: `VH-${TIMESTAMP}`,
        },
      }
    );
    expect([201, 200, 409]).toContain(res.status());
  });
});

test.describe('Client Management — Read', () => {

  test('Admin can navigate to client management', async ({ page }) => {
    await page.goto('/admin/users/clients');
    await expect(page).toHaveURL(/\/admin\/users\/clients/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin can list all clients via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/clients`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(res.ok()).toBeTruthy();
    const clients = await res.json();
    expect(Array.isArray(clients) || clients.content != null).toBeTruthy();
  });

  test('Admin can filter users by role via API', async ({ request }) => {
    const adminToken = await getAdminToken(request);
    const res = await request.get(
      `${process.env.API_URL ?? 'http://localhost:8082'}/api/admin/users/by-role?role=CLIENT`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('Agency Management', () => {

  test('Admin can navigate to agency management', async ({ page }) => {
    await page.goto('/admin/users/agencies');
    await expect(page).toHaveURL(/\/admin\/users\/agencies/);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Finance/Risk Account Creation Pages', () => {

  test('CreateFinancePage is accessible', async ({ page }) => {
    await page.goto('/admin/finance/create');
    await expect(page).toHaveURL(/\/admin\/finance\/create/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('CreateRiskPage is accessible', async ({ page }) => {
    await page.goto('/admin/risk/create');
    await expect(page).toHaveURL(/\/admin\/risk\/create/);
    await expect(page.locator('body')).toBeVisible();
  });
});
