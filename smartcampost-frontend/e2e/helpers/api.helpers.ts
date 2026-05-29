/**
 * Direct API helpers for test setup and teardown.
 * Uses Playwright's APIRequestContext (bypasses the browser).
 */

import type { APIRequestContext } from '@playwright/test';
import { ADMIN_USER, MOCK_OTP } from '../fixtures/users';

const API = process.env.API_URL ?? 'http://localhost:8082';

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(
  request: APIRequestContext,
  phone: string,
  password: string,
): Promise<{ token: string; user: Record<string, unknown> }> {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { phone, password },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  const json = await res.json();
  // Backend returns 'accessToken'; normalise to 'token' for callers
  return { ...json, token: json.accessToken ?? json.token };
}

export async function getAdminToken(request: APIRequestContext): Promise<string> {
  const { token } = await apiLogin(request, ADMIN_USER.phone, ADMIN_USER.password);
  return token;
}

// ── Parcel ────────────────────────────────────────────────────────────────────

export async function createTestParcel(
  request: APIRequestContext,
  clientToken: string,
  overrides: Partial<{
    senderAddressId: string;
    recipientAddressId: string;
    weight: number;
    serviceType: 'STANDARD' | 'EXPRESS';
    deliveryOption: 'AGENCY' | 'HOME';
    paymentOption: 'PREPAID' | 'COD';
  }> = {},
): Promise<{ id: string; trackingRef: string }> {
  // First create addresses
  const senderAddr = await createTestAddress(request, clientToken, 'Sender Home');
  const recipientAddr = await createTestAddress(request, clientToken, 'Recipient Office');

  const res = await request.post(`${API}/api/parcels`, {
    headers: { Authorization: `Bearer ${clientToken}` },
    data: {
      senderAddressId:    overrides.senderAddressId    ?? senderAddr.id,
      recipientAddressId: overrides.recipientAddressId ?? recipientAddr.id,
      weight:             overrides.weight             ?? 2.5,
      serviceType:        overrides.serviceType        ?? 'STANDARD',
      deliveryOption:     overrides.deliveryOption     ?? 'AGENCY',
      paymentOption:      overrides.paymentOption      ?? 'PREPAID',
    },
  });
  if (!res.ok()) throw new Error(`Create parcel failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function createTestAddress(
  request: APIRequestContext,
  token: string,
  label: string,
): Promise<{ id: string }> {
  const res = await request.post(`${API}/api/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      label,
      city:    'Yaoundé',
      region:  'Centre',
      country: 'Cameroon',
    },
  });
  if (!res.ok()) throw new Error(`Create address failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

// ── User Management ───────────────────────────────────────────────────────────

export async function freezeUser(
  request: APIRequestContext,
  adminToken: string,
  userId: string,
  reason = 'Test freeze',
): Promise<void> {
  const res = await request.patch(`${API}/api/admin/users/${userId}/freeze`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { frozen: true, reason },
  });
  if (!res.ok()) throw new Error(`Freeze failed: ${res.status()} ${await res.text()}`);
}

export async function unfreezeUser(
  request: APIRequestContext,
  adminToken: string,
  userId: string,
): Promise<void> {
  const res = await request.patch(`${API}/api/admin/users/${userId}/freeze`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { frozen: false },
  });
  if (!res.ok()) throw new Error(`Unfreeze failed: ${res.status()} ${await res.text()}`);
}

export async function getUserByPhone(
  request: APIRequestContext,
  adminToken: string,
  phone: string,
): Promise<{ id: string; phone: string; role: string; frozen: boolean } | null> {
  const res = await request.get(`${API}/api/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  // Spring returns either a plain array or a Page<> object: { content: [], ... }
  const users: Array<{ id: string; phone: string; role: string; frozen: boolean }> =
    Array.isArray(body) ? body : (body.content ?? []);
  return users.find((u) => u.phone === phone) ?? null;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getUnreadCount(
  request: APIRequestContext,
  token: string,
): Promise<number> {
  const res = await request.get(`${API}/api/notifications/me/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return 0;
  const json = await res.json();
  return json.count ?? 0;
}

// ── Risk Alerts ───────────────────────────────────────────────────────────────

export async function createRiskAlert(
  request: APIRequestContext,
  riskToken: string,
  data: { type: string; severity: string; description: string },
): Promise<{ id: string }> {
  const res = await request.post(`${API}/api/risk`, {
    headers: { Authorization: `Bearer ${riskToken}` },
    data,
  });
  if (!res.ok()) throw new Error(`Create risk alert failed: ${res.status()} ${await res.text()}`);
  return res.json();
}
