import { test, expect } from '@playwright/test';

const baseURL = 'https://smartcampost-frontend.vercel.app';

test('UI navigation and rendering', async ({ page }) => {
  await page.goto(baseURL);
  await expect(page.locator('nav')).toBeVisible();
  await page.click('text=Dashboard');
  await expect(page.locator('text=Dashboard')).toBeVisible();
  await page.click('text=Parcels');
  await expect(page.locator('text=Parcels')).toBeVisible();
});

test('Form validation and error messages', async ({ page }) => {
  await page.goto(`${baseURL}/auth/register`);
  await page.click('button[type="submit"]');
  await expect(page.locator('text=required')).toBeVisible();
});

test('Loading states', async ({ page }) => {
  await page.goto(`${baseURL}/dashboard`);
  await expect(page.locator('text=Loading')).toBeVisible();
});

test('No console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err));
  await page.goto(baseURL);
  expect(errors.length).toBe(0);
});
