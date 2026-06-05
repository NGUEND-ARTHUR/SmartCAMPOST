/**
 * Roles — Cross-cutting role-based access tests (local infrastructure).
 * Updated from legacy remote-URL tests to use local backend/frontend.
 */
import { test, expect } from '@playwright/test';
import { AUTH_STATE, ADMIN_USER, TEST_CLIENT } from './fixtures/users';
import { apiLogin } from './helpers/api.helpers';

const API = process.env.API_URL ?? 'http://localhost:8082';

test.describe('Role-based API access', () => {

  test('Admin can login and gets ADMIN role in token', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: ADMIN_USER.phone, password: ADMIN_USER.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.role).toBe('ADMIN');
  });

  test('Client role is set correctly in login response', async ({ request }) => {
    // apiLogin returns flat response — role is at top level, not nested under user
    const result = await apiLogin(request, TEST_CLIENT.phone, TEST_CLIENT.password);
    expect((result as Record<string, unknown>).role).toBe('CLIENT');
  });

  test('Guest (unauthenticated) cannot access /admin dashboard route', async ({
    page,
  }) => {
    await page.goto('/admin');
    // Unauthenticated user is redirected to login
    await expect(page).not.toHaveURL(/^http.*\/admin$/);
  });

  test('Guest cannot access /client route', async ({ page }) => {
    await page.goto('/client');
    await expect(page).not.toHaveURL(/^http.*\/client$/);
  });
});

test.describe('Role-based UI access — CLIENT', () => {
  test.use({ storageState: AUTH_STATE.client });

  test('CLIENT can access /client dashboard', async ({ page }) => {
    await page.goto('/client');
    await expect(page).toHaveURL(/\/client/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('CLIENT is redirected away from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/^http.*\/admin$/);
  });
});
test.describe('Role-based UI access — ADMIN', () => {
  test.use({ storageState: AUTH_STATE.admin });

  test('ADMIN can access /admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('body')).toBeVisible();
  });
});
