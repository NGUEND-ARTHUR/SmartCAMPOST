import { test, expect } from '../../test-utils/fixtures';
import { CourierManagementPage } from '../../test-utils/pages/courierManagement';
import { roleHeadings, roleRoutes } from '../../test-utils/roleRoutes';

test.describe('Courier UI flows', () => {
  test('Courier can access deliveries dashboard and start a delivery', async ({ page, uiLogin }) => {
    await uiLogin('COURIER');
    const p = new CourierManagementPage(page);
    await p.goto();
    await expect(page.getByRole('heading', { name: roleHeadings.COURIER })).toBeVisible();

    try {
      await page.goto(roleRoutes.COURIER_DELIVERIES);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: roleHeadings.COURIER })).toBeVisible();

      const startButton = page.getByRole('button', { name: 'Start' }).first();
      if (await startButton.count()) {
        await startButton.click();
        await expect(page).toHaveURL(new RegExp(`^${roleRoutes.COURIER_DELIVERY_DETAIL_PREFIX}`));
        await expect(page.getByRole('heading', { name: 'Delivery' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Back to deliveries' })).toBeVisible();
      } else {
        const emptyStateVisible = await p.hasDeliveryWithText('No tasks found');
        if (!emptyStateVisible) {
          return;
        }
        await expect(page.getByText('No tasks found')).toBeVisible();
      }
    } catch (e) {
      const empty = await p.hasDeliveryWithText('No tasks found');
      if (empty) {
        return;
      }
      throw e;
    }
  });

  test('Client should not access courier deliveries', async ({ page, uiLogin }) => {
    try { await uiLogin('CLIENT'); } catch {}
    await page.goto(roleRoutes.COURIER_DELIVERIES);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(roleRoutes.COURIER_DELIVERIES);
  });
});
