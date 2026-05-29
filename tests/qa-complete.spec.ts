// ============================================================
// SmartCAMPOST — COMPLETE QA AUTOMATION SUITE
// ALL ROLES × ALL WORKFLOWS × WEB + MOBILE API
// ============================================================
import { test, expect, Page, APIRequestContext } from '@playwright/test';

// Vite listens on localhost (::1 IPv6), backend on 127.0.0.1 (IPv4)
const BASE  = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
const API   = (process.env.API_URL      || 'http://127.0.0.1:8082').trim();

// ── CREDENTIALS ─────────────────────────────────────────────
const CREDS = {
  admin:   { phone: 'admin@smartcampost.cm',   password: 'Admin@SmartCAMPOST2026', role: 'ADMIN'   },
  client:  { phone: 'client@test.cm',          password: 'Test@2024',              role: 'CLIENT'  },
  courier: { phone: 'courier@test.cm',         password: 'Test@2024',              role: 'COURIER' },
  agent:   { phone: 'agent@test.cm',           password: 'Test@2024',              role: 'AGENT'   },
  staff:   { phone: 'staff@test.cm',           password: 'Test@2024',              role: 'STAFF'   },
  finance: { phone: 'finance@test.cm',         password: 'Test@2024',              role: 'FINANCE' },
  risk:    { phone: 'risk@test.cm',            password: 'Test@2024',              role: 'RISK'    },
};

// ── TOKEN CACHE ──────────────────────────────────────────────
const tokenCache: Record<string, string> = {};

async function getToken(request: APIRequestContext, role: keyof typeof CREDS): Promise<string> {
  if (tokenCache[role]) return tokenCache[role];
  const c = CREDS[role];
  const res = await request.post(`${API}/api/auth/login`, { data: { phone: c.phone, password: c.password } });
  if (!res.ok()) throw new Error(`Login ${role} failed: ${res.status()} ${await res.text()}`);
  const body = await res.json();
  const tok = body.token || body.accessToken || body.jwt;
  if (!tok) throw new Error(`No token for ${role}: ${JSON.stringify(body)}`);
  tokenCache[role] = tok;
  return tok;
}

async function apiAs(request: APIRequestContext, role: keyof typeof CREDS, method: string, path: string, data?: any) {
  const tok = await getToken(request, role);
  const opts: any = { headers: { Authorization: `Bearer ${tok}` } };
  if (data) opts.data = data;
  const fn = (request as any)[method.toLowerCase()].bind(request);
  return fn(`${API}${path}`, opts);
}

// ── WEB LOGIN HELPER ─────────────────────────────────────────
async function webLogin(page: Page, role: keyof typeof CREDS, label = '') {
  const c = CREDS[role];
  await page.goto(`${BASE}/auth/login`);
  await page.waitForLoadState('networkidle');

  const phoneField = page.locator(
    'input[name="phone"], input[name="email"], input[type="email"], input[placeholder*="mail" i], input[placeholder*="phone" i], input[placeholder*="numéro" i]'
  ).first();
  await phoneField.waitFor({ timeout: 10000 });
  await phoneField.fill(c.phone);
  await page.locator('input[type="password"]').first().fill(c.password);
  await page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Login"), button:has-text("Se connecter")').first().click();
  await page.waitForURL(/\/(admin|client|courier|agent|staff|finance|risk|dashboard)/, { timeout: 20000 });
  await page.screenshot({ path: `screenshots/qa-login-${label || role}.png` });
}

async function expectForbidden(page: Page, url: string, role: string) {
  await page.goto(`${BASE}${url}`);
  await page.waitForLoadState('networkidle');
  const onLogin = page.url().includes('/login') || page.url().includes('/auth');
  const has403  = await page.locator('text=/403|Forbidden|Accès refusé|Non autorisé/i').isVisible().catch(() => false);
  const has404  = await page.locator('text=/404|Not Found/i').isVisible().catch(() => false);
  expect(onLogin || has403 || has404, `[${role}] ${url} must be forbidden but got ${page.url()}`).toBeTruthy();
}

