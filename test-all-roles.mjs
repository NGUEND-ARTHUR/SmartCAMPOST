import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:8082/api';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const ROLES = [
  { role: 'CLIENT', phone: '+237655189919', password: 'Arthur@237' },
  { role: 'AGENT', phone: '+237656026865', password: 'QaRole2026!' },
  { role: 'COURIER', phone: '+237655189918', password: 'Courier@237' },
  { role: 'ADMIN', phone: '+237690000000', password: 'Admin@SmartCAMPOST2026' },
  { role: 'STAFF', phone: '+237676026865', password: 'QaRole2026!' },
];

const ROLE_PAGES = {
  CLIENT: [
    { path: '/client', name: 'dashboard' },
    { path: '/client/parcels', name: 'parcels' },
    { path: '/client/parcels/new', name: 'new-parcel' },
    { path: '/client/pickups', name: 'pickups' },
    { path: '/client/map', name: 'map' },
    { path: '/client/tracking', name: 'tracking' },
    { path: '/client/payments', name: 'payments' },
    { path: '/client/invoices', name: 'invoices' },
    { path: '/client/addresses', name: 'addresses' },
    { path: '/client/support', name: 'support' },
    { path: '/client/notifications', name: 'notifications' },
    { path: '/client/settings', name: 'settings' },
  ],
  AGENT: [
    { path: '/agent', name: 'dashboard' },
    { path: '/agent/parcels/new', name: 'new-parcel' },
    { path: '/agent/parcels', name: 'parcels' },
    { path: '/agent/pickups', name: 'pickups' },
    { path: '/agent/map', name: 'map' },
    { path: '/agent/scan', name: 'scan-console' },
    { path: '/agent/tracking', name: 'tracking' },
    { path: '/agent/notifications', name: 'notifications' },
    { path: '/agent/profile', name: 'profile' },
  ],
  COURIER: [
    { path: '/courier', name: 'dashboard' },
    { path: '/courier/pickups', name: 'pickups' },
    { path: '/courier/deliveries', name: 'deliveries' },
    { path: '/courier/map', name: 'map' },
    { path: '/courier/scan', name: 'scan-console' },
    { path: '/courier/tracking', name: 'tracking' },
    { path: '/courier/notifications', name: 'notifications' },
    { path: '/courier/profile', name: 'profile' },
  ],
  ADMIN: [
    { path: '/admin', name: 'dashboard' },
    { path: '/admin/parcels', name: 'parcels' },
    { path: '/admin/pickups', name: 'pickups' },
    { path: '/admin/map', name: 'map' },
    { path: '/admin/tracking', name: 'tracking' },
    { path: '/admin/payments', name: 'payments' },
    { path: '/admin/support', name: 'support' },
    { path: '/admin/notifications', name: 'notifications' },
    { path: '/admin/gps-trackers', name: 'gps-trackers' },
    { path: '/admin/profile', name: 'profile' },
  ],
  STAFF: [
    { path: '/staff', name: 'dashboard' },
    { path: '/staff/parcels', name: 'parcels' },
    { path: '/staff/pickups', name: 'pickups' },
    { path: '/staff/deliveries', name: 'deliveries' },
    { path: '/staff/map', name: 'map' },
    { path: '/staff/tracking', name: 'tracking' },
    { path: '/staff/support', name: 'support' },
    { path: '/staff/scan', name: 'scan-console' },
    { path: '/staff/notifications', name: 'notifications' },
    { path: '/staff/profile', name: 'profile' },
  ],
};

const results = [];

async function loginAndGetToken(phone, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json();
  return data.accessToken || null;
}

