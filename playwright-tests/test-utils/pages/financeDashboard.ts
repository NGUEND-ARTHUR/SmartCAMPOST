import { Page } from '@playwright/test';

export class FinanceDashboardPage {
  readonly page: Page;
  constructor(page: Page) { this.page = page; }

  async goto() {
    const base = String(process.env.E2E_BASE_URL || 'http://localhost:5173').trim();
    await this.page.goto(`${base.replace(/\/$/, '')}/finance`, { waitUntil: 'domcontentloaded' });
  }

  async hasTransaction(description: string) {
    return this.page.isVisible(`text=${description}`);
  }
}
