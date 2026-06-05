import { test, expect } from '../../test-utils/fixtures';
import { RiskDashboardPage } from '../../test-utils/pages/riskDashboard';
import { roleHeadings, roleRoutes } from '../../test-utils/roleRoutes';

test.describe('Risk UI flows', () => {
  test('Risk role can view the risk dashboard', async ({ page, uiLogin }) => {
    await uiLogin('RISK');
    const p = new RiskDashboardPage(page);
    await p.goto();
    await expect(page.getByRole('heading', { name: roleHeadings.RISK }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Transactions' })).toBeVisible();
    await expect(page.getByText('No risk alerts')).toBeVisible();
  });

  test('Unauthorized users cannot access risk dashboard', async ({ page, uiLogin }) => {
    try { await uiLogin('CLIENT'); } catch {}
    await page.goto(roleRoutes.RISK);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(roleRoutes.RISK);
  });

  test('Risk role cannot access admin risk create page', async ({ page, uiLogin }) => {
    await uiLogin('RISK');
    await page.goto(roleRoutes.ADMIN_RISK_CREATE);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(roleRoutes.ADMIN_RISK_CREATE);
  });
});
