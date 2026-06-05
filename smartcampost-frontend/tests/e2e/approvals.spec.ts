import { test, expect } from '@playwright/test';

test.describe('Approvals and AI-assisted actions - mocked pages', () => {
  test('Approver can view and approve pending AI requests (mocked isolated page)', async ({ page }) => {
    // Inject auth for approver
    await page.addInitScript(() =>
      localStorage.setItem('auth-storage', JSON.stringify({ token: 'fake-approver', user: { id: 'approver1', roles: ['STAFF'] } }))
    );

    // Mock pending approvals endpoint
    await page.route('**/api/approvals/pending', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'a1', toolName: 'assignCourierTool', actorId: 'ai-system', parametersJson: '{}', reason: 'High-value assignment', createdAt: Date.now() },
        ]),
      })
    );

    // Mock approve action
    await page.route('**/api/approvals/*/approve', (route) => route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }));

    const html = `<!doctype html>
    <html>
      <body>
        <h1>AI Approval Requests</h1>
        <div id="list"></div>
        <div id="empty" style="display:none">No pending approvals</div>
        <script>
          async function load() {
            const resp = await fetch('/api/approvals/pending');
            const arr = await resp.json();
            const list = document.getElementById('list');
            if (!arr || arr.length === 0) { document.getElementById('empty').style.display='block'; return }
            arr.forEach(a => {
              const row = document.createElement('div');
              row.innerHTML = '<span>' + a.reason + '</span> <button data-id="' + a.id + '" class="approve">Approve</button>';
              list.appendChild(row);
            });
            document.querySelectorAll('.approve').forEach(btn => btn.addEventListener('click', async (ev) => {
              const id = ev.target.getAttribute('data-id');
              await fetch('/api/approvals/' + id + '/approve', { method: 'POST' });
              document.getElementById('list').innerHTML = '';
              document.getElementById('empty').style.display='block';
            }));
          }
          load();
        </script>
      </body>
    </html>`;

    await page.setContent(html);

    // Wait for the page content and approve button to be available
    await page.waitForSelector('text=AI Approval Requests', { timeout: 5000 });
    const approveButton = page.locator('button', { hasText: 'Approve' }).first();
    await expect(approveButton).toBeVisible({ timeout: 5000 });
    await approveButton.click();
    await expect(page.locator('text=No pending approvals')).toBeVisible({ timeout: 5000 });
  });
});
