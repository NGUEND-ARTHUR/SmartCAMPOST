import { test, expect } from '@playwright/test';
import { login, createStaff, createAgent, createCourier, extractToken } from '../../test-utils/api';

test.describe('Admin workflows (API + basic UI checks)', () => {
  test('Admin can login and create staff/agent/courier (happy path)', async ({ request }) => {
    const adminLogin = process.env.TEST_ADMIN_PHONE || process.env.TEST_ADMIN_EMAIL || '+237690000000';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Admin@SmartCAMPOST2026';

    const res = await login(request, adminLogin, adminPassword);
    if (!res.ok()) {
      const txt = await res.text();
      console.log('LOGIN FAILED:', res.status(), txt);
    }
    expect(res.ok()).toBeTruthy();
    const token = await extractToken(res);
    expect(token).toBeTruthy();

    // Create staff (use unique contacts to avoid conflicts across runs)
    const uniq = Date.now().toString().slice(-6);
    const staff = { fullName: 'E2E Staff', phone: `+237690${uniq}`, email: `e2e.staff+${uniq}@example.com`, role: 'STAFF', password: 'Staff@1234' };
    const staffRes = await createStaff(request, token, staff);
    if (!staffRes.ok()) {
      const txt = await staffRes.text();
      console.log('CREATE STAFF FAILED:', staffRes.status(), txt);
    }
    expect(staffRes.ok()).toBeTruthy();
    const staffBody = await staffRes.json();
    expect(staffBody.id || staffBody.entityId).toBeTruthy();

    // Create agent
    const agent = { fullName: 'E2E Agent', phone: `+237690${(parseInt(uniq) + 1)}`, email: `e2e.agent+${uniq}@example.com`, role: 'AGENT', password: 'Agent@1234' };
    const agentRes = await createAgent(request, token, agent);
    expect(agentRes.ok()).toBeTruthy();

    // Create courier
    const courier = { fullName: 'E2E Courier', phone: `+237690${(parseInt(uniq) + 2)}`, email: `e2e.courier+${uniq}@example.com`, role: 'COURIER', password: 'Courier@1234' };
    const courierRes = await createCourier(request, token, courier);
    expect(courierRes.ok()).toBeTruthy();
  });

  test('Admin creation: invalid payloads produce validation errors', async ({ request }) => {
    const adminLogin = process.env.TEST_ADMIN_PHONE || process.env.TEST_ADMIN_EMAIL || '+237690000000';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Admin@SmartCAMPOST2026';
    const res = await login(request, adminLogin, adminPassword);
    const token = await extractToken(res);
    // Missing required fields
    const badStaff = { phone: 'invalid' };
    const badRes = await createStaff(request, token, badStaff);
    expect(badRes.status()).toBeGreaterThanOrEqual(400);
  });

  test('Unauthorized access: non-admin cannot create staff', async ({ request }) => {
    // Attempt create without token
    const staff = { name: 'Bad Staff', phone: '+237690000199', email: 'bad.staff@example.com', role: 'STAFF', password: 'Staff@1234' };
    const res = await createStaff(request, '', staff);
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });
});
