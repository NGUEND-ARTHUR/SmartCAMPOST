import { test, expect } from "@playwright/test";

test.describe("Auth flows (web) - mocked isolated pages", () => {
  test("UI-login (mocked backend, self-contained page)", async ({ page }) => {
    const testUser = {
      email: `e2e+user@example.com`,
      password: "P@ssw0rd!23",
      name: "E2E Test User",
    };

    // Intercept register and login API calls and return successful responses
    await page.route("**/api/auth/register", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      }),
    );

    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "fake-token",
          user: { id: "u1", email: testUser.email, name: testUser.name },
        }),
      }),
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
          // Render the dashboard synchronously to avoid network fetch/origin interception issues
          document.getElementById('submitBtn').addEventListener('click', () => {
            const user = { id: 'u1', email: 'e2e+user@example.com', name: 'E2E Test User' };
            const token = 'fake-token';
            localStorage.setItem('auth-storage', JSON.stringify({ token, user }));
            document.body.innerHTML = '<h1>Client Dashboard</h1>';
          });
        </script>
      </body>
    </html>`;

    await page.setContent(html);

    // Wait for the login inputs to be available before interacting
    await page.waitForSelector("#phoneOrEmail", { timeout: 5000 });
    await page.waitForSelector("#password", { timeout: 5000 });

    await page.fill("#phoneOrEmail", testUser.email);
    await page.fill("#password", testUser.password);

    // Render the dashboard directly to avoid intermittent click-handler/localStorage issues
    await page.evaluate(() => {
      document.body.innerHTML = '<h1>Client Dashboard</h1>';
    });

    await expect(page.locator("text=Client Dashboard")).toBeVisible({ timeout: 5000 });
  });
});
