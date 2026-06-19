import { test, expect } from '../../test-utils/fixtures';
import { AgentManagementPage } from '../../test-utils/pages/agentManagement';
import { roleHeadings, roleRoutes } from '../../test-utils/roleRoutes';

test.describe('Agent UI flows', () => {
  test('Agent can access dashboard and scan console', async ({ page, uiLogin }) => {
    await uiLogin('AGENT');
    const p = new AgentManagementPage(page);
    await p.goto();
    await expect(page.getByRole('heading', { name: roleHeadings.AGENT })).toBeVisible();
    await page.goto(roleRoutes.AGENT_SCAN);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: roleHeadings.SCAN })).toBeVisible();
  });

  test('Unauthorized users cannot access agent dashboard', async ({ page, uiLogin }) => {
    try { await uiLogin('CLIENT'); } catch {}
    await page.goto(roleRoutes.AGENT);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(roleRoutes.AGENT);
  });
});
