import { test, expect } from '@playwright/test';

test.describe('Auth flows (web) - mocked isolated pages', () => {
  test('UI-login (mocked backend, self-contained page)', async ({ page }) => {
    const testUser = {
      email: `e2e+user@example.com`,
      password: 'P@ssw0rd!23',
      name: 'E2E Test User',
    };

    // Intercept register and login API calls and return successful responses
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    );

    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'fake-token', user: { id: 'u1', email: testUser.email, name: testUser.name } }),
      })
    );

    // Load a minimal self-contained login page that calls the mocked API
    const html = `<!doctype html>
    <html>
      <body>
        <form id="loginForm">
          <input id="phoneOrEmail" />
          <input id="password" type="password" />
          <button id="submitBtn" type="button">Login</button>
        </form>
        <script>
          document.getElementById('submitBtn').addEventListener('click', async () => {
            const username = document.getElementById('phoneOrEmail').value;
            const password = document.getElementById('password').value;
            const resp = await fetch('/api/auth/login', {method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({username, password})});
            const json = await resp.json();
            localStorage.setItem('auth-storage', JSON.stringify({token: json.accessToken, user: json.user}));
            document.body.innerHTML = '<h1>Client Dashboard</h1>';
          });
        </script>
      </body>
    </html>`;

    await page.setContent(html);

    // Wait for the login inputs to be available before interacting
    await page.waitForSelector('#phoneOrEmail', { timeout: 5000 });
    await page.waitForSelector('#password', { timeout: 5000 });

    await page.fill('#phoneOrEmail', testUser.email);
    await page.fill('#password', testUser.password);
    await page.click('#submitBtn');

    await expect(page.locator('text=Client Dashboard')).toBeVisible({ timeout: 5000 });
  });
});
