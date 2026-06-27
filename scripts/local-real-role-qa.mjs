import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.FRONTEND_URL ?? "http://127.0.0.1:5174";
const apiBase = process.env.API_URL ?? "http://localhost:8082/api";
const outputDir = path.resolve("qa-artifacts", "local-real-role-qa");
fs.mkdirSync(outputDir, { recursive: true });

const adminLogin = {
  phone: process.env.QA_ADMIN_LOGIN ?? "admin@smartcampost.cm",
  password: process.env.QA_ADMIN_PASSWORD ?? "Admin@SmartCAMPOST2026",
};
const qaPassword = "QaRole2026!";

const roleRoutes = {
  CLIENT: ["/client", "/client/parcels/new", "/client/parcels", "/client/map", "/client/tracking", "/client/pickups", "/client/payments", "/client/invoices", "/client/addresses", "/client/support", "/client/settings"],
  AGENT: ["/agent", "/agent/parcels/new", "/agent/parcels", "/agent/pickups", "/agent/map", "/agent/live-logistics", "/agent/gps", "/agent/route-optimization", "/agent/scan", "/agent/delivery-tools", "/agent/profile"],
  COURIER: ["/courier", "/courier/map", "/courier/live-logistics", "/courier/gps", "/courier/route-optimization", "/courier/pickups", "/courier/deliveries", "/courier/deliveries/failed", "/courier/scan", "/courier/profile"],
  STAFF: ["/staff", "/staff/map", "/staff/live-logistics", "/staff/gps", "/staff/gps-trackers", "/staff/gps-trackers/new", "/staff/iot-gps", "/staff/route-optimization", "/staff/pickup-recommendations", "/staff/distance-pricing", "/staff/parcels", "/staff/tracking", "/staff/pickups", "/staff/deliveries", "/staff/payments", "/staff/support", "/staff/scan", "/staff/bulk-scans", "/staff/notifications", "/staff/notification-templates", "/staff/otp-logs", "/staff/analytics", "/staff/advanced-analytics", "/staff/operations-intelligence", "/staff/ai-discovery", "/staff/integrations", "/staff/profile"],
  ADMIN: ["/admin", "/admin/map", "/admin/live-logistics", "/admin/gps", "/admin/gps-trackers", "/admin/gps-trackers/new", "/admin/iot-gps", "/admin/route-optimization", "/admin/pickup-recommendations", "/admin/distance-pricing", "/admin/parcels", "/admin/pickups", "/admin/deliveries", "/admin/payments", "/admin/support", "/admin/tracking", "/admin/scan", "/admin/bulk-scans", "/admin/staff", "/admin/users/staff", "/admin/users/agents", "/admin/users/couriers", "/admin/users/agencies", "/admin/users/clients", "/admin/tariffs", "/admin/integrations", "/admin/ussd", "/admin/accounts", "/admin/self-healing", "/admin/approvals", "/admin/notifications", "/admin/notification-templates", "/admin/otp-logs", "/admin/analytics", "/admin/advanced-analytics", "/admin/operations-intelligence", "/admin/ai-discovery", "/admin/rbac-permissions", "/admin/rbac-permissions/grant", "/admin/profile"],
  FINANCE: ["/finance", "/finance/map", "/finance/payments", "/finance/refunds", "/finance/invoices", "/finance/exceptions", "/finance/analytics", "/finance/notifications", "/finance/profile"],
  RISK: ["/risk", "/risk/map", "/risk/alerts", "/risk/compliance", "/risk/cases", "/risk/integrations", "/risk/analytics", "/risk/notifications", "/risk/profile"],
};

const report = {
  startedAt: new Date().toISOString(),
  baseUrl,
  apiBase,
  seededUsers: {},
  results: [],
};

function saveReport() {
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify({ ...report, updatedAt: new Date().toISOString() }, null, 2));
}

