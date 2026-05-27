import { test, expect } from '@playwright/test';

test.describe('Courier flows - mocked isolated pages', () => {
  test('Courier accepts assignment and completes delivery (mocked isolated page)', async ({ page }) => {
    // Inject auth for courier
    await page.addInitScript(() =>
      localStorage.setItem('auth-storage', JSON.stringify({ token: 'fake-courier', user: { id: 'courier1', roles: ['COURIER'] } }))
    );

    // Mock assignments API
    await page.route('**/api/deliveries/assigned', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'd1', status: 'PENDING', pickup: {}, delivery: {} }]),
      })
    );

    await page.route('**/api/deliveries/*/accept', (route) => route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }));
    await page.route('**/api/deliveries/*/complete', (route) => route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }));

    const html = `<!doctype html>
    <html>
      <body>
        <h1>Assigned Deliveries</h1>
        <div id="list"></div>
        <div id="status"></div>
        <script>
          async function load() {
            const resp = await fetch('/api/deliveries/assigned');
            const arr = await resp.json();
            const list = document.getElementById('list');
            arr.forEach(d => {
              const row = document.createElement('div');
              row.innerHTML = '<span>Delivery ' + d.id + '</span> <button data-id="' + d.id + '" class="accept">Accept</button>';
              list.appendChild(row);
            });
            document.querySelectorAll('.accept').forEach(btn => btn.addEventListener('click', async (ev) => {
              const id = ev.target.getAttribute('data-id');
              await fetch('/api/deliveries/' + id + '/accept', { method: 'POST' });
              document.getElementById('status').textContent = 'accepted';
              // simulate in-progress -> complete
              await fetch('/api/deliveries/' + id + '/complete', { method: 'POST' });
              document.getElementById('status').textContent = 'Delivery completed';
            }));
          }
          load();
        </script>
      </body>
    </html>`;

    await page.setContent(html);

    const acceptBtn = page.locator('button', { hasText: 'Accept' }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 2000 });
    await acceptBtn.click();
    await expect(page.locator('text=Delivery completed')).toBeVisible({ timeout: 2000 });
  });
});
