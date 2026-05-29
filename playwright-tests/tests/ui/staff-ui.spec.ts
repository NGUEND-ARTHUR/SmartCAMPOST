import { test, expect } from '../../test-utils/fixtures';
import { StaffManagementPage } from '../../test-utils/pages/staffManagement';
import { roleHeadings, roleRoutes } from '../../test-utils/roleRoutes';

test.describe('Staff UI flows', () => {
  test('Staff can view the staff dashboard but not admin account management', async ({ page, uiLogin }) => {
    await uiLogin('STAFF');
    const p = new StaffManagementPage(page);
    await p.goto();
    await expect(page.getByRole('heading', { name: roleHeadings.STAFF }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();

    await page.goto(roleRoutes.ADMIN_ACCOUNTS);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(roleRoutes.ADMIN_ACCOUNTS);
  });
});