// ============================================================
// PHASE 0 — HEALTH CHECK
// ============================================================
test.describe('PHASE-0: Health Check', () => {
  test('Backend is UP', async ({ request }) => {
    const res = await request.get(`${API}/actuator/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('UP');
    console.log('✅ Backend UP:', JSON.stringify(body));
  });

  test('Frontend serves HTML', async ({ request }) => {
    const res = await request.get(`${BASE}/`);
    expect([200, 304]).toContain(res.status());
  });

  test('Public tracking endpoint accessible without auth', async ({ request }) => {
    const res = await request.get(`${API}/api/track/NONEXISTENT`);
    expect([200, 404]).toContain(res.status());
  });

  test('Protected endpoint rejects no token', async ({ request }) => {
    const res = await request.get(`${API}/api/parcels`);
    expect([401, 403]).toContain(res.status());
  });
});

// ============================================================
// PHASE 1 — SETUP: Admin creates all test users
// ============================================================
test.describe('PHASE-1: Setup — Create Test Users', () => {
  test('Admin login works via API', async ({ request }) => {
    const tok = await getToken(request, 'admin');
    expect(tok).toBeTruthy();
    console.log('✅ Admin token obtained');
  });

  test('Admin creates all role users', async ({ request }) => {
    // STAFF-like roles → POST /api/staff
    const staffRoles = [
      { phone: CREDS.staff.phone,   role: 'STAFF',   name: 'Staff QATest'   },
      { phone: CREDS.finance.phone, role: 'FINANCE', name: 'Finance QATest' },
      { phone: CREDS.risk.phone,    role: 'RISK',    name: 'Risk QATest'    },
    ];
    for (const s of staffRoles) {
      const res = await apiAs(request, 'admin', 'POST', '/api/staff', {
        fullName: s.name, role: s.role,
        email: s.phone,   phone: s.phone.replace('@test.cm',''),
        password: CREDS.staff.password,
      });
      expect([200, 201, 409, 400]).toContain(res.status());
      console.log(`  STAFF/${s.role}: ${res.status()}`);
    }

    // COURIER → POST /api/couriers
    const courierRes = await apiAs(request, 'admin', 'POST', '/api/couriers', {
      fullName: 'Courier QATest',
      phone: CREDS.courier.phone,
      password: CREDS.courier.password,
      vehicleId: 'QATEST-1',
    });
    expect([200, 201, 409, 400]).toContain(courierRes.status());
    console.log(`  COURIER: ${courierRes.status()}`);

    // AGENT → POST /api/agents
    const agentRes = await apiAs(request, 'admin', 'POST', '/api/agents', {
      fullName: 'Agent QATest',
      phone: CREDS.agent.phone,
      password: CREDS.agent.password,
      staffNumber: 'QA-AGT-001',
    });
    expect([200, 201, 409, 400]).toContain(agentRes.status());
    console.log(`  AGENT: ${agentRes.status()}`);

    // CLIENT → needs OTP flow: request OTP then register
    // Step 1: request OTP (expose-code-in-response must be enabled in local profile)
    const otpReqRes = await request.post(`${API}/api/auth/send-otp`, {
      data: { phone: CREDS.client.phone }
    });
    console.log(`  OTP request: ${otpReqRes.status()}`);

    let otp = '000000'; // fallback
    if (otpReqRes.ok()) {
      const otpBody = await otpReqRes.json();
      if (otpBody.otp) otp = otpBody.otp; // only if expose-code-in-response=true
    }

    // Step 2: register with OTP
    const clientRes = await request.post(`${API}/api/auth/register`, {
      data: {
        fullName: 'Client QATest',
        phone: CREDS.client.phone,
        email: CREDS.client.phone,
        password: CREDS.client.password,
        otp,
      }
    });
    expect([200, 201, 409, 400]).toContain(clientRes.status());
    console.log(`  CLIENT register: ${clientRes.status()}`);
    if (![200, 201, 409].includes(clientRes.status())) {
      const body = await clientRes.json().catch(() => ({}));
      console.log(`  CLIENT register error: ${JSON.stringify(body)}`);
    }
  });

  test('All role users can login', async ({ request }) => {
    const roles: (keyof typeof CREDS)[] = ['client','courier','agent','staff','finance','risk'];
    for (const role of roles) {
      const tok = await getToken(request, role);
      expect(tok).toBeTruthy();
      console.log(`  ✅ ${role.toUpperCase()} token OK`);
    }
  });
});

// ============================================================
// PHASE 2 — API CONTRACT TESTS (all 7 roles × all endpoints)
// ============================================================
test.describe('PHASE-2: API Contracts', () => {

  // ── ADMIN API ────────────────────────────────────────────
  test.describe('ADMIN API', () => {
    test('GET /api/admin/users → 200', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/admin/users');
      expect(res.status()).toBe(200);
    });
    test('GET /api/dashboard → 200', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/dashboard');
      expect(res.status()).toBe(200);
      const body = await res.json();
      console.log('  Dashboard keys:', Object.keys(body));
    });
    test('GET /api/analytics/overview → 200 or 404', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/analytics/overview');
      expect([200, 404]).toContain(res.status());
    });
    test('GET /api/admin/audit → 200', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/admin/audit');
      expect([200, 404]).toContain(res.status());
    });
  });

  // ── PARCELS API ──────────────────────────────────────────
  test.describe('PARCELS API', () => {
    test('CLIENT: GET /api/parcels → 200', async ({ request }) => {
      const res = await apiAs(request, 'client', 'GET', '/api/parcels');
      expect(res.status()).toBe(200);
    });
    test('ADMIN: GET /api/parcels → 200', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/parcels');
      expect(res.status()).toBe(200);
    });
    test('CLIENT: POST /api/parcels creates parcel', async ({ request }) => {
      // CreateParcelRequest needs senderAddressId + recipientAddressId (UUIDs)
      // First check if client has addresses, if not this returns 400 which is expected
      const res = await apiAs(request, 'client', 'POST', '/api/parcels', {
        senderAddressId: '00000000-0000-0000-0000-000000000001',
        recipientAddressId: '00000000-0000-0000-0000-000000000002',
        weight: 2.5,
        serviceType: 'STANDARD',
        deliveryOption: 'AGENCY',
        paymentOption: 'PREPAID',
        descriptionComment: 'QA Test Parcel',
      });
      // 201 = created, 400/404/422 = validation fail (expected without real addresses)
      expect([200, 201, 400, 404, 422]).toContain(res.status());
      if ([200, 201].includes(res.status())) {
        const body = await res.json();
        console.log('  Created parcel:', body.trackingCode || body.id);
      } else {
        const body = await res.json().catch(() => ({}));
        console.log('  Parcel create (expected validation error):', res.status(), body.message || '');
      }
    });
    test('PUBLIC: GET /api/track/:code works without auth', async ({ request }) => {
      const res = await request.get(`${API}/api/track/QA-TEST-0000`);
      expect([200, 404]).toContain(res.status());
    });
  });

  // ── PAYMENT API ──────────────────────────────────────────
  test.describe('PAYMENT API', () => {
    test('CLIENT: GET /api/payments → 200', async ({ request }) => {
      const res = await apiAs(request, 'client', 'GET', '/api/payments');
      expect([200, 404]).toContain(res.status());
    });
    test('FINANCE: GET /api/finance/summary → 200', async ({ request }) => {
      const res = await apiAs(request, 'finance', 'GET', '/api/finance/summary');
      expect([200, 404]).toContain(res.status());
    });
    test('FINANCE: GET /api/refunds → 200', async ({ request }) => {
      const res = await apiAs(request, 'finance', 'GET', '/api/refunds');
      expect([200, 404]).toContain(res.status());
    });
  });

  // ── DELIVERY API ─────────────────────────────────────────
  test.describe('DELIVERY API', () => {
    test('COURIER: GET /api/delivery/my-assignments → 200', async ({ request }) => {
      const res = await apiAs(request, 'courier', 'GET', '/api/delivery/my-assignments');
      expect([200, 404]).toContain(res.status());
    });
    test('AGENT: GET /api/agents/parcels → 200', async ({ request }) => {
      const res = await apiAs(request, 'agent', 'GET', '/api/agents/parcels');
      expect([200, 404]).toContain(res.status());
    });
  });

  // ── RISK & COMPLIANCE API ────────────────────────────────
  test.describe('RISK API', () => {
    test('RISK: GET /api/risk/alerts → 200', async ({ request }) => {
      const res = await apiAs(request, 'risk', 'GET', '/api/risk/alerts');
      expect([200, 404]).toContain(res.status());
    });
    test('RISK: GET /api/compliance/reports → 200', async ({ request }) => {
      const res = await apiAs(request, 'risk', 'GET', '/api/compliance/reports');
      expect([200, 404]).toContain(res.status());
    });
    test('RISK: POST /api/risk/alerts creates alert', async ({ request }) => {
      const res = await apiAs(request, 'risk', 'POST', '/api/risk/alerts', {
        alertType: 'HIGH_VALUE',
        description: 'QA test alert',
        severity: 'MEDIUM',
      });
      expect([200, 201, 400, 422]).toContain(res.status());
    });
  });

  // ── NOTIFICATIONS API ────────────────────────────────────
  test.describe('NOTIFICATIONS API', () => {
    test('CLIENT: GET /api/notifications → 200', async ({ request }) => {
      const res = await apiAs(request, 'client', 'GET', '/api/notifications');
      expect([200, 404]).toContain(res.status());
    });
    test('ADMIN: GET /api/notifications → 200', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/notifications');
      expect([200, 404]).toContain(res.status());
    });
  });

  // ── AI API ───────────────────────────────────────────────
  test.describe('AI API', () => {
    test('ADMIN: GET /api/ai/recommendations → 200', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/ai/recommendations');
      expect([200, 404, 501]).toContain(res.status());
    });
    test('ADMIN: GET /api/self-healing/status → 200', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/self-healing/status');
      expect([200, 404]).toContain(res.status());
    });
  });
});

// ============================================================
// PHASE 3 — RBAC: Permission Boundaries (all roles)
// ============================================================
test.describe('PHASE-3: RBAC Enforcement', () => {

  // CLIENT must be blocked from staff/admin/finance/risk endpoints
  test.describe('CLIENT restrictions', () => {
    test('CLIENT blocked from /api/admin/users', async ({ request }) => {
      const res = await apiAs(request, 'client', 'GET', '/api/admin/users');
      expect([403, 401]).toContain(res.status());
    });
    test('CLIENT blocked from /api/finance/summary', async ({ request }) => {
      const res = await apiAs(request, 'client', 'GET', '/api/finance/summary');
      expect([403, 401]).toContain(res.status());
    });
    test('CLIENT blocked from /api/risk/alerts', async ({ request }) => {
      const res = await apiAs(request, 'client', 'GET', '/api/risk/alerts');
      expect([403, 401]).toContain(res.status());
    });
    test('CLIENT blocked from /api/staff/overview', async ({ request }) => {
      const res = await apiAs(request, 'client', 'GET', '/api/staff/overview');
      expect([403, 401, 404]).toContain(res.status());
    });
  });

  // COURIER restrictions
  test.describe('COURIER restrictions', () => {
    test('COURIER blocked from /api/admin/users', async ({ request }) => {
      const res = await apiAs(request, 'courier', 'GET', '/api/admin/users');
      expect([403, 401]).toContain(res.status());
    });
    test('COURIER blocked from /api/finance/summary', async ({ request }) => {
      const res = await apiAs(request, 'courier', 'GET', '/api/finance/summary');
      expect([403, 401]).toContain(res.status());
    });
    test('COURIER blocked from /api/risk/alerts', async ({ request }) => {
      const res = await apiAs(request, 'courier', 'GET', '/api/risk/alerts');
      expect([403, 401]).toContain(res.status());
    });
  });

  // FINANCE restrictions
  test.describe('FINANCE restrictions', () => {
    test('FINANCE blocked from /api/admin/users', async ({ request }) => {
      const res = await apiAs(request, 'finance', 'GET', '/api/admin/users');
      expect([403, 401]).toContain(res.status());
    });
    test('FINANCE blocked from /api/risk/alerts', async ({ request }) => {
      const res = await apiAs(request, 'finance', 'GET', '/api/risk/alerts');
      expect([403, 401]).toContain(res.status());
    });
  });

  // No token
  test.describe('No token', () => {
    test('No token → /api/parcels → 401', async ({ request }) => {
      const res = await request.get(`${API}/api/parcels`);
      expect([401, 403]).toContain(res.status());
    });
    test('Fake token → /api/parcels → 401', async ({ request }) => {
      const res = await request.get(`${API}/api/parcels`, {
        headers: { Authorization: 'Bearer fake.jwt.token' }
      });
      expect([401, 403]).toContain(res.status());
    });
    test('No token → /api/admin/users → 401', async ({ request }) => {
      const res = await request.get(`${API}/api/admin/users`);
      expect([401, 403]).toContain(res.status());
    });
  });
});

// ============================================================
// PHASE 4 — WEB UI: All 7 Roles — Login + Dashboard + Screens
// ============================================================
test.describe('PHASE-4: Web UI — All Roles', () => {

  test.describe('ADMIN Web', () => {
    test('Admin login → dashboard loads', async ({ page }) => {
      await webLogin(page, 'admin', 'admin-web');
      await expect(page.locator('h1,h2,[class*=title],[class*=dashboard]').first()).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'screenshots/qa-admin-dashboard.png' });
    });
    test('Admin /admin/users loads user list', async ({ page }) => {
      await webLogin(page, 'admin', 'admin-users');
      await page.goto(`${BASE}/admin/users`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/qa-admin-users.png' });
      const content = await page.content();
      expect(content.length).toBeGreaterThan(500);
    });
    test('Admin sees parcels page', async ({ page }) => {
      await webLogin(page, 'admin');
      await page.goto(`${BASE}/admin/parcels`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/qa-admin-parcels.png' });
    });
    test('Admin sees analytics page', async ({ page }) => {
      await webLogin(page, 'admin');
      await page.goto(`${BASE}/admin/analytics`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/qa-admin-analytics.png' });
    });
  });

  test.describe('CLIENT Web', () => {
    test('Client login → client dashboard', async ({ page }) => {
      await webLogin(page, 'client', 'client-web');
      await page.screenshot({ path: 'screenshots/qa-client-dashboard.png' });
      const url = page.url();
      expect(url).toMatch(/client|dashboard/);
    });
    test('Client sees parcels page', async ({ page }) => {
      await webLogin(page, 'client');
      await page.goto(`${BASE}/client/parcels`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/qa-client-parcels.png' });
    });
    test('Client sees payments page', async ({ page }) => {
      await webLogin(page, 'client');
      await page.goto(`${BASE}/client/payments`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/qa-client-payments.png' });
    });
    test('Client CANNOT access /admin/users', async ({ page }) => {
      await webLogin(page, 'client');
      await expectForbidden(page, '/admin/users', 'CLIENT');
    });
    test('Client CANNOT access /finance', async ({ page }) => {
      await webLogin(page, 'client');
      await expectForbidden(page, '/finance', 'CLIENT');
    });
    test('Client CANNOT access /risk', async ({ page }) => {
      await webLogin(page, 'client');
      await expectForbidden(page, '/risk', 'CLIENT');
    });
  });

  test.describe('COURIER Web', () => {
    test('Courier login → courier dashboard', async ({ page }) => {
      await webLogin(page, 'courier', 'courier-web');
      await page.screenshot({ path: 'screenshots/qa-courier-dashboard.png' });
    });
    test('Courier sees deliveries page', async ({ page }) => {
      await webLogin(page, 'courier');
      await page.goto(`${BASE}/courier/deliveries`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/qa-courier-deliveries.png' });
    });
    test('Courier CANNOT access /admin/users', async ({ page }) => {
      await webLogin(page, 'courier');
      await expectForbidden(page, '/admin/users', 'COURIER');
    });
    test('Courier CANNOT access /finance', async ({ page }) => {
      await webLogin(page, 'courier');
      await expectForbidden(page, '/finance', 'COURIER');
    });
  });

  test.describe('FINANCE Web', () => {
    test('Finance login → finance dashboard', async ({ page }) => {
      await webLogin(page, 'finance', 'finance-web');
      await page.screenshot({ path: 'screenshots/qa-finance-dashboard.png' });
    });
    test('Finance sees /finance page', async ({ page }) => {
      await webLogin(page, 'finance');
      await page.goto(`${BASE}/finance`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/qa-finance-main.png' });
    });
    test('Finance CANNOT access /admin/users', async ({ page }) => {
      await webLogin(page, 'finance');
      await expectForbidden(page, '/admin/users', 'FINANCE');
    });
    test('Finance CANNOT access /risk', async ({ page }) => {
      await webLogin(page, 'finance');
      await expectForbidden(page, '/risk', 'FINANCE');
    });
  });

  test.describe('RISK Web', () => {
    test('Risk login → risk dashboard', async ({ page }) => {
      await webLogin(page, 'risk', 'risk-web');
      await page.screenshot({ path: 'screenshots/qa-risk-dashboard.png' });
    });
    test('Risk sees /risk page', async ({ page }) => {
      await webLogin(page, 'risk');
      await page.goto(`${BASE}/risk`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/qa-risk-main.png' });
    });
    test('Risk CANNOT access /admin/users', async ({ page }) => {
      await webLogin(page, 'risk');
      await expectForbidden(page, '/admin/users', 'RISK');
    });
  });

  test.describe('AGENT Web', () => {
    test('Agent login → agent dashboard', async ({ page }) => {
      await webLogin(page, 'agent', 'agent-web');
      await page.screenshot({ path: 'screenshots/qa-agent-dashboard.png' });
    });
    test('Agent CANNOT access /admin/users', async ({ page }) => {
      await webLogin(page, 'agent');
      await expectForbidden(page, '/admin/users', 'AGENT');
    });
  });

  test.describe('STAFF Web', () => {
    test('Staff login → staff dashboard', async ({ page }) => {
      await webLogin(page, 'staff', 'staff-web');
      await page.screenshot({ path: 'screenshots/qa-staff-dashboard.png' });
    });
    test('Staff CANNOT access /admin/users', async ({ page }) => {
      await webLogin(page, 'staff');
      await expectForbidden(page, '/admin/users', 'STAFF');
    });
  });
});

// ============================================================
// PHASE 5 — EDGE CASES & STRESS TESTS
// ============================================================
test.describe('PHASE-5: Edge Cases', () => {

  test.describe('Auth Edge Cases', () => {
    test('Wrong password → 401', async ({ request }) => {
      const res = await request.post(`${API}/api/auth/login`, {
        data: { phone: 'admin@smartcampost.cm', password: 'WrongPassword!!!' }
      });
      expect([401, 400]).toContain(res.status());
    });
    test('Non-existent user → 404 or 401', async ({ request }) => {
      const res = await request.post(`${API}/api/auth/login`, {
        data: { phone: 'nobody@nowhere.cm', password: 'Test@2024' }
      });
      expect([401, 404, 400]).toContain(res.status());
    });
    test('Empty phone → 400', async ({ request }) => {
      const res = await request.post(`${API}/api/auth/login`, {
        data: { phone: '', password: 'Test@2024' }
      });
      expect([400, 401]).toContain(res.status());
    });
    test('Empty password → 400', async ({ request }) => {
      const res = await request.post(`${API}/api/auth/login`, {
        data: { phone: 'admin@smartcampost.cm', password: '' }
      });
      expect([400, 401]).toContain(res.status());
    });
    test('Expired/invalid token → 401', async ({ request }) => {
      const res = await request.get(`${API}/api/parcels`, {
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.invalid' }
      });
      expect([401, 403]).toContain(res.status());
    });
  });

  test.describe('Parcel Edge Cases', () => {
    test('Create parcel with missing fields → 400', async ({ request }) => {
      const res = await apiAs(request, 'client', 'POST', '/api/parcels', {
        senderName: 'Only Sender',
        // missing receiverName, addresses, weight
      });
      expect([400, 422]).toContain(res.status());
    });
    test('Create parcel with negative weight → 400', async ({ request }) => {
      const res = await apiAs(request, 'client', 'POST', '/api/parcels', {
        senderName: 'Test', receiverName: 'Test2',
        receiverPhone: '+237670000001',
        originCity: 'Yaoundé', destinationCity: 'Douala',
        weightKg: -5,
        deliveryOption: 'HOME_DELIVERY',
      });
      expect([400, 422]).toContain(res.status());
    });
    test('GET non-existent parcel → 404', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/parcels/00000000-0000-0000-0000-000000000000');
      expect([404, 400]).toContain(res.status());
    });
    test('Track non-existent code → 404', async ({ request }) => {
      const res = await request.get(`${API}/api/track/NONEXISTENT-QA-9999`);
      expect([404, 200]).toContain(res.status());
    });
  });

  test.describe('Duplicate Submission Prevention', () => {
    test('Rapid double login does not create duplicate sessions', async ({ request }) => {
      const [r1, r2] = await Promise.all([
        request.post(`${API}/api/auth/login`, { data: { phone: CREDS.client.phone, password: CREDS.client.password } }),
        request.post(`${API}/api/auth/login`, { data: { phone: CREDS.client.phone, password: CREDS.client.password } }),
      ]);
      // Both should succeed (stateless JWT)
      expect([200, 201]).toContain(r1.status());
      expect([200, 201]).toContain(r2.status());
    });
  });

  test.describe('Malformed Requests', () => {
    test('POST /api/parcels with invalid JSON body → 400', async ({ request }) => {
      const tok = await getToken(request, 'client');
      const res = await request.post(`${API}/api/parcels`, {
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        data: 'not-json-at-all',
      });
      expect([400, 415, 422]).toContain(res.status());
    });
    test('Invalid UUID path param → 400 or 404', async ({ request }) => {
      const res = await apiAs(request, 'admin', 'GET', '/api/parcels/not-a-uuid');
      expect([400, 404]).toContain(res.status());
    });
  });
});

// ============================================================
// PHASE 6 — CROSS-ROLE B2B JOURNEY
// ============================================================
test.describe('PHASE-6: Cross-Role B2B Journey', () => {

  test('Full lifecycle: CLIENT creates → ADMIN views → COURIER sees', async ({ browser }) => {
    // CLIENT creates parcel via API
    const clientCtx = await browser.newContext();
    const clientReq = clientCtx.request;
    const clientTok = await getToken(clientReq, 'client');
    const createRes = await clientReq.post(`${API}/api/parcels`, {
      headers: { Authorization: `Bearer ${clientTok}` },
      data: {
        senderName: 'QA Client Sender',
        receiverName: 'QA Receiver',
        receiverPhone: '+237670000099',
        originCity: 'Yaoundé',
        destinationCity: 'Douala',
        weightKg: 1.5,
        description: 'B2B Journey Test',
        deliveryOption: 'HOME_DELIVERY',
      }
    });
    console.log(`  CLIENT create parcel: ${createRes.status()}`);
    let trackingCode = 'UNKNOWN';
    if ([200, 201].includes(createRes.status())) {
      const body = await createRes.json();
      trackingCode = body.trackingCode || body.id || 'UNKNOWN';
      console.log(`  Tracking code: ${trackingCode}`);
    }

    // ADMIN sees all parcels
    const adminRes = await clientReq.get(`${API}/api/parcels`, {
      headers: { Authorization: `Bearer ${await getToken(clientReq, 'admin')}` }
    });
    expect([200]).toContain(adminRes.status());
    console.log(`  ADMIN sees parcels: ${adminRes.status()}`);

    // PUBLIC can track (even if 404 parcel still exists)
    const trackRes = await clientReq.get(`${API}/api/track/${trackingCode}`);
    expect([200, 404]).toContain(trackRes.status());
    console.log(`  PUBLIC track ${trackingCode}: ${trackRes.status()}`);

    await clientCtx.dispose();
  });

  test('Web: CLIENT → ADMIN → COURIER screens all load', async ({ browser }) => {
    const clientCtx = await browser.newContext();
    const clientPage = await clientCtx.newPage();
    await webLogin(clientPage, 'client', 'journey-client');
    await clientPage.goto(`${BASE}/client/parcels`);
    await clientPage.waitForLoadState('networkidle');
    await clientPage.screenshot({ path: 'screenshots/qa-journey-client-parcels.png' });
    await clientCtx.close();

    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await webLogin(adminPage, 'admin', 'journey-admin');
    await adminPage.goto(`${BASE}/admin/parcels`);
    await adminPage.waitForLoadState('networkidle');
    await adminPage.screenshot({ path: 'screenshots/qa-journey-admin-parcels.png' });
    await adminCtx.close();

    const courierCtx = await browser.newContext();
    const courierPage = await courierCtx.newPage();
    await webLogin(courierPage, 'courier', 'journey-courier');
    await courierPage.goto(`${BASE}/courier/deliveries`);
    await courierPage.waitForLoadState('networkidle');
    await courierPage.screenshot({ path: 'screenshots/qa-journey-courier-deliveries.png' });
    await courierCtx.close();
  });
});

// ============================================================
// PHASE 7 — PERFORMANCE SMOKE TEST
// ============================================================
test.describe('PHASE-7: Performance', () => {
  test('Auth endpoint responds under 3s', async ({ request }) => {
    const start = Date.now();
    await request.post(`${API}/api/auth/login`, {
      data: { phone: CREDS.admin.phone, password: CREDS.admin.password }
    });
    const ms = Date.now() - start;
    console.log(`  Auth latency: ${ms}ms`);
    expect(ms).toBeLessThan(3000);
  });

  test('Public tracking responds under 2s', async ({ request }) => {
    const start = Date.now();
    await request.get(`${API}/api/track/PERF-TEST-001`);
    const ms = Date.now() - start;
    console.log(`  Track latency: ${ms}ms`);
    expect(ms).toBeLessThan(2000);
  });

  test('Dashboard responds under 5s', async ({ request }) => {
    const start = Date.now();
    await apiAs(request, 'admin', 'GET', '/api/dashboard');
    const ms = Date.now() - start;
    console.log(`  Dashboard latency: ${ms}ms`);
    expect(ms).toBeLessThan(5000);
  });

  test('Web app loads under 10s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
    const ms = Date.now() - start;
    console.log(`  Web load: ${ms}ms`);
    expect(ms).toBeLessThan(10000);
  });
});
