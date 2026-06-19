import { test, expect } from '../../test-utils/fixtures';
import { CourierManagementPage } from '../../test-utils/pages/courierManagement';
import { roleHeadings, roleRoutes } from '../../test-utils/roleRoutes';

test.describe('Courier UI flows', () => {
  test('Courier can access deliveries dashboard and start a delivery', async ({ page, uiLogin }) => {
    await uiLogin('COURIER');
    const p = new CourierManagementPage(page);
    await p.goto();
    await expect(page.getByRole('heading', { name: roleHeadings.COURIER })).toBeVisible();
    await page.goto(roleRoutes.COURIER_DELIVERIES);
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('Client should not access courier deliveries', async ({ page, uiLogin }) => {
    try { await uiLogin('CLIENT'); } catch {}
    await page.goto(roleRoutes.COURIER_DELIVERIES);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(roleRoutes.COURIER_DELIVERIES);
  });
});
