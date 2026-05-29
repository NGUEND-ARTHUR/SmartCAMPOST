import { defineConfig, devices } from '@playwright/test';

/**
 * SmartCAMPOST E2E Test Configuration
 *
 * Prerequisites:
 *   1. Start Vite dev server: npm run dev  (port 5173)
 *   2. Start backend on port 8082: PORT=8082 SMARTCAMPOST_OTP_EXPOSE_CODE=true
 *      PAYMENT_GATEWAY=mock ./mvnw spring-boot:run -Dspring.profiles.active=local
 *   3. OTPs are captured dynamically via route interception (not hardcoded)
 *
 * Run tests:
 *   npx playwright test                  # all tests
 *   npx playwright test e2e/auth/        # auth tests only
 *   npx playwright test --headed         # with browser visible
 *   npx playwright test --debug          # step-by-step debugger
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
// Default 8082 matches the project's .env.development (VITE_API_URL=http://localhost:8082)
const API_URL  = process.env.API_URL  ?? 'http://localhost:8082';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,       // sequential by default — tests share backend state
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace:      'retain-on-failure',
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  projects: [
    // ── Setup: create per-role auth state files ──
    {
      name: 'setup',
      testMatch: '**/fixtures/global.setup.ts',
    },

    // ── Desktop Chrome (primary) ──
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // ── Mobile viewport (secondary) ──
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
      dependencies: ['setup'],
    },
  ],

  // Expose for helpers
  globalSetup: undefined,   // individual spec globalSetup via 'setup' project
});

export { BASE_URL, API_URL };
