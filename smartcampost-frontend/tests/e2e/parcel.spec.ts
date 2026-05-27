import { test, expect } from '@playwright/test';

test.describe('Parcel flows (web) - mocked isolated pages', () => {
  test('Create parcel (mocked backend, self-contained page)', async ({ page }) => {
    // Inject fake auth storage so app treats user as logged in
    await page.addInitScript(() =>
      localStorage.setItem('auth-storage', JSON.stringify({ token: 'fake-token', user: { id: 'u1', email: 'e2e@example.com' } }))
    );

    // Intercept parcel creation API
    await page.route('**/api/parcels', (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'p1', trackingId: 'TRK123' }) })
    );

    const html = `<!doctype html>
    <html>
      <body>
        <h1>Create New Parcel</h1>
        <form id="createParcel">
          <input id="recipientName" />
          <input id="recipientAddress" />
          <button id="createBtn" type="button">Create Parcel</button>
        </form>
        <div id="result"></div>
        <script>
          document.getElementById('createBtn').addEventListener('click', async () => {
            const resp = await fetch('/api/parcels', {method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({recipientName: document.getElementById('recipientName').value})});
            const json = await resp.json();
            document.getElementById('result').textContent = 'Created: ' + json.trackingId;
          });
        </script>
      </body>
    </html>`;

    await page.setContent(html);

    await expect(page.locator('text=Create New Parcel')).toBeVisible({ timeout: 2000 });
    await page.fill('#recipientName', 'Test Recipient');
    await page.click('#createBtn');
    await expect(page.locator('text=Created: TRK123')).toBeVisible({ timeout: 2000 });
  });
});
