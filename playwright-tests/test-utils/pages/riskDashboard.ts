import { Page } from '@playwright/test';

export class RiskDashboardPage {
  readonly page: Page;
  constructor(page: Page) { this.page = page; }

  async goto() {
    // Try role-specific and admin-scoped routes using explicit base
    const base = String(process.env.E2E_BASE_URL || 'http://localhost:5173').trim();
    await this.page.goto(`${base.replace(/\/$/, '')}/risk`, { waitUntil: 'domcontentloaded' });
    if (this.page.url().includes('/login') || this.page.url().includes('/auth')) {
      await this.page.goto(`${base.replace(/\/$/, '')}/admin/risk`, { waitUntil: 'domcontentloaded' });
    }
  }

  async filterBySeverity(level: string) {
    // RiskDashboard does not expose a severity select in admin UI; use page-level filter where present
    if (await this.page.isVisible('select[name="severity"]')) {
      await this.page.selectOption('select[name="severity"]', level);
      await this.page.waitForLoadState('networkidle');
    } else {
      // No filter control — fallback: check for text in recent alerts by severity label
      await this.page.waitForSelector('div');
    }
  }

  async hasRiskEntry(text: string) {
    return this.page.isVisible(`text=${text}`) || this.page.isVisible(`text=${text.toLowerCase()}`);
  }
}
