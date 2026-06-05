import type { APIRequestContext, APIResponse } from '@playwright/test';

const parseJsonSafe = async (res: APIResponse) => {
  try { return await res.json(); } catch { return null; }
};

export const API_BASE_URL = (() => {
  // Prefer an explicit E2E API override, then local dev backend, then any VITE/API env, then remote.
  let raw = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:8082' || process.env.VITE_API_URL || process.env.API_BASE_URL || 'https://smartcampost-backend.onrender.com';
  raw = String(raw).trim();
  // Ensure protocol
  if (!/^https?:\/\//i.test(raw)) raw = `http://${raw}`;
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
})();

export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export async function login(request: APIRequestContext, identifier: string, password: string) {
  // If identifier looks like an email, send it as `email`, otherwise as `phone`.
  const payload: any = identifier.includes('@') ? { email: identifier, password } : { phone: identifier, password };
  const body = JSON.stringify(payload);
  return request.post(apiUrl('/auth/login'), {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function registerClient(request: APIRequestContext, payload: any) {
  const body = JSON.stringify(payload);
  return request.post(apiUrl('/auth/register'), { data: body, headers: { 'Content-Type': 'application/json' } });
}

export async function createStaff(request: APIRequestContext, token: string, payload: any) {
  const body = JSON.stringify(payload);
  return request.post(apiUrl('/staff'), { data: body, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

export async function createUser(request: APIRequestContext, token: string, payload: any) {
  const body = JSON.stringify(payload);
  return request.post(apiUrl('/admin/users'), { data: body, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}
export async function createAgent(request: APIRequestContext, token: string, payload: any) {
  const body = JSON.stringify(payload);
  return request.post(apiUrl('/agents'), { data: body, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

export async function createCourier(request: APIRequestContext, token: string, payload: any) {
  const body = JSON.stringify(payload);
  return request.post(apiUrl('/couriers'), { data: body, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

export async function extractToken(res: APIResponse) {
  const body = await parseJsonSafe(res);
  if (!body) return null;
  return body.token || body.accessToken || body.jwt || body.data?.token || null;
}

export async function waitForApi(request: APIRequestContext, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await request.get(API_BASE_URL);
      if (r && [200, 403, 404].includes(r.status())) return true;
    } catch {}
    await new Promise((res) => setTimeout(res, 500));
  }
  throw new Error(`API not reachable at ${API_BASE_URL}`);
}

export async function getAllUsers(request: APIRequestContext, token?: string) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request.get(apiUrl('/admin/users'), { headers });
}

export async function findUserByEmail(request: APIRequestContext, token: string, email: string) {
  const res = await getAllUsers(request, token);
  const body = await parseJsonSafe(res);
  if (!body) return null;
  const users = body?.data || body;
  return (users || []).find((u: any) => u.email === email || u.phone === email) || null;
}
