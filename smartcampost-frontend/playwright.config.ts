import playwright from "../node_modules/@playwright/test/index.js";

const { defineConfig, devices } = playwright;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      '"C:\\Users\\Nguend Arthur Johann\\Desktop\\SmartCAMPOST\\.venv\\Scripts\\python.exe" scripts/playwright_spa_server.py',
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
