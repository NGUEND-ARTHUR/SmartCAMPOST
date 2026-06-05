import { test, expect } from '@playwright/test';
import { AUTH_STATE } from './fixtures/users';

test.describe('UI — Public landing page', () => {

  test('Landing page is accessible and renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/^http:\/\/localhost/);
  });

  test('Landing page has navigation buttons', async ({ page }) => {
    await page.goto('/');
    // Login and Register buttons should be visible on landing
    await expect(
      page.locator('button:has-text("Login"), a:has-text("Login"), button:has-text("Se connecter")').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Register page loads', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('UI — Authenticated navigation', () => {
  test.use({ storageState: AUTH_STATE.admin });

  test('Admin dashboard renders heading or card', async ({ page }) => {
    await page.goto('/admin');
    await expect(
      page.locator('h1, h2, h3, [class*="card"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('UI — Loading states', () => {

  test('Public tracking page renders within timeout', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await page.goto('/tracking');
    await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
  });
});
