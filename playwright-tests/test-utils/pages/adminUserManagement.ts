import { Page, expect } from '@playwright/test';

export class AdminUserManagementPage {
  readonly page: Page;
  constructor(page: Page) { this.page = page; }

  async goto() {
    const base = String(process.env.E2E_BASE_URL || 'http://localhost:5173').trim();
    await this.page.goto(`${base.replace(/\/$/, '')}/admin/accounts`);
    await this.page.waitForLoadState('networkidle');
  }


  async findUserInList(text: string) {
    const table = this.page.locator('table');
    const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTable) {
      return false;
    }
    return this.page.isVisible(`text=${text}`);
  }
}
