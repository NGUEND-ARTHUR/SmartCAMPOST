import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.FRONTEND_URL ?? "https://smartcampost-frontend.vercel.app";
const outputDir = path.resolve("qa-artifacts", "deployed-workflow-qa");
fs.mkdirSync(outputDir, { recursive: true });

const adminIdentity = {
  phoneOrEmail: process.env.QA_ADMIN_LOGIN ?? "admin@smartcampost.cm",
  password: process.env.QA_ADMIN_PASSWORD ?? "Admin@SmartCAMPOST2026",
};

const report = {
  startedAt: new Date().toISOString(),
  baseUrl,
  checks: [],
};

function saveReport() {
  fs.writeFileSync(
    path.join(outputDir, "report.json"),
    JSON.stringify({ ...report, updatedAt: new Date().toISOString() }, null, 2),
  );
}

async function record(page, name, fn) {
  const check = {
    name,
    status: "ok",
    url: page.url(),
    issues: [],
    consoleErrors: [],
    failedRequests: [],
  };

  const onConsole = (msg) => {
    if (msg.type() === "error") check.consoleErrors.push(msg.text());
  };
  const onPageError = (error) => check.consoleErrors.push(error.message);
  const onRequestFailed = (request) => {
    const url = request.url();
    if (!/favicon|tile.openstreetmap|basemaps.cartocdn/.test(url)) {
      check.failedRequests.push(
        `${request.method()} ${url} :: ${request.failure()?.errorText}`,
      );
    }
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  try {
    await fn(check);
  } catch (error) {
    check.status = "failed";
    check.issues.push(error instanceof Error ? error.message : String(error));
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
    check.url = page.url();
    check.consoleErrors = check.consoleErrors
      .filter((line) => !/Failed to load resource: the server responded/.test(line))
      .slice(0, 20);
    check.failedRequests = check.failedRequests
      .filter((line) => !/api\/notifications|api\/dashboard|net::ERR_ABORTED/.test(line))
      .slice(0, 20);
    if (check.consoleErrors.length) check.issues.push(`${check.consoleErrors.length} console error(s)`);
    if (check.failedRequests.length) check.issues.push(`${check.failedRequests.length} failed request(s)`);
    if (check.issues.length) check.status = "failed";
    report.checks.push(check);
    console.log(`[${check.status.toUpperCase()}] ${name}${check.issues.length ? ` :: ${check.issues.join(" | ")}` : ""}`);
    saveReport();
  }
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(outputDir, `${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.png`),
    fullPage: true,
  });
}

async function pageText(page) {
  return page.evaluate(() => (document.body?.innerText || "").trim());
}

async function visibleText(page, pattern, timeout = 15_000) {
  await page.getByText(pattern, { exact: false }).first().waitFor({ state: "visible", timeout });
}

async function fillFirst(page, selector, value) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: 20_000 });
  await locator.fill(value);
}

async function loginAsAdmin(page) {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await fillFirst(page, 'input[type="text"], input[type="email"], input[name*="phone" i], input[name*="email" i]', adminIdentity.phoneOrEmail);
  await fillFirst(page, 'input[type="password"]', adminIdentity.password);
  await page.getByRole("button", { name: /login|connecter|sign in/i }).click();
  await page.waitForURL(/\/admin|\/client|\/staff|\/agent|\/courier|\/finance|\/risk/, { timeout: 60_000 });
}

async function main() {
  const useSystemChrome = process.env.QA_SYSTEM_CHROME === "1";
  const browser = await chromium.launch({
    headless: true,
    executablePath: useSystemChrome
      ? (process.env.PLAYWRIGHT_CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
      : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, ignoreHTTPSErrors: true });

  await record(page, "PUBLIC landing language toggle and duplicated services", async (check) => {
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2_000);
    await screenshot(page, "public-landing-before");
    const text = await pageText(page);
    if (!/SmartCAMPOST/i.test(text)) check.issues.push("brand missing from landing");
    const trackingCards = (text.match(/Real-time Tracking|Suivi en temps reel|Suivi en temps réel/g) || []).length;
    if (trackingCards > 1) check.issues.push("landing repeats the same service cards in hero and services");
    await page.getByRole("button", { name: /language|langue|english|français/i }).first().click();
    await page.getByRole("button", { name: /english|anglais/i }).first().click().catch(async () => {
      await page.getByText(/english|anglais/i).first().click();
    });
    await page.waitForTimeout(800);
    const switched = await pageText(page);
    if (!/Smart Postal Services|Our Services|Get Started/i.test(switched)) {
      check.issues.push("landing language switch did not visibly switch to English");
    }
  });

  await record(page, "PUBLIC auth page controls", async (check) => {
    for (const route of ["/auth/login", "/auth/register", "/auth/login-otp", "/auth/reset-password", "/tracking"]) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.waitForTimeout(1_000);
      const text = await pageText(page);
      if (text.length < 40) check.issues.push(`${route} has too little visible content`);
      const inputs = await page.locator("input").count();
      if (route !== "/tracking" && inputs === 0) check.issues.push(`${route} has no input fields`);
      await screenshot(page, `public-${route}`);
    }
  });

  await record(page, "ADMIN login real credentials", async (check) => {
    await loginAsAdmin(page);
    await screenshot(page, "admin-login-result");
    if (!/\/admin/.test(page.url())) check.issues.push(`admin login redirected to unexpected url ${page.url()}`);
    const text = await pageText(page);
    if (!/dashboard|admin|tableau/i.test(text)) check.issues.push("admin dashboard content not visible after login");
  });

  await record(page, "ADMIN role pages and navigation", async (check) => {
    const routes = [
      "/admin",
      "/admin/users/staff",
      "/admin/users/agents",
      "/admin/users/couriers",
      "/admin/parcels",
      "/admin/payments",
      "/admin/support",
      "/admin/self-healing",
      "/admin/approvals",
      "/admin/rbac-permissions",
      "/admin/profile",
    ];
    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.waitForTimeout(1_500);
      const text = await pageText(page);
      if (text.length < 80) check.issues.push(`${route} appears sparse or unloaded`);
      if (/login|connexion/i.test(text) && !/dashboard|admin|users|parcels/i.test(text)) {
        check.issues.push(`${route} unexpectedly shows login-like content`);
      }
      await screenshot(page, `admin-${route}`);
    }
  });

  await record(page, "RBAC client blocked from admin with fake client session", async (check) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: { id: "qa-client", name: "QA Client", role: "CLIENT", phone: "+237690000001" },
            token: "qa-client-token",
            isAuthenticated: true,
          },
          version: 0,
        }),
      );
    });
    await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(2_000);
    const text = await pageText(page);
    if (!/unauthorized|not authorized|login|connexion|client/i.test(text)) {
      check.issues.push("client session was not visibly blocked from admin route");
    }
    await screenshot(page, "rbac-client-admin");
  });

  await browser.close();
  report.finishedAt = new Date().toISOString();
  saveReport();
  const failed = report.checks.filter((check) => check.status === "failed");
  console.log(`Workflow QA complete. Checks: ${report.checks.length}. Failed: ${failed.length}. Report: ${path.join(outputDir, "report.json")}`);
  if (failed.length) process.exitCode = 1;
}

await main();