async function testRole(browser, roleConfig) {
  const { role, phone, password } = roleConfig;
  console.log(`\n========== ${role} ==========`);

  const token = await loginAndGetToken(phone, password);
  if (!token) {
    console.log(`  LOGIN FAILED for ${phone}`);
    results.push({ role, page: 'LOGIN', status: 'FAIL', error: 'Login failed' });
    return;
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Inject auth token into localStorage
  await page.goto(BASE);
  await page.evaluate((t) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { token: t, user: null },
      version: 0,
    }));
  }, token);

  // Login via the form to set full state
  await page.goto(`${BASE}/auth/login`);
  await page.waitForTimeout(1000);
  await page.fill('input[type="tel"], input[name="phone"], input[placeholder*="phone"], input[placeholder*="Phone"]', phone).catch(() => {});
  await page.fill('input[type="password"]', password).catch(() => {});
  await page.click('button[type="submit"]').catch(() => {});
  await page.waitForTimeout(3000);

  const pages = ROLE_PAGES[role] || [];
  for (const pg of pages) {
    const testResult = { role, page: pg.name, path: pg.path, status: 'PASS', errors: [], buttons: 0, apiErrors: [] };

    // Collect console errors and network failures
    const consoleErrors = [];
    const networkErrors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 100)); });
    page.on('response', (res) => {
      if (res.status() >= 400 && res.url().includes('/api/')) {
        networkErrors.push(`${res.status()} ${res.url().split('/api/')[1]?.substring(0, 60)}`);
      }
    });

    try {
      await page.goto(`${BASE}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() =>
        page.goto(`${BASE}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 })
      );
      await page.waitForTimeout(2000);

      // Check for error states in the page
      const errorText = await page.$eval('.text-destructive, [class*="error"], [class*="Error"]', el => el.textContent).catch(() => null);
      if (errorText && errorText.length > 5) {
        testResult.errors.push(`UI error: ${errorText.substring(0, 80)}`);
      }

      // Count visible buttons
      const buttonCount = await page.$$eval('button, a[role="button"], [role="button"]', els => els.filter(e => e.offsetParent !== null).length).catch(() => 0);
      testResult.buttons = buttonCount;

      // Check for empty/blank page
      const bodyText = await page.$eval('main, [class*="content"], [class*="layout"]', el => el.textContent?.trim()).catch(() => '');
      if (!bodyText || bodyText.length < 10) {
        testResult.errors.push('Page appears blank or empty');
      }

      // Check page is not redirected to login
      const url = page.url();
      if (url.includes('/auth/login') || url === `${BASE}/`) {
        testResult.errors.push(`Redirected to ${url} — access denied or missing route`);
        testResult.status = 'FAIL';
      }

      // Screenshot
      const ssName = `${role.toLowerCase()}-${pg.name}.png`;
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, ssName), fullPage: false });

      if (networkErrors.length > 0) {
        testResult.apiErrors = networkErrors.slice(0, 5);
      }
      if (consoleErrors.length > 3) {
        testResult.errors.push(`${consoleErrors.length} console errors`);
      }

      if (testResult.errors.length > 0 && testResult.status === 'PASS') {
        testResult.status = 'WARN';
      }

    } catch (err) {
      testResult.status = 'FAIL';
      testResult.errors.push(err.message?.substring(0, 100) || 'Unknown error');
    }

    const icon = testResult.status === 'PASS' ? '✅' : testResult.status === 'WARN' ? '⚠️' : '❌';
    const errStr = testResult.errors.length ? ` | ${testResult.errors.join('; ')}` : '';
    const apiStr = testResult.apiErrors.length ? ` | API: ${testResult.apiErrors.join(', ')}` : '';
    console.log(`  ${icon} ${pg.name.padEnd(20)} ${testResult.buttons} btns${errStr}${apiStr}`);
    results.push(testResult);

    // Remove listeners for next page
    page.removeAllListeners('console');
    page.removeAllListeners('response');
  }

  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const roleConfig of ROLES) {
    await testRole(browser, roleConfig);
  }

  await browser.close();

  // Summary
  console.log('\n\n========== SUMMARY ==========');
  const pass = results.filter(r => r.status === 'PASS').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  console.log(`PASS: ${pass}  WARN: ${warn}  FAIL: ${fail}  TOTAL: ${results.length}`);

  if (fail > 0) {
    console.log('\nFAILED:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.role}/${r.page}: ${r.errors.join('; ')}`);
    });
  }
  if (warn > 0) {
    console.log('\nWARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  ⚠️ ${r.role}/${r.page}: ${r.errors.join('; ')} ${r.apiErrors.length ? '| API: ' + r.apiErrors.join(', ') : ''}`);
    });
  }
})();
