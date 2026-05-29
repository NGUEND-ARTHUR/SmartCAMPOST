/**
 * Global setup: runs once before all test projects.
 *
 * 1. Logs in as ADMIN
 * 2. Creates test accounts for every role (idempotent — skips if phone exists)
 * 3. Logs in as each test user and writes auth state JSON directly (no browser)
 *
 * Auth state is written in Playwright storageState format with Zustand persist
 * layout so that test specs can load it via storageState: AUTH_STATE.xxx.
 *
 * Usage: referenced as the 'setup' project in playwright.config.ts
 */

import { test as setup, type APIRequestContext } from '@playwright/test';
import {
  ADMIN_USER, TEST_CLIENT, TEST_STAFF, TEST_AGENT,
  TEST_COURIER, TEST_FINANCE, TEST_RISK, TEST_FREEZE_TARGET,
  TEST_RESET_USER, AUTH_STATE,
} from './users';
import * as fs from 'fs';
import * as path from 'path';

const API     = process.env.API_URL  ?? 'http://localhost:8082';
const ORIGIN  = process.env.BASE_URL ?? 'http://localhost:5173';

// ── Helper: login via API and return full auth payload ────────────────────────

async function loginViaApi(
  request: APIRequestContext,
  phone: string,
  password: string,
): Promise<{ token: string; userId: string; phone: string; email: string; name: string; role: string }> {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { phone, password },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Login failed for ${phone}: ${res.status()} — ${body}`);
  }
  const json = await res.json();
  return {
    // Backend returns 'accessToken', not 'token'
    token:  json.accessToken ?? json.token ?? '',
    userId: json.userId ?? json.entityId ?? '',
    phone:  json.phone  ?? phone,
    email:  json.email  ?? '',
    name:   json.fullName ?? '',
    role:   json.role   ?? '',
  };
}

// ── Helper: write Playwright storageState from API credentials ────────────────

async function saveApiAuthState(
  request: APIRequestContext,
  phone: string,
  password: string,
  stateFile: string,
): Promise<void> {
  const auth = await loginViaApi(request, phone, password);

  const zustandState = {
    state: {
      user: {
        id:    auth.userId,
        phone: auth.phone,
        email: auth.email,
        name:  auth.name,
        role:  auth.role,
      },
      token:           auth.token,
      isAuthenticated: true,
      isLoading:       false,
    },
    version: 0,
  };

  const storageState = {
    cookies: [],
    origins: [{
      origin: ORIGIN,
      localStorage: [
        { name: 'auth-storage', value: JSON.stringify(zustandState) },
        { name: 'i18nextLng',   value: 'en' },
      ],
    }],
  };

  const dir = path.dirname(stateFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(storageState, null, 2));
}

// ── Helper: create staff user ─────────────────────────────────────────────────

async function createStaffUser(
  request: APIRequestContext,
  adminToken: string,
  user: { fullName: string; phone: string; email: string; password: string; role: string },
): Promise<void> {
  const res = await request.post(`${API}/api/staff`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      fullName: user.fullName,
      phone:    user.phone,
      email:    user.email,
      password: user.password,
      role:     user.role,
    },
  });
  if (!res.ok() && res.status() !== 409) {
    const body = await res.text();
    console.warn(`Warning: Could not create ${user.role} (${user.phone}): ${res.status()} — ${body}`);
  }
}

// ── Helper: create agent user ─────────────────────────────────────────────────

async function createAgentUser(
  request: APIRequestContext,
  adminToken: string,
  user: { fullName: string; phone: string; email: string; password: string },
): Promise<void> {
  const res = await request.post(`${API}/api/agents`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      fullName: user.fullName,
      phone:    user.phone,
      email:    user.email,
      password: user.password,
    },
  });
  if (!res.ok() && res.status() !== 409) {
    const body = await res.text();
    console.warn(`Warning: Could not create agent (${user.phone}): ${res.status()} — ${body}`);
  }
}

// ── Helper: create courier user ───────────────────────────────────────────────

async function createCourierUser(
  request: APIRequestContext,
  adminToken: string,
  user: { fullName: string; phone: string; email: string; password: string },
): Promise<void> {
  const res = await request.post(`${API}/api/couriers`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      fullName:          user.fullName,
      phone:             user.phone,
      email:             user.email,
      password:          user.password,
      vehicleIdentifier: 'TEST-VH-001',
    },
  });
  if (!res.ok() && res.status() !== 409) {
    const body = await res.text();
    console.warn(`Warning: Could not create courier (${user.phone}): ${res.status()} — ${body}`);
  }
}

// ── Helper: register client user via public endpoint ─────────────────────────

async function createClientUser(
  request: APIRequestContext,
  user: { fullName: string; phone: string; email: string; password: string },
): Promise<void> {
  // Step 1: send OTP — backend returns real code when SMARTCAMPOST_OTP_EXPOSE_CODE=true
  const otpRes = await request.post(`${API}/api/auth/send-otp`, {
    data: { phone: user.phone },
  });
  if (!otpRes.ok()) {
    const body = await otpRes.text();
    console.warn(`Warning: send-otp failed for ${user.phone}: ${otpRes.status()} — ${body}`);
    return;
  }
  const otpBody = await otpRes.json().catch(() => ({})) as { otp?: string };
  const otp = otpBody.otp;
  if (!otp) {
    console.warn(
      `⚠️  OTP not in response for ${user.phone}. Start backend with SMARTCAMPOST_OTP_EXPOSE_CODE=true.`
    );
    return;
  }

  // Step 2: register with the real captured OTP
  const res = await request.post(`${API}/api/auth/register`, {
    data: {
      fullName:          user.fullName,
      phone:             user.phone,
      email:             user.email,
      password:          user.password,
      otp,
      preferredLanguage: 'EN',
    },
  });
  if (!res.ok() && res.status() !== 409) {
    const body = await res.text();
    console.warn(`Warning: Could not create client (${user.phone}): ${res.status()} — ${body}`);
  }
}

// ── Main setup test ───────────────────────────────────────────────────────────

setup('create all test users and save auth states', async ({ request }) => {
  // 1. Login as admin via API to get token
  const admin = await loginViaApi(request, ADMIN_USER.phone, ADMIN_USER.password);
  const adminToken = admin.token;

  // 2. Create test users (all idempotent — 409 = already exists, no error)
  await createClientUser(request, TEST_CLIENT);
  await createClientUser(request, TEST_FREEZE_TARGET);
  await createClientUser(request, TEST_RESET_USER);
  await createStaffUser(request, adminToken, { ...TEST_STAFF,   role: 'STAFF'   });
  await createStaffUser(request, adminToken, { ...TEST_FINANCE, role: 'FINANCE' });
  await createStaffUser(request, adminToken, { ...TEST_RISK,    role: 'RISK'    });
  await createAgentUser(request, adminToken, TEST_AGENT);
  await createCourierUser(request, adminToken, TEST_COURIER);

  // 3. Write auth state files directly from API tokens (no browser needed)
  await saveApiAuthState(request, ADMIN_USER.phone,   ADMIN_USER.password,   AUTH_STATE.admin);
  await saveApiAuthState(request, TEST_CLIENT.phone,  TEST_CLIENT.password,  AUTH_STATE.client);
  await saveApiAuthState(request, TEST_STAFF.phone,   TEST_STAFF.password,   AUTH_STATE.staff);
  await saveApiAuthState(request, TEST_AGENT.phone,   TEST_AGENT.password,   AUTH_STATE.agent);
  await saveApiAuthState(request, TEST_COURIER.phone, TEST_COURIER.password, AUTH_STATE.courier);
  await saveApiAuthState(request, TEST_FINANCE.phone, TEST_FINANCE.password, AUTH_STATE.finance);
  await saveApiAuthState(request, TEST_RISK.phone,    TEST_RISK.password,    AUTH_STATE.risk);

  console.log('✅ Global setup complete — all auth states saved');
});
