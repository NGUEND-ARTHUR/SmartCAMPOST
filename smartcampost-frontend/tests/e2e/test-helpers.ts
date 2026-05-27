import { APIRequestContext, Page, expect } from '@playwright/test';

export async function apiCreateUser(request: APIRequestContext, user: { email: string; password: string; name?: string; phone?: string; }) {
  return request.post('/api/auth/register', { data: user });
}

export async function apiLogin(request: APIRequestContext, credentials: { username: string; password: string; }) {
  const response = await request.post('/api/auth/login', { data: credentials });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

export async function setAuthTokenInLocalStorage(page: Page, token: string, userObj: any = null) {
  // Playwright: set localStorage before any page loads
  await page.addInitScript(([key, value]) => {
    localStorage.setItem(key, value);
  }, ['auth-storage', JSON.stringify({ token, user: userObj })]);
}

export async function ensureLoggedIn(request: APIRequestContext, page: Page, credentials: { username: string; password: string; }) {
  const { body } = await apiLogin(request, credentials);
  if (!body || !body.accessToken) {
    throw new Error('Login via API did not return accessToken. Adjust test fixture.');
  }
  await setAuthTokenInLocalStorage(page, body.accessToken, body.user || null);
  return body;
}

export async function expectNotification(page: Page, text: string) {
  // Simple helper: looks for a toast/snackbar containing `text`.
  await expect(page.locator(`text=${text}`)).toBeVisible({ timeout: 5000 });
}
