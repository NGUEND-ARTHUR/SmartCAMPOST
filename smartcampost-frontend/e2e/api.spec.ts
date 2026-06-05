import { test, expect } from '@playwright/test';
import { ADMIN_USER } from './fixtures/users';
import { apiLogin } from './helpers/api.helpers';

const API = process.env.API_URL ?? 'http://localhost:8082';

test('Authentication endpoints', async ({ request }) => {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { phone: ADMIN_USER.phone, password: ADMIN_USER.password },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.accessToken).toBeTruthy();
});

test('CRUD endpoints — parcels require CLIENT auth', async ({ request }) => {
  // Unauthenticated POST to /api/parcels should fail (401/403)
  const res = await request.post(`${API}/api/parcels`, {
    data: { name: 'Test Parcel', sender: 'Client One' },
  });
  expect([400, 401, 403]).toContain(res.status());
});

test('Authorization logic — admin endpoint rejects unauthenticated', async ({ request }) => {
  const res = await request.get(`${API}/api/admin/users`);
  expect([401, 403]).toContain(res.status());
});

test('Error handling — invalid login returns error', async ({ request }) => {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { phone: 'invalid-phone', password: 'wrong' },
  });
  expect([400, 401, 404]).toContain(res.status());
});
