import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.FRONTEND_URL ?? "https://smartcampost-frontend.vercel.app";
const outputDir = path.resolve("qa-artifacts", "deployed-manual-qa");
fs.mkdirSync(outputDir, { recursive: true });

const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/login-otp",
  "/auth/reset-password",
  "/tracking",
  "/qr/verify",
];

const roleRoutes = {
  CLIENT: ["/client", "/client/parcels/new", "/client/parcels", "/client/map", "/client/tracking", "/client/pickups", "/client/payments", "/client/invoices", "/client/addresses", "/client/support", "/client/settings"],
  AGENT: ["/agent", "/agent/parcels/new", "/agent/parcels", "/agent/pickups", "/agent/map", "/agent/live-logistics", "/agent/gps", "/agent/route-optimization", "/agent/scan", "/agent/delivery-tools", "/agent/profile"],
  COURIER: ["/courier", "/courier/map", "/courier/live-logistics", "/courier/gps", "/courier/route-optimization", "/courier/pickups", "/courier/deliveries", "/courier/deliveries/failed", "/courier/scan", "/courier/profile"],
  STAFF: ["/staff", "/staff/map", "/staff/live-logistics", "/staff/gps", "/staff/gps-trackers", "/staff/gps-trackers/new", "/staff/iot-gps", "/staff/route-optimization", "/staff/pickup-recommendations", "/staff/distance-pricing", "/staff/parcels", "/staff/tracking", "/staff/pickups", "/staff/deliveries", "/staff/payments", "/staff/support", "/staff/scan", "/staff/bulk-scans", "/staff/notifications", "/staff/notification-templates", "/staff/otp-logs", "/staff/analytics", "/staff/advanced-analytics", "/staff/operations-intelligence", "/staff/ai-discovery", "/staff/rbac-permissions", "/staff/integrations", "/staff/profile"],
  ADMIN: ["/admin", "/admin/map", "/admin/live-logistics", "/admin/gps", "/admin/gps-trackers", "/admin/gps-trackers/new", "/admin/iot-gps", "/admin/route-optimization", "/admin/pickup-recommendations", "/admin/distance-pricing", "/admin/parcels", "/admin/pickups", "/admin/deliveries", "/admin/payments", "/admin/support", "/admin/tracking", "/admin/scan", "/admin/bulk-scans", "/admin/staff", "/admin/users/staff", "/admin/users/agents", "/admin/users/couriers", "/admin/users/agencies", "/admin/users/clients", "/admin/tariffs", "/admin/integrations", "/admin/ussd", "/admin/accounts", "/admin/self-healing", "/admin/approvals", "/admin/notifications", "/admin/notification-templates", "/admin/otp-logs", "/admin/analytics", "/admin/advanced-analytics", "/admin/operations-intelligence", "/admin/ai-discovery", "/admin/rbac-permissions", "/admin/rbac-permissions/grant", "/admin/profile"],
  FINANCE: ["/finance", "/finance/map", "/finance/payments", "/finance/refunds", "/finance/invoices", "/finance/exceptions", "/finance/analytics", "/finance/notifications", "/finance/profile"],
  RISK: ["/risk", "/risk/map", "/risk/alerts", "/risk/compliance", "/risk/cases", "/risk/integrations", "/risk/analytics", "/risk/notifications", "/risk/profile"],
};

const report = {
  startedAt: new Date().toISOString(),
  baseUrl,
  results: [],
};

function reportPath() {
  return path.join(outputDir, "report.json");
}

function saveReport() {
  fs.writeFileSync(reportPath(), JSON.stringify({ ...report, updatedAt: new Date().toISOString() }, null, 2));
}

function fakeAuthScript(role) {
  return ({ roleName }) => {
    localStorage.setItem("i18nextLng", "en");
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          user: {
            id: `manual-qa-${String(roleName).toLowerCase()}`,
            name: `Manual QA ${roleName}`,
            role: roleName,
            phone: "+237690000000",
          },
          token: `manual-qa-${String(roleName).toLowerCase()}`,
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  };
}

