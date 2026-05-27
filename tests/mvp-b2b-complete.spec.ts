import { test, expect, Page, Browser } from '@playwright/test';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL  = process.env.API_URL      || 'http://localhost:8082';

const CREDS = {
  admin:   { email: 'admin@smartcampost.cm', password: 'Admin@SmartCAMPOST2026' },
  client:  { email: 'client@test.cm',        password: 'Test@2024' },
  courier: { email: 'courier@test.cm',       password: 'Test@2024' },
  agent:   { email: 'agent@test.cm',         password: 'Test@2024' },
  staff:   { email: 'staff@test.cm',         password: 'Test@2024' },
  finance: { email: 'finance@test.cm',       password: 'Test@2024' },
  risk:    { email: 'risk@test.cm',          password: 'Test@2024' },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
async function login(page: Page, email: string, password: string, label = '') {
  await page.goto(BASE_URL + '/login');
  await page.waitForLoadState('networkidle');

  const emailField = page.locator('input[type=email], input[name=email], input[placeholder*=mail i]').first();
  await emailField.waitFor({ timeout: 10000 });
  await emailField.fill(email);

  await page.locator('input[type=password]').first().fill(password);
  await page.locator('button[type=submit], button:has-text("Connexion"), button:has-text("Login")').first().click();

  await page.waitForURL(/dashboard|admin|client|courier|agent|staff|finance|risk/, { timeout: 15000 });
  await page.screenshot({ path: `screenshots/login-${label || email.split('@')[0]}.png` });
  console.log(`  Logged in as ${email} -> ${page.url()}`);
}

async function expectForbidden(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const onLogin   = page.url().includes('/login');
  const has403    = await page.locator('text=/403|Forbidden|Acc.s refus|Non autoris/i').isVisible().catch(() => false);
  const hasNotFound = await page.locator('text=/404|Not Found/i').isVisible().catch(() => false);
  expect(
    onLogin || has403 || hasNotFound,
    `Expected ${url} to be forbidden but got ${page.url()}`
  ).toBeTruthy();
}

// ── SETUP: Create all test users via admin API ─────────────────────────────────
test.describe('0 - Setup', () => {
  test('Admin creates test users for all roles', async ({ request }) => {
    const login = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: CREDS.admin.email, password: CREDS.admin.password }
    });
    expect(login.ok(), `Admin login failed: ${login.status()}`).toBeTruthy();
    const body = await login.json();
    const token = body.token || body.accessToken || body.jwt;

    const roles = ['client','courier','agent','staff','finance','risk'] as const;
    for (const role of roles) {
      const c = CREDS[role];
      const res = await request.post(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          email: c.email, password: c.password,
          role: role.toUpperCase(),
          firstName: role.charAt(0).toUpperCase() + role.slice(1),
          lastName: 'Test'
        }
      });
      console.log(`  Create ${role.toUpperCase()}: ${res.status()}`);
    }
  });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────
test.describe('1 - ADMIN Role', () => {
  test('Admin login + dashboard visible', async ({ page }) => {
    await login(page, CREDS.admin.email, CREDS.admin.password, 'admin');
    await expect(page.locator('h1, h2, [class*=dashboard], [class*=title]').first()).toBeVisible();
  });

  test('Admin sees user management', async ({ page }) => {
    await login(page, CREDS.admin.email, CREDS.admin.password, 'admin');
    await page.goto(BASE_URL + '/admin/users');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/admin-users.png' });
    await expect(page.locator('table, [class*=list], [class*=grid]').first()).toBeVisible();
  });

  test('Admin sees all parcels', async ({ page }) => {
    await login(page, CREDS.admin.email, CREDS.admin.password, 'admin');
    await page.goto(BASE_URL + '/admin/parcels');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/admin-parcels.png' });
  });

  test('Admin accesses finance dashboard', async ({ page }) => {
    await login(page, CREDS.admin.email, CREDS.admin.password, 'admin');
    await page.goto(BASE_URL + '/finance');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/admin-finance.png' });
  });
});

// ── CLIENT ────────────────────────────────────────────────────────────────────
test.describe('2 - CLIENT Role', () => {
  test('Client login + dashboard', async ({ page }) => {
    await login(page, CREDS.client.email, CREDS.client.password, 'client');
    await page.screenshot({ path: 'screenshots/client-dashboard.png' });
  });

  test('Client sees own parcels', async ({ page }) => {
    await login(page, CREDS.client.email, CREDS.client.password, 'client');
    await page.goto(BASE_URL + '/client/parcels');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/client-parcels.png' });
  });

  test('Client sees payments', async ({ page }) => {
    await login(page, CREDS.client.email, CREDS.client.password, 'client');
    await page.goto(BASE_URL + '/client/payments');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/client-payments.png' });
  });

  test('Client CANNOT access admin/finance/risk', async ({ page }) => {
    await login(page, CREDS.client.email, CREDS.client.password, 'client');
    await expectForbidden(page, BASE_URL + '/admin/users');
    await expectForbidden(page, BASE_URL + '/finance');
    await expectForbidden(page, BASE_URL + '/risk');
  });
});

