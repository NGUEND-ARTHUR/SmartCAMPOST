/**
 * Reusable Playwright test fixtures with pre-authenticated pages.
 *
 * Usage in a spec file:
 *   import { test, expect } from '../fixtures';
 *   test('admin sees dashboard', async ({ adminPage }) => { ... });
 */

import { test as base, expect, type Page } from '@playwright/test';
import { AUTH_STATE } from './users';

type AuthPages = {
  adminPage:   Page;
  clientPage:  Page;
  staffPage:   Page;
  agentPage:   Page;
  courierPage: Page;
  financePage: Page;
  riskPage:    Page;
};

export const test = base.extend<AuthPages>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.admin,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  clientPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.client,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  staffPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.staff,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  agentPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.agent,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  courierPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.courier,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  financePage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.finance,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  riskPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.risk,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
