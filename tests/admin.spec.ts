
import { test, expect } from '@playwright/test';

test.describe('Admin Role Tests', () => {
  const ADMIN_EMAIL = 'admin@smartcampost.cm';
  const ADMIN_PHONE = '+237690000000';
  const ADMIN_PASSWORD = 'Admin@SmartCAMPOST2026';
  const BASE_URL = 'https://smartcampost-frontend.vercel.app/';

  test('1. LOGIN ADMIN', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Attempt to login with phone
    await page.locator('input[name="phone"]').fill(ADMIN_PHONE);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button:has-text("Se connecter")').click();

    // Verify redirection to admin dashboard
    await page.waitForURL('**/admin');
    await expect(page).toHaveURL(/admin/);
    await page.screenshot({ path: 'screenshots/login-admin-success.png' });
  });

  test('2. DASHBOARD ADMIN', async ({ page }) => {
    // Assuming already logged in from previous test or fresh login
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="phone"]').fill(ADMIN_PHONE);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.locator('button:has-text("Se connecter")').click();
    await page.waitForURL('**/admin');

    // Verify dashboard loads and take screenshot
    await expect(page.locator('h1')).toContainText('Dashboard'); // Assuming a Dashboard title
    await page.screenshot({ path: 'screenshots/dashboard-admin.png' });

    // Note widgets/statistics (this part is manual observation for now)
    console.log('Admin Dashboard loaded. Please manually observe widgets/statistics from the screenshot.');
  });

  test('3. GESTION DES UTILISATEURS (Client Management)', async ({ page }) => {
    // Assuming already logged in
    await page.goto(BASE_URL + 'admin/users/clients');
    await page.waitForLoadState('networkidle');

    // Verify page loads and take screenshot
    await expect(page.locator('h1')).toContainText('Client Management'); // Assuming a title for the page
    await page.screenshot({ path: 'screenshots/users-list.png' });

    // Placeholder for search/filtering tests
    console.log('User Management (Client Management) loaded. Implement search/filtering tests here if needed.');
  });

  test('4. GESTION DES COLIS/ENVOIS', async ({ page }) => {
    // Assuming already logged in
    await page.goto(BASE_URL + 'admin/parcels');
    await page.waitForLoadState('networkidle');

    // Verify page loads and take screenshot
    await expect(page.locator('h1')).toContainText('Parcels'); // Assuming a title for the page
    await page.screenshot({ path: 'screenshots/parcels-admin.png' });

    // Placeholder for filter by status tests
    console.log('Parcel Management loaded. Implement filter by status tests here if needed.');
  });

  test('5. TOUTES LES AUTRES FONCTIONNALITÉS ADMIN', async ({ page }) => {
    // Assuming already logged in
    const adminNavItems = [
      { to: "/admin", labelKey: "nav.dashboard" },
      { to: "/admin/map", labelKey: "nav.map" },
      { to: "/admin/parcels", labelKey: "nav.parcels" },
      { to: "/admin/tracking", labelKey: "nav.tracking" },
      { to: "/admin/scan", labelKey: "nav.scanConsole" },
      { to: "/admin/staff", labelKey: "nav.staffDashboard" },
      { to: "/admin/users/staff", labelKey: "nav.staffManagement" },
      { to: "/admin/users/agents", labelKey: "nav.agentManagement" },
      { to: "/admin/users/couriers", labelKey: "nav.courierManagement" },
      { to: "/admin/users/agencies", labelKey: "nav.agencyManagement" },
      { to: "/admin/users/clients", labelKey: "nav.clientManagement" },
      { to: "/admin/tariffs", labelKey: "nav.tariffManagement" },
      { to: "/admin/integrations", labelKey: "nav.integrations" },
      { to: "/admin/accounts", labelKey: "nav.userAccounts" },
      { to: "/admin/self-healing", labelKey: "nav.selfHealing" },
      { to: "/admin/notifications", labelKey: "nav.notifications" },
      { to: "/admin/analytics", labelKey: "nav.analytics" },
    ];

    for (const item of adminNavItems) {
      await page.goto(BASE_URL + item.to);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `screenshots/admin-${item.to.replace(/\//g, '-').substring(1)}.png` });
      console.log(`Navigated to ${item.to} and took screenshot.`);
    }
  });

  test('6. LOGOUT ADMIN', async ({ page }) => {
    // Assuming already logged in
    await page.goto(BASE_URL + 'admin'); // Go to an admin page to ensure logout button is visible
    await page.waitForLoadState('networkidle');

    // Click the logout button
    await page.locator('button:has-text("Déconnexion"), button:has-text("Logout")').click();

    // Verify redirection to login page
    await page.waitForURL('**/auth/login');
    await expect(page).toHaveURL(/auth\/login/);
    await page.screenshot({ path: 'screenshots/logout-admin-success.png' });
  });
});