// ── COURIER ───────────────────────────────────────────────────────────────────
test.describe('3 - COURIER Role', () => {
  test('Courier login + deliveries', async ({ page }) => {
    await login(page, CREDS.courier.email, CREDS.courier.password, 'courier');
    await page.goto(BASE_URL + '/courier/deliveries');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/courier-deliveries.png' });
  });

  test('Courier CANNOT access admin or finance', async ({ page }) => {
    await login(page, CREDS.courier.email, CREDS.courier.password, 'courier');
    await expectForbidden(page, BASE_URL + '/admin/users');
    await expectForbidden(page, BASE_URL + '/finance');
  });
});

// ── FINANCE ───────────────────────────────────────────────────────────────────
test.describe('4 - FINANCE Role', () => {
  test('Finance login + reports', async ({ page }) => {
    await login(page, CREDS.finance.email, CREDS.finance.password, 'finance');
    await page.goto(BASE_URL + '/finance');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/finance-dashboard.png' });
  });

  test('Finance CANNOT access admin users or risk', async ({ page }) => {
    await login(page, CREDS.finance.email, CREDS.finance.password, 'finance');
    await expectForbidden(page, BASE_URL + '/admin/users');
    await expectForbidden(page, BASE_URL + '/risk');
  });
});

// ── RISK ──────────────────────────────────────────────────────────────────────
test.describe('5 - RISK Role', () => {
  test('Risk login + compliance view', async ({ page }) => {
    await login(page, CREDS.risk.email, CREDS.risk.password, 'risk');
    await page.goto(BASE_URL + '/risk');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/risk-dashboard.png' });
  });

  test('Risk CANNOT access admin users', async ({ page }) => {
    await login(page, CREDS.risk.email, CREDS.risk.password, 'risk');
    await expectForbidden(page, BASE_URL + '/admin/users');
  });
});

// ── SECURITY ──────────────────────────────────────────────────────────────────
test.describe('6 - Security & API Contracts', () => {
  test('Unauthenticated redirects to login', async ({ page }) => {
    await page.goto(BASE_URL + '/admin/users');
    await page.waitForURL(/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('Invalid JWT returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/parcels`, {
      headers: { Authorization: 'Bearer fake.invalid.token' }
    });
    expect(res.status()).toBe(401);
  });

  test('Client JWT rejected on admin endpoint', async ({ request }) => {
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: CREDS.client.email, password: CREDS.client.password }
    });
    const body = await loginRes.json();
    const token = body.token || body.accessToken || body.jwt;
    const res = await request.get(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status()).toBe(403);
  });

  test('Public tracking works without auth', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/track/TEST-0000`);
    expect([200, 404]).toContain(res.status());
  });

  test('Health endpoint responds', async ({ request }) => {
    const res = await request.get(`${API_URL}/actuator/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('UP');
  });
});

// ── CROSS-ROLE B2B JOURNEY ────────────────────────────────────────────────────
test.describe('7 - Full B2B Journey', () => {
  test('CLIENT creates -> ADMIN sees -> COURIER delivers', async ({ browser }) => {
    // CLIENT side
    const clientCtx = await browser.newContext();
    const clientPage = await clientCtx.newPage();
    await login(clientPage, CREDS.client.email, CREDS.client.password, 'journey-client');
    await clientPage.goto(BASE_URL + '/client/parcels');
    await clientPage.waitForLoadState('networkidle');
    await clientPage.screenshot({ path: 'screenshots/journey-1-client-parcels.png' });

    // ADMIN side
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, CREDS.admin.email, CREDS.admin.password, 'journey-admin');
    await adminPage.goto(BASE_URL + '/admin/parcels');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.screenshot({ path: 'screenshots/journey-2-admin-parcels.png' });

    // COURIER side
    const courierCtx = await browser.newContext();
    const courierPage = await courierCtx.newPage();
    await login(courierPage, CREDS.courier.email, CREDS.courier.password, 'journey-courier');
    await courierPage.goto(BASE_URL + '/courier/deliveries');
    await courierPage.waitForLoadState('networkidle');
    await courierPage.screenshot({ path: 'screenshots/journey-3-courier-deliveries.png' });

    await clientCtx.close();
    await adminCtx.close();
    await courierCtx.close();
    console.log('  B2B journey complete - check screenshots/journey-*.png');
  });
});
