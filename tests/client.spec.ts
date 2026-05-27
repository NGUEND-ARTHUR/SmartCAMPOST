
import { test, expect } from '@playwright/test';

test.describe('Client Role Tests', () => {
  const CLIENT_EMAIL = 'nguend.johann@ictuniversity.edu.cm';
  const CLIENT_PHONE = '+237655189919';
  const CLIENT_PASSWORD = 'Arthur@237';
  const BASE_URL = 'https://smartcampost-frontend.vercel.app/';

  test('1. LOGIN CLIENT', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Attempt to login with phone
    await page.locator('input[name="phone"]').fill(CLIENT_PHONE);
    await page.locator('input[name="password"]').fill(CLIENT_PASSWORD);
    await page.locator('button:has-text("Se connecter")').click();

    // Verify redirection to client dashboard
    await page.waitForURL('**/client');
    await expect(page).toHaveURL(/client/);
    await page.screenshot({ path: 'screenshots/login-client-success.png' });
  });

  test('2. DASHBOARD CLIENT', async ({ page }) => {
    // Assuming already logged in from previous test or fresh login
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="phone"]').fill(CLIENT_PHONE);
    await page.locator('input[name="password"]').fill(CLIENT_PASSWORD);
    await page.locator('button:has-text("Se connecter")').click();
    await page.waitForURL('**/client');

    // Verify dashboard loads and take screenshot
    await expect(page.locator('h1')).toContainText('Dashboard'); // Assuming a Dashboard title
    await page.screenshot({ path: 'screenshots/dashboard-client.png' });

    // Note information displayed (manual observation for now)
    console.log('Client Dashboard loaded. Please manually observe information displayed from the screenshot.');
  });

  test('3. ENVOI DE COLIS', async ({ page }) => {
    // Assuming already logged in
    await page.goto(BASE_URL + 'client/parcels');
    await page.waitForLoadState('networkidle');

    // Look for a button to create a new parcel and click it
    await page.locator('button:has-text("Créer un envoi"), button:has-text("Create Parcel")').click();
    await page.waitForLoadState('networkidle');

    // Fill in dummy data for parcel creation form
    await page.locator('input[name="senderName"]').fill('Client Test');
    await page.locator('input[name="senderPhone"]').fill('+237677123456');
    await page.locator('input[name="receiverName"]').fill('Recipient Test');
    await page.locator('input[name="receiverPhone"]').fill('+237688123456');
    await page.locator('input[name="weight"]').fill('2.5');
    await page.locator('textarea[name="description"]').fill('Test parcel description');
    // Assuming there's a dropdown or similar for origin/destination
    // await page.locator('select[name="origin"]').selectOption('Yaounde');
    // await page.locator('select[name="destination"]').selectOption('Douala');

    // Submit the form
    await page.locator('button:has-text("Soumettre"), button:has-text("Submit")').click();

    // Verify confirmation (e.g., success message or redirection)
    await expect(page.locator('text=Envoi créé avec succès'), 'Expected success message after parcel creation').toBeVisible();
    await page.screenshot({ path: 'screenshots/create-parcel.png' });
  });

  test('4. SUIVI DE COLIS', async ({ page }) => {
    // Assuming already logged in
    await page.goto(BASE_URL + 'client/parcels');
    await page.waitForLoadState('networkidle');

    // Assuming there's a list of parcels and a way to click on one to track it
    // For now, just take a screenshot of the parcels list page
    await page.screenshot({ path: 'screenshots/track-parcel.png' });
    console.log('Parcel Tracking: Navigated to client parcels list. Manual interaction needed to track a specific parcel.');
  });

  test('5. PROFIL CLIENT', async ({ page }) => {
    // Assuming already logged in
    await page.goto(BASE_URL + 'client'); // Go to client dashboard
    await page.waitForLoadState('networkidle');

    // Look for a profile link or button and click it
    // If not found, assume profile info is on the dashboard itself
    const profileLink = page.locator('a:has-text("Profil"), a:has-text("Profile"), a:has-text("Settings")').first();
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify information displayed and take screenshot
    // Assuming user's name or email is displayed on the profile page/dashboard
    await expect(page.locator('text=Arthur Nguend')).toBeVisible(); // Check for client's name
    await page.screenshot({ path: 'screenshots/client-profile.png' });
    console.log('Client Profile loaded. Please manually observe information displayed from the screenshot.');
  });

  test('6. TOUTES LES AUTRES FONCTIONNALITÉS CLIENT', async ({ page }) => {
    // Assuming already logged in
    const clientNavItems = [
      { to: "/client", labelKey: "nav.dashboard" },
      { to: "/client/parcels", labelKey: "nav.myParcels" },
      { to: "/client/map", labelKey: "nav.map" },
      { to: "/client/tracking", labelKey: "nav.tracking" },
      { to: "/client/pickups", labelKey: "nav.pickups" },
      { to: "/client/payments", labelKey: "nav.payments" },
      { to: "/client/support", labelKey: "nav.support" },
    ];

    for (const item of clientNavItems) {
      await page.goto(BASE_URL + item.to);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `screenshots/client-${item.to.replace(/\//g, '-').substring(1)}.png` });
      console.log(`Navigated to ${item.to} and took screenshot.`);
    }
  });

  test('7. LOGOUT CLIENT', async ({ page }) => {
    // Assuming already logged in
    await page.goto(BASE_URL + 'client'); // Go to a client page to ensure logout button is visible
    await page.waitForLoadState('networkidle');

    // Click the logout button
    await page.locator('button:has-text("Déconnexion"), button:has-text("Logout")').click();

    // Verify redirection to login page
    await page.waitForURL('**/auth/login');
    await expect(page).toHaveURL(/auth\/login/);
    await page.screenshot({ path: 'screenshots/logout-client-success.png' });
  });
});
