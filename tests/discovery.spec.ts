import { test, expect } from '@playwright/test';

test.describe('Application Discovery', () => {
  test('Explore accessible pages without login and identify login method', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('https://smartcampost-frontend.vercel.app/', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(page.getByText('SmartCAMPOST').first()).toBeVisible();
    await page.screenshot({ path: 'screenshots/discovery-homepage.png' });

    console.log('Exploring navigation links...');
    const navLinks = await page.locator('a').all();
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href && !href.startsWith('http') && !href.includes('login') && !href.includes('register')) {
        console.log(`Found internal link: ${text} (${href})`);
        // You can add more logic here to navigate and screenshot these pages if needed
      }
    }

    console.log('Checking for login elements...');
    const emailInput = await page.locator('input[type="email"]').first();
    const phoneInput = await page.locator('input[type="tel"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button:has-text("Login"), button:has-text("Se connecter")').first();

    if (await emailInput.isVisible()) {
      console.log('Login likely uses email.');
    }
    if (await phoneInput.isVisible()) {
      console.log('Login likely uses phone number.');
    }
    if (await passwordInput.isVisible()) {
      console.log('Password input found.');
    }
    if (await loginButton.isVisible()) {
      console.log('Login button found.');
    }

    await page.screenshot({ path: 'screenshots/discovery-login-elements.png' });
  });
});
