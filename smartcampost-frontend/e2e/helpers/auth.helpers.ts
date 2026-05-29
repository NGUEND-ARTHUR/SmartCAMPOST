/**
 * Authentication helper functions for Playwright tests.
 */

import type { Page } from '@playwright/test';

export interface LoginOptions {
  phone: string;
  password: string;
  expectedDashboard?: string;
}

/**
 * Log in using phone + password via the UI.
 * Waits for redirect to role dashboard.
 */
export async function loginViaUI(
  page: Page,
  options: LoginOptions,
): Promise<void> {
  await page.goto('/auth/login');
  await page.locator('#phoneOrEmail').fill(options.phone);
  await page.locator('#password').fill(options.password);
  await page.locator('button[type="submit"]').click();

  if (options.expectedDashboard) {
    await page.waitForURL(`**${options.expectedDashboard}`, { timeout: 20_000 });
  } else {
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
      timeout: 20_000,
    });
  }
}

/**
 * Log out by clearing auth state (localStorage) and redirecting to login.
 * The app stores auth in localStorage under 'auth-storage'.
 */
export async function logoutViaStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth-storage');
  });
  await page.goto('/auth/login');
}

/**
 * Check that an unauthenticated user is redirected to /auth/login
 * when trying to access a protected route.
 */
export async function expectRedirectToLogin(
  page: Page,
  protectedUrl: string,
): Promise<void> {
  await page.context().clearCookies();
  // Safely clear localStorage — may fail on about:blank (fresh context), which is fine
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* fresh context */ } }).catch(() => {});
  await page.goto(protectedUrl);
  await page.waitForURL('**/auth/login', { timeout: 10_000 });
}

/**
 * Get the stored JWT token from the auth store in localStorage.
 */
export async function getStoredToken(page: Page): Promise<string | null> {
  return page.evaluate<string | null>(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state?.token ?? null;
    } catch {
      return null;
    }
  });
}

/**
 * Get the stored user object from the auth store.
 */
export async function getStoredUser(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate<Record<string, unknown> | null>(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state?.user ?? null;
    } catch {
      return null;
    }
  });
}

/**
 * Fill registration form with OTP captured via route interception.
 * Requires backend to be started with SMARTCAMPOST_OTP_EXPOSE_CODE=true.
 * Returns true if OTP was captured and form was filled; false if OTP unavailable.
 */
export async function fillRegistrationForm(
  page: Page,
  data: {
    fullName: string;
    phone: string;
    email?: string;
    password: string;
    language?: 'EN' | 'FR';
  },
): Promise<boolean> {
  let capturedOtp = '';
  await page.route('**/api/auth/send-otp', async (route) => {
    const response = await route.fetch();
    const body = await response.json().catch(() => ({})) as { otp?: string };
    capturedOtp = body.otp ?? '';
    await route.fulfill({ response });
  });

  await page.goto('/auth/register');

  if (data.language === 'EN') {
    await page.locator('button:has-text("English")').click();
  }

  await page.locator('#fullName').fill(data.fullName);
  await page.locator('#phone').fill(data.phone);
  await page.locator('button:has-text("OTP")').first().click();
  await page.locator('#otp').waitFor({ state: 'visible', timeout: 10_000 });

  if (!capturedOtp) return false;

  await page.locator('#otp').fill(capturedOtp);
  if (data.email) await page.locator('#email').fill(data.email);
  await page.locator('#password').fill(data.password);
  return true;
}