async function inspectRoute(browser, route, role = "PUBLIC", viewport = { width: 1440, height: 950 }) {
  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  if (role !== "PUBLIC") {
    await context.addInitScript(fakeAuthScript(role), { roleName: role });
  }
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!url.includes("tile.openstreetmap") && !url.includes("basemaps.cartocdn")) {
      failedRequests.push(`${request.method()} ${url} :: ${request.failure()?.errorText}`);
    }
  });

  const result = { role, route, viewport, issues: [], consoleErrors: [], failedRequests: [] };
  const url = `${baseUrl}${route}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await page
      .waitForFunction(() => (document.body?.innerText || "").trim().length > 20, {
        timeout: 12_000,
      })
      .catch(() => {});
  } catch (error) {
    result.issues.push(`navigation failed or timed out: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const bodyText = await page
      .evaluate(() => (document.body?.innerText || "").trim())
      .catch(() => "");
    const finalUrl = page.url();
    const pathname = finalUrl ? new URL(finalUrl).pathname : "";
    const h1 = await page.locator("h1").first().textContent({ timeout: 2_000 }).catch(() => "");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(() => 0);
    const screenshotName = `${role.toLowerCase()}-${route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"}-${viewport.width}.png`;
    await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: true }).catch(() => {});

    Object.assign(result, {
      finalUrl,
      pathname,
      h1,
      textLength: bodyText.length,
      overflow,
      screenshot: screenshotName,
    });

    if (bodyText.length < 20) result.issues.push("blank or nearly blank screen");
    if (/Cannot read properties|is not a function|ReferenceError|TypeError|Something went wrong/i.test(bodyText)) result.issues.push("visible runtime error text");
    if (pathname.startsWith("/auth/login") && role !== "PUBLIC") result.issues.push("protected role route redirected to login");
    if (overflow > 8) result.issues.push(`horizontal overflow ${overflow}px`);
  } catch (error) {
    result.issues.push(`inspection failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.consoleErrors = consoleErrors.filter((line) => !/Failed to load resource: the server responded with a status of (401|403|404|500)/.test(line)).slice(0, 20);
  result.failedRequests = failedRequests.filter((line) => !/net::ERR_ABORTED|favicon|api\//.test(line)).slice(0, 20);
  if (result.consoleErrors.length) result.issues.push(`${result.consoleErrors.length} serious console error(s)`);
  if (result.failedRequests.length) result.issues.push(`${result.failedRequests.length} serious failed request(s)`);

  await context.close().catch(() => {});
  return result;
}

const browser = await chromium.launch({ headless: true });
try {
  for (const route of publicRoutes) {
    const result = await inspectRoute(browser, route, "PUBLIC");
    report.results.push(result);
    console.log(`[${result.issues.length ? "ISSUE" : "OK"}] PUBLIC ${route} ${result.issues.join(" | ")}`);
    saveReport();
  }

  report.results.push(await inspectRoute(browser, "/", "PUBLIC", { width: 390, height: 844 }));
  saveReport();

  for (const [role, routes] of Object.entries(roleRoutes)) {
    for (const route of routes) {
      const result = await inspectRoute(browser, route, role);
      report.results.push(result);
      console.log(`[${result.issues.length ? "ISSUE" : "OK"}] ${role} ${route} ${result.issues.join(" | ")}`);
      saveReport();
    }
  }
} finally {
  await browser.close().catch(() => {});
  report.finishedAt = new Date().toISOString();
  saveReport();
}

const issueCount = report.results.reduce((sum, result) => sum + (result.issues?.length ? 1 : 0), 0);
console.log(`QA complete. Routes checked: ${report.results.length}. Routes with issues: ${issueCount}. Report: ${reportPath()}`);
if (issueCount > 0) process.exitCode = 1;
