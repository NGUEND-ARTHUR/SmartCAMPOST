import { test, expect } from '@playwright/test';

const apiURL = 'https://smartcampost-backend.onrender.com/api';

// Backend API tests

test('Authentication endpoints', async ({ request }) => {
  const res = await request.post(`${apiURL}/auth/login`, {
    data: { phone: '+237690000000', password: 'Admin@SmartCAMPOST2026' },
  });
  expect(res.status()).toBe(200);
  expect(res.json()).toHaveProperty('accessToken');
});

test('CRUD endpoints', async ({ request }) => {
  // Example: create parcel
  const res = await request.post(`${apiURL}/parcels`, {
    data: { name: 'Test Parcel', sender: 'Client One' },
  });
  expect(res.status()).toBe(201);
  expect(res.json()).toHaveProperty('id');
});

test('Authorization logic', async ({ request }) => {
  // Try accessing admin endpoint as client
  const res = await request.get(`${apiURL}/admin/users`);
  expect(res.status()).toBe(401);
});

test('Error handling', async ({ request }) => {
  const res = await request.post(`${apiURL}/auth/login`, {
    data: { phone: 'invalid', password: 'wrong' },
  });
  expect(res.status()).toBe(400);
});
