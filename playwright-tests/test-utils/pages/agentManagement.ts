import { Page } from '@playwright/test';

export class AgentManagementPage {
  readonly page: Page;
  constructor(page: Page) { this.page = page; }

  async goto() {
    const base = String(process.env.E2E_BASE_URL || 'http://localhost:5173').trim();
    await this.page.goto(`${base.replace(/\/$/, '')}/agent`);
    await this.page.waitForLoadState('networkidle');
  }

  async hasPickupWithText(text: string) {
    return this.page.isVisible(`text=${text}`);
  }
}
