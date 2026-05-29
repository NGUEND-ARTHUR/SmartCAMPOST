import { Page } from '@playwright/test';

export class CourierManagementPage {
  readonly page: Page;
  constructor(page: Page) { this.page = page; }

  async goto() {
    // Try common courier route
    const base = String(process.env.E2E_BASE_URL || 'http://localhost:5173').trim();
    await this.page.goto(`${base.replace(/\/$/, '')}/courier`, { waitUntil: 'domcontentloaded' });
  }

  async markDelivered() {
    // Prefer exact UI label from DeliveryWorkflowStepper: 'Mark delivered'
    const btn = await this.page.$('button:has-text("Mark delivered")') || await this.page.$('button:has-text("Mark Delivered")') || await this.page.$('button.mark-delivered');
    if (!btn) throw new Error('No mark-delivered button found');
    await btn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async hasDeliveryWithText(text: string) {
    return this.page.isVisible(`text=${text}`);
  }
}