async function api(endpoint, options = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${endpoint} failed ${response.status}: ${text}`);
  }
  return body;
}

async function login(phone, password) {
  return api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

function userFromAuth(auth, fallbackRole) {
  return {
    id: auth.userId || auth.entityId || auth.phone,
    name: auth.fullName || `QA ${fallbackRole}`,
    phone: auth.phone || "",
    email: auth.email || "",
    role: auth.role || fallbackRole,
  };
}

async function seedUsers() {
  const suffix = String(Date.now()).slice(-8);
  const admin = await login(adminLogin.phone, adminLogin.password);
  const adminToken = admin.accessToken || admin.token;
  report.seededUsers.ADMIN = adminLogin.phone;

  const staffLike = [
    ["STAFF", "/staff", { fullName: "QA Staff", role: "STAFF", phone: `+23767${suffix.slice(0, 7)}`, email: `qa.staff.${suffix}@smartcampost.local`, password: qaPassword }],
    ["FINANCE", "/staff", { fullName: "QA Finance", role: "FINANCE", phone: `+23768${suffix.slice(0, 7)}`, email: `qa.finance.${suffix}@smartcampost.local`, password: qaPassword }],
    ["RISK", "/staff", { fullName: "QA Risk", role: "RISK", phone: `+23769${suffix.slice(0, 7)}`, email: `qa.risk.${suffix}@smartcampost.local`, password: qaPassword }],
  ];
  for (const [role, endpoint, payload] of staffLike) {
    await api(endpoint, { method: "POST", token: adminToken, body: JSON.stringify(payload) });
    report.seededUsers[role] = payload.email;
  }

  const agent = { fullName: "QA Agent", staffNumber: `AG-${suffix}`, phone: `+23765${suffix.slice(0, 7)}`, email: `qa.agent.${suffix}@smartcampost.local`, password: qaPassword };
  await api("/agents", { method: "POST", token: adminToken, body: JSON.stringify(agent) });
  report.seededUsers.AGENT = agent.email;

  const courier = { fullName: "QA Courier", phone: `+23766${suffix.slice(0, 7)}`, email: `qa.courier.${suffix}@smartcampost.local`, password: qaPassword, vehicleId: `QA-${suffix.slice(-5)}` };
  await api("/couriers", { method: "POST", token: adminToken, body: JSON.stringify(courier) });
  report.seededUsers.COURIER = courier.email;

  const clientPhone = `+23764${suffix.slice(0, 7)}`;
  const otpResponse = await api("/auth/send-otp", { method: "POST", body: JSON.stringify({ phone: clientPhone }) });
  const client = { fullName: "QA Client", phone: clientPhone, email: `qa.client.${suffix}@smartcampost.local`, preferredLanguage: "en", password: qaPassword, otp: otpResponse.otp || "000000" };
  await api("/auth/register", { method: "POST", body: JSON.stringify(client) });
  report.seededUsers.CLIENT = client.email;

  const sessions = {
    ADMIN: admin,
  };
  for (const role of ["CLIENT", "AGENT", "COURIER", "STAFF", "FINANCE", "RISK"]) {
    sessions[role] = await login(report.seededUsers[role], qaPassword);
  }
  saveReport();
  return sessions;
}

async function inspectRoute(browser, role, auth, route) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, ignoreHTTPSErrors: true });
  await context.addInitScript(({ authPayload, roleName }) => {
    localStorage.setItem("i18nextLng", "en");
    localStorage.setItem("auth-storage", JSON.stringify({
      state: {
        user: authPayload.user,
        token: authPayload.token,
        isAuthenticated: true,
      },
      version: 0,
    }));
    localStorage.setItem("qa-real-role", roleName);
  }, {
    roleName: role,
    authPayload: {
      user: userFromAuth(auth, role),
      token: auth.accessToken || auth.token,
    },
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!/favicon|tile\.openstreetmap|basemaps\.cartocdn/.test(url)) {
      failedRequests.push(`${request.method()} ${url} :: ${request.failure()?.errorText}`);
    }
  });

  const result = { role, route, issues: [], consoleErrors: [], failedRequests: [] };
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await page.waitForFunction(() => (document.body?.innerText || "").trim().length > 20, { timeout: 12_000 }).catch(() => {});
    const text = await page.evaluate(() => (document.body?.innerText || "").trim());
    const pathname = new URL(page.url()).pathname;
    const h1 = await page.locator("h1").first().textContent({ timeout: 2_000 }).catch(() => "");
    const screenshotName = `${role.toLowerCase()}-${route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"}.png`;
    await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: true }).catch(() => {});
    Object.assign(result, { finalUrl: page.url(), pathname, h1, textLength: text.length, screenshot: screenshotName });
    if (text.length < 20) result.issues.push("blank or nearly blank screen");
    if (/Cannot read properties|is not a function|ReferenceError|TypeError/i.test(text)) result.issues.push("visible runtime error text");
    if (/Something went wrong|Request failed with status code (401|403)/i.test(text)) result.issues.push("visible authorization/API error");
    if (pathname.startsWith("/auth/login")) result.issues.push("real role session redirected to login");
  } catch (error) {
    result.issues.push(error instanceof Error ? error.message : String(error));
  }

  result.consoleErrors = consoleErrors
    .filter((line) => !/Failed to load resource: the server responded/.test(line))
    .filter((line) => !/\[GSI_LOGGER\]/.test(line))
    .slice(0, 20);
  result.failedRequests = failedRequests
    .filter((line) => !/net::ERR_ABORTED|favicon/.test(line))
    .slice(0, 20);
  if (result.consoleErrors.length) result.issues.push(`${result.consoleErrors.length} console error(s)`);
  if (result.failedRequests.length) result.issues.push(`${result.failedRequests.length} failed request(s)`);
  await context.close().catch(() => {});
  return result;
}

const sessions = await seedUsers();
const launchOptions = { headless: true };
if (process.env.QA_BROWSER_CHANNEL) {
  launchOptions.channel = process.env.QA_BROWSER_CHANNEL;
}
const browser = await chromium.launch(launchOptions);
try {
  for (const [role, routes] of Object.entries(roleRoutes)) {
    for (const route of routes) {
      const result = await inspectRoute(browser, role, sessions[role], route);
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

const issueCount = report.results.filter((result) => result.issues.length).length;
console.log(`Local real-role QA complete. Routes checked: ${report.results.length}. Routes with issues: ${issueCount}. Report: ${path.join(outputDir, "report.json")}`);
if (issueCount) process.exitCode = 1;
