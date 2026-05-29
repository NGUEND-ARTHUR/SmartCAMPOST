import { Page } from '@playwright/test';

export class StaffManagementPage {
  readonly page: Page;
  constructor(page: Page) { this.page = page; }

  async goto() {
    const base = String(process.env.E2E_BASE_URL || 'http://localhost:5173').trim();
    await this.page.goto(`${base.replace(/\/$/, '')}/staff`, { waitUntil: 'domcontentloaded' });
  }

  async canCreateStaff() {
    // Check for presence of create button using visible button text from StaffManagement dialog
    return this.page.isVisible('button:has-text("Add Staff")') || this.page.isVisible('button:has-text("Create Staff")') || this.page.isVisible('button.create-staff');
  }

  async attemptCreateStaffMinimal() {
    // Try to submit minimal form and catch validation UI
    // Click the dialog trigger if present
    if (await this.page.isVisible('button:has-text("Add Staff")')) {
      await this.page.click('button:has-text("Add Staff")');
    } else if (await this.page.isVisible('button.create-staff')) {
      await this.page.click('button.create-staff');
    }
    await this.page.click('button[type="submit"]');
    // return whether validation message appeared
    return this.page.isVisible('.validation-error') || this.page.isVisible('text=This field is required');
  }
}
