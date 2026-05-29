import { test, expect } from '../../test-utils/fixtures';
import { FinanceDashboardPage } from '../../test-utils/pages/financeDashboard';
import { roleHeadings, roleRoutes } from '../../test-utils/roleRoutes';

test.describe('Finance UI flows', () => {
  test('Finance role can view the finance dashboard', async ({ page, uiLogin }) => {
    await uiLogin('FINANCE');
    const p = new FinanceDashboardPage(page);
    await p.goto();
    await expect(page.getByRole('heading', { name: roleHeadings.FINANCE }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Transactions' })).toBeVisible();
    await expect(page.getByText('No transactions')).toBeVisible();
  });

  test('Non-finance cannot access finance dashboard', async ({ page, uiLogin }) => {
    try { await uiLogin('CLIENT'); } catch {}
    await page.goto(roleRoutes.FINANCE);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(roleRoutes.FINANCE);
  });

  test('Finance role cannot access admin finance create page', async ({ page, uiLogin }) => {
    await uiLogin('FINANCE');
    await page.goto(roleRoutes.ADMIN_FINANCE_CREATE);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(roleRoutes.ADMIN_FINANCE_CREATE);
  });
});
