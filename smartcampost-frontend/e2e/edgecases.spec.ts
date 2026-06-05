/**
 * Edge Cases — Boundary and error condition tests (local infrastructure).
 * Updated from legacy remote-URL tests to use local backend/frontend.
 */
import { test, expect } from '@playwright/test';
import { AUTH_STATE, TEST_CLIENT } from './fixtures/users';
import { apiLogin } from './helpers/api.helpers';

const API = process.env.API_URL ?? 'http://localhost:8082';

test.describe('Edge cases — Input validation', () => {

  test('Invalid login: empty phone returns error', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '', password: 'Test123!' },
    });
    expect([400, 401, 404]).toContain(res.status());
  });

  test('Invalid login: wrong password returns error', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { phone: '+237699000001', password: 'wrong-password' },
    });
    expect([400, 401, 403, 404]).toContain(res.status());
  });

  test('Unauthenticated access to protected endpoint returns 401/403', async ({ request }) => {
    const res = await request.get(`${API}/api/admin/users`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Edge cases — UI boundary conditions', () => {
  test.use({ storageState: AUTH_STATE.client });

  test('Navigating to non-existent route redirects to home', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    // App has a catch-all route that redirects to "/"
    await expect(page).not.toHaveURL(/this-route-does-not-exist-xyz/);
  });

  test('Client tracking page handles empty search', async ({ page }) => {
    await page.goto('/client/tracking');
    await expect(page.locator('body')).toBeVisible();
    // No crash on page load with empty search state
  });
});

test.describe('Edge cases — Parcel operations', () => {

<<<<<<< HEAD
  test('GET non-existent tracking ref returns 404', async ({ request }) => {
    const res = await request.get(`${API}/api/track/SCP-NONEXISTENT-XYZ`);
    expect([404, 400]).toContain(res.status());
  });

  test('POST to invalid parcel UUID returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, '+237699000001', 'Test123!Client');
    const res = await request.get(`${API}/api/parcels/not-a-uuid`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([400, 404]).toContain(res.status());
  });
=======
test("Expired session", async ({ page }) => {
  await page.goto(`${baseURL}/auth/login`);
  // Simulate login, then expire session (mock or manipulate cookie)
  // ...
  await page.goto(`${baseURL}/dashboard`);
  await expect(page.locator("text=Login")).toBeVisible();
>>>>>>> ad71cf4 (Update SmartCAMPOST frontend and mobile modules)
});
