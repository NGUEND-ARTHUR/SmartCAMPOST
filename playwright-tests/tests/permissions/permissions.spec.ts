import { test, expect } from '@playwright/test';
import { apiUrl, login, extractToken } from '../../test-utils/api';

const roleCredentials: Record<string, { username: string; password: string } | null> = {
  ADMIN: { username: process.env.TEST_ADMIN_EMAIL || 'admin@smartcampost.cm', password: process.env.TEST_ADMIN_PASSWORD || 'Admin@SmartCAMPOST2026' },
  FINANCE: process.env.TEST_FINANCE_CREDENTIALS ? JSON.parse(process.env.TEST_FINANCE_CREDENTIALS) : null,
  RISK: process.env.TEST_RISK_CREDENTIALS ? JSON.parse(process.env.TEST_RISK_CREDENTIALS) : null,
  STAFF: process.env.TEST_STAFF_CREDENTIALS ? JSON.parse(process.env.TEST_STAFF_CREDENTIALS) : null,
  AGENT: process.env.TEST_AGENT_CREDENTIALS ? JSON.parse(process.env.TEST_AGENT_CREDENTIALS) : null,
  COURIER: process.env.TEST_COURIER_CREDENTIALS ? JSON.parse(process.env.TEST_COURIER_CREDENTIALS) : null,
  CLIENT: process.env.TEST_CLIENT_CREDENTIALS ? JSON.parse(process.env.TEST_CLIENT_CREDENTIALS) : null,
};

test.describe('Permissions matrix smoke checks', () => {
  test('Protected admin endpoint enforces ROLE_ADMIN', async ({ request }) => {
    // Try as anonymous
    const anon = await request.get(apiUrl('/admin/users'));
    expect(anon.status()).toBeGreaterThanOrEqual(401);

    // Try as each available role and assert only admin (if creds provided) works
    for (const [role, creds] of Object.entries(roleCredentials)) {
      if (!creds) continue; // skip if no test creds
      const res = await login(request, creds.username, creds.password);
      const token = await extractToken(res);
      expect(token, `token should exist for ${role}`).toBeTruthy();
      const resp = await request.get(apiUrl('/admin/users'), { headers: { Authorization: `Bearer ${token}` } });
      if (role === 'ADMIN') {
        expect(resp.ok()).toBeTruthy();
      } else {
        expect([401, 403]).toContain(resp.status());
      }
    }
  });
});
