import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.FRONTEND_URL ?? "http://127.0.0.1:5174";
const apiBase = process.env.API_URL ?? "http://localhost:8082/api";
const outputDir = path.resolve("qa-artifacts", "local-e2e-manual-qa");
fs.mkdirSync(outputDir, { recursive: true });
const roleFilter = new Set(
  (process.env.QA_ROLES ?? "")
    .split(",")
    .map((role) => role.trim().toUpperCase())
    .filter(Boolean),
);
const shouldRunRole = (role) => roleFilter.size === 0 || roleFilter.has(role);
const runPages = process.env.QA_PAGES !== "false";
const runWorkflows = process.env.QA_WORKFLOWS !== "false";

const adminLogin = {
  phone: process.env.QA_ADMIN_LOGIN ?? "admin@smartcampost.cm",
  password: process.env.QA_ADMIN_PASSWORD ?? "Admin@SmartCAMPOST2026",
};
const qaPassword = "QaRole2026!";

const roleRoutes = {
  PUBLIC: ["/", "/auth/login", "/auth/register", "/auth/login-otp", "/auth/reset-password", "/tracking", "/qr/verify"],
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
  seededData: {},
  pages: [],
  workflows: [],
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

function tokenOf(auth) {
  return auth.accessToken || auth.token;
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

async function seedUsersAndData() {
  const suffix = String(Date.now()).slice(-8);
  const admin = await login(adminLogin.phone, adminLogin.password);
  const adminToken = tokenOf(admin);
  report.seededUsers.ADMIN = adminLogin.phone;

  const staffLike = [
    ["STAFF", { fullName: "QA Staff", role: "STAFF", phone: `+23767${suffix.slice(0, 7)}`, email: `qa.staff.${suffix}@smartcampost.local`, password: qaPassword }],
    ["FINANCE", { fullName: "QA Finance", role: "FINANCE", phone: `+23768${suffix.slice(0, 7)}`, email: `qa.finance.${suffix}@smartcampost.local`, password: qaPassword }],
    ["RISK", { fullName: "QA Risk", role: "RISK", phone: `+23769${suffix.slice(0, 7)}`, email: `qa.risk.${suffix}@smartcampost.local`, password: qaPassword }],
  ];
  for (const [role, payload] of staffLike) {
    await api("/staff", { method: "POST", token: adminToken, body: JSON.stringify(payload) });
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

  const sessions = { ADMIN: admin };
  for (const role of ["CLIENT", "AGENT", "COURIER", "STAFF", "FINANCE", "RISK"]) {
    sessions[role] = await login(report.seededUsers[role], qaPassword);
  }

  const clientToken = tokenOf(sessions.CLIENT);
  const sender = await api("/addresses", {
    method: "POST",
    token: clientToken,
    body: JSON.stringify({ label: "QA Sender", street: "Avenue Kennedy", city: "Yaounde", region: "Centre", country: "Cameroon", latitude: 3.8667, longitude: 11.5167 }),
  });
  const recipient = await api("/addresses", {
    method: "POST",
    token: clientToken,
    body: JSON.stringify({ label: "QA Recipient", street: "Bonapriso", city: "Douala", region: "Littoral", country: "Cameroon", latitude: 4.0511, longitude: 9.7679 }),
  });
  const parcel = await api("/parcels", {
    method: "POST",
    token: clientToken,
    body: JSON.stringify({
      senderAddressId: sender.id,
      recipientAddressId: recipient.id,
      weight: 2.4,
      dimensions: "30x20x10",
      declaredValue: 25000,
      fragile: true,
      serviceType: "EXPRESS",
      deliveryOption: "HOME",
      paymentOption: "COD",
      description: "Local QA seeded parcel",
    }),
  });
  report.seededData = { sender, recipient, parcel };
  saveReport();
  return sessions;
}

async function createContext(browser, role, auth) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, ignoreHTTPSErrors: true });
  if (role !== "PUBLIC") {
    await context.addInitScript(({ authPayload }) => {
      localStorage.setItem("i18nextLng", "en");
      localStorage.setItem("auth-storage", JSON.stringify({
        state: { user: authPayload.user, token: authPayload.token, isAuthenticated: true },
        version: 0,
      }));
    }, {
      authPayload: {
        user: userFromAuth(auth, role),
        token: tokenOf(auth),
      },
    });
  }
  return context;
}

function attachCollectors(page) {
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
  return { consoleErrors, failedRequests };
}

function cleanConsoleErrors(lines) {
  return lines
    .filter((line) => !/Failed to load resource: the server responded/.test(line))
    .filter((line) => !/net::ERR_NETWORK_CHANGED/.test(line))
    .filter((line) => !/\[GSI_LOGGER\]/.test(line))
    .filter((line) => !/accounts\.google\.com.*Content Security Policy|Framing 'https:\/\/accounts\.google\.com\/' violates/i.test(line))
    .slice(0, 20);
}

function cleanFailedRequests(lines) {
  return lines.filter((line) => !/net::ERR_ABORTED|net::ERR_NETWORK_CHANGED|favicon/.test(line)).slice(0, 20);
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

async function inspectPage(browser, role, auth, route) {
  const context = await createContext(browser, role, auth);
  const page = await context.newPage();
  const collectors = attachCollectors(page);
  const result = { role, route, issues: [], controls: {} };
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
    await page.waitForFunction(() => (document.body?.innerText || "").trim().length > 20, { timeout: 12_000 }).catch(() => {});
    let text = await pageText(page);
    if (text.length < 20) {
      await page.waitForTimeout(2_500);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 90_000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => {});
      await page.waitForFunction(() => (document.body?.innerText || "").trim().length > 20, { timeout: 12_000 }).catch(() => {});
      text = await pageText(page);
    }
    const finalUrl = page.url();
    const pathname = new URL(finalUrl).pathname;
    const h1 = await page.locator("h1").first().textContent({ timeout: 2_000 }).catch(() => "");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(() => 0);
    const controls = await page.evaluate(() => ({
      buttons: Array.from(document.querySelectorAll("button")).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((el) => (el.textContent || el.getAttribute("aria-label") || "").trim()).filter(Boolean).slice(0, 30),
      inputs: Array.from(document.querySelectorAll("input, textarea, select")).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((el) => el.getAttribute("id") || el.getAttribute("name") || el.getAttribute("placeholder") || el.tagName).slice(0, 30),
      links: Array.from(document.querySelectorAll("a")).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).map((el) => (el.textContent || el.getAttribute("href") || "").trim()).filter(Boolean).slice(0, 30),
    }));
    await screenshot(page, `${role}-${route || "home"}-page`);

    Object.assign(result, { finalUrl, pathname, h1, textLength: text.length, overflow, controls });
    if (text.length < 20) result.issues.push("blank or nearly blank screen");
    if (/Cannot read properties|is not a function|ReferenceError|TypeError/i.test(text)) result.issues.push("visible runtime error text");
    if (/Something went wrong|Request failed with status code (401|403|500)/i.test(text)) result.issues.push("visible API/runtime error banner");
    if (overflow > 8) result.issues.push(`horizontal overflow ${overflow}px`);
    if (pathname.startsWith("/auth/login") && role !== "PUBLIC") result.issues.push("authenticated role redirected to login");
    if (role !== "PUBLIC" && !controls.buttons.some((label) => /FR|EN|Logout|Search|Back/i.test(label))) {
      result.issues.push("expected role layout controls were not visible");
    }
  } catch (error) {
    result.issues.push(error instanceof Error ? error.message : String(error));
  }
  result.consoleErrors = cleanConsoleErrors(collectors.consoleErrors);
  result.failedRequests = cleanFailedRequests(collectors.failedRequests);
  if (result.consoleErrors.length) result.issues.push(`${result.consoleErrors.length} console error(s)`);
  if (result.failedRequests.length) result.issues.push(`${result.failedRequests.length} failed request(s)`);
  await context.close().catch(() => {});
  report.pages.push(result);
  console.log(`[${result.issues.length ? "ISSUE" : "OK"}] PAGE ${role} ${route} ${result.issues.join(" | ")}`);
  saveReport();
  return result;
}

async function recordWorkflow(browser, name, role, auth, fn) {
  const context = await createContext(browser, role, auth);
  const page = await context.newPage();
  const collectors = attachCollectors(page);
  const result = { name, role, status: "ok", issues: [], screenshots: [] };
  const shot = async (label) => {
    const shotName = `workflow-${name}-${label}`;
    await screenshot(page, shotName);
    result.screenshots.push(`${shotName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.png`);
  };
  try {
    await fn(page, result, shot);
  } catch (error) {
    result.status = "failed";
    result.issues.push(error instanceof Error ? error.message : String(error));
  }
  result.consoleErrors = cleanConsoleErrors(collectors.consoleErrors);
  result.failedRequests = cleanFailedRequests(collectors.failedRequests);
  if (result.consoleErrors.length) result.issues.push(`${result.consoleErrors.length} console error(s)`);
  if (result.failedRequests.length) result.issues.push(`${result.failedRequests.length} failed request(s)`);
  if (result.issues.length) result.status = "failed";
  await context.close().catch(() => {});
  report.workflows.push(result);
  console.log(`[${result.status.toUpperCase()}] WORKFLOW ${name} ${result.issues.join(" | ")}`);
  saveReport();
  return result;
}

async function clickVisible(page, locator, timeout = 15_000) {
  await locator.waitFor({ state: "visible", timeout });
  await locator.click();
}

async function selectFirstOption(page, triggerText) {
  const trigger = typeof triggerText === "string" || triggerText instanceof RegExp
    ? page.getByText(triggerText, { exact: false }).first()
    : triggerText;
  await clickVisible(page, trigger);
  await page.getByRole("option").first().waitFor({ state: "visible", timeout: 10_000 });
  await page.getByRole("option").first().click();
}

async function selectFirstOptionById(page, id) {
  const trigger = page.locator(`#${id}`);
  await clickVisible(page, trigger);
  await page.getByRole("option").first().waitFor({ state: "visible", timeout: 10_000 });
  await page.getByRole("option").first().click();
}

async function fillFirstVisibleEditablePlaceholder(page, placeholder, value) {
  const fields = page.locator("input[placeholder], textarea[placeholder]");
  const count = await fields.count();
  for (let index = 0; index < count; index += 1) {
    const field = fields.nth(index);
    const text = await field.getAttribute("placeholder").catch(() => "");
    if (!placeholder.test(text || "")) continue;
    const isUsable = await field.isVisible().catch(() => false) && await field.isEditable().catch(() => false);
    if (!isUsable) continue;
    await field.fill(value);
    return true;
  }
  return false;
}

async function clickTab(page, name) {
  const tab = page.getByRole("tab", { name }).first();
  const button = page.getByRole("button", { name }).first();
  const target = await tab.isVisible().catch(() => false) ? tab : button;
  await target.waitFor({ state: "visible", timeout: 15_000 });
  await target.click({ timeout: 7_000 }).catch(async () => {
    await target.click({ force: true, timeout: 7_000 }).catch(async () => {
      await target.dispatchEvent("click");
    });
  });
  await page.waitForTimeout(250);
}

async function clickLastButton(page, name) {
  const button = page.getByRole("button", { name }).last();
  await button.waitFor({ state: "visible", timeout: 15_000 });
  await button.click({ timeout: 7_000 }).catch(async () => {
    await button.focus();
    await page.keyboard.press("Enter");
  });
}

async function advanceToPaymentStep(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await clickLastButton(page, /next/i);
    const paymentTab = page.getByRole("tab", { name: /cash on delivery/i }).first();
    const paymentButton = page.getByRole("button", { name: /cash on delivery/i }).first();
    const createButton = page.getByRole("button", { name: /create parcel/i }).first();
    const appeared = await paymentTab.waitFor({ state: "visible", timeout: 4_000 }).then(() => true).catch(async () => (
      paymentButton.waitFor({ state: "visible", timeout: 4_000 }).then(() => true).catch(async () => (
        createButton.waitFor({ state: "visible", timeout: 4_000 }).then(() => true).catch(() => false)
      ))
    ));
    if (appeared) return;
  }
  throw new Error("payment step did not become visible after pressing Next");
}

async function runPublicWorkflows(browser) {
  await recordWorkflow(browser, "public-language-theme-auth-validation", "PUBLIC", null, async (page, result, shot) => {
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await shot("landing-before");
    await page.getByRole("button", { name: /language|langue/i }).first().click();
    await page.getByRole("button", { name: /english|anglais/i }).first().click();
    await page.getByRole("button", { name: /dark/i }).click().catch(() => {});
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    if (!htmlLang.startsWith("en")) result.issues.push(`language did not persist to html lang, got ${htmlLang}`);
    await shot("landing-after-language-theme");

    await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded" });
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(600);
    const loginText = await pageText(page);
    if (!/required|requis|welcome|phone/i.test(loginText)) result.issues.push("login validation or page text not visible after empty submit");
    await shot("login-empty-validation");
  });
}

async function runClientWorkflows(browser, sessions) {
  await recordWorkflow(browser, "client-address-support-parcel-tracking", "CLIENT", sessions.CLIENT, async (page, result, shot) => {
    const trackingRef = report.seededData.parcel.trackingRef;
    await page.goto(`${baseUrl}/client/addresses`, { waitUntil: "domcontentloaded" });
    await clickVisible(page, page.getByRole("button", { name: /add address|ajouter/i }).first());
    await page.locator("#label").fill("QA UI Address");
    await page.locator("#street").fill("Rue QA");
    await page.locator("#city").fill("Bafoussam");
    await page.locator("#region").fill("West");
    await shot("address-dialog-filled");
    await page.getByRole("button", { name: /add|ajouter|save|enregistrer/i }).last().click();
    await page.waitForTimeout(1500);
    const addressText = await pageText(page);
    if (!/QA UI Address|Bafoussam/i.test(addressText)) result.issues.push("created address not visible in address list");
    await shot("address-created");

    await page.goto(`${baseUrl}/client/support`, { waitUntil: "domcontentloaded" });
    await clickVisible(page, page.getByRole("button", { name: /new|add|ticket|support/i }).first());
    await selectFirstOptionById(page, "category");
    const subject = page.locator("#subject");
    await subject.fill(`QA support ${Date.now()}`);
    await page.locator("#description").fill("QA support ticket created during end-to-end manual testing.");
    await shot("support-dialog-filled");
    await page.getByRole("button", { name: /create|submit|envoyer/i }).last().click();
    await page.waitForTimeout(1500);
    const supportText = await pageText(page);
    if (!/QA support|ticket/i.test(supportText)) result.issues.push("support ticket creation did not reflect in UI");
    await shot("support-created");

    await page.goto(`${baseUrl}/client/parcels/new`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await selectFirstOption(page, page.getByRole("combobox").filter({ hasText: /select sender address/i }).first());
    await selectFirstOption(page, page.getByRole("combobox").filter({ hasText: /select recipient address/i }).first());
    await page.getByRole("button", { name: /next/i }).click();
    await page.locator("#weight").fill("1.8");
    await page.locator("#dimensions").fill("20x15x10");
    await page.locator("#declaredValue").fill("15000");
    await page.locator("#descriptionComment").fill("QA UI-created parcel");
    await shot("parcel-step-details");
    await page.getByRole("button", { name: /next/i }).click();
    await clickTab(page, /express/i);
    await clickTab(page, /home delivery/i);
    await shot("parcel-step-service");
    await advanceToPaymentStep(page);
    await clickTab(page, /cash on delivery/i).catch(() => {});
    await shot("parcel-step-payment");
    await page.getByRole("button", { name: /create parcel/i }).click();
    await page.waitForTimeout(2500);
    const parcelText = await pageText(page);
    if (/Something went wrong|Request failed|error/i.test(parcelText)) result.issues.push("parcel creation produced visible error");
    if (!/parcel|tracking|created|SCP/i.test(parcelText)) result.issues.push("parcel creation did not show parcel/list confirmation");
    await shot("parcel-created");

    await page.goto(`${baseUrl}/client/tracking?ref=${encodeURIComponent(trackingRef)}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const trackingText = await pageText(page);
    if (!trackingText.includes(trackingRef)) result.issues.push("seeded parcel tracking reference not visible");
    await page.getByRole("button", { name: /chat/i }).click().catch(() => result.issues.push("chat button not clickable"));
    await page.locator("textarea").last().fill("Hello, QA checking courier communication.");
    await shot("tracking-chat-filled");
    await page.getByRole("button", { name: /send/i }).last().click();
    await page.waitForTimeout(1200);
    const afterChat = await pageText(page);
    if (/Something went wrong|Request failed|error/i.test(afterChat)) result.issues.push("tracking chat produced visible error");
    await page.getByRole("button", { name: /call/i }).click().catch(() => result.issues.push("call action not clickable"));
    await shot("tracking-chat-call");
  });
}

async function runAdminWorkflows(browser, sessions) {
  await recordWorkflow(browser, "admin-create-agent-courier-staff-and-search", "ADMIN", sessions.ADMIN, async (page, result, shot) => {
    const suffix = String(Date.now()).slice(-6);
    await page.goto(`${baseUrl}/admin/users/agents`, { waitUntil: "domcontentloaded" });
    await clickVisible(page, page.getByRole("button", { name: /add|new|agent/i }).first());
    await page.locator("#fullName").fill(`QA UI Agent ${suffix}`);
    await page.locator("#phone").fill(`+237620${suffix}`);
    await page.locator("#email").fill(`qa.ui.agent.${suffix}@smartcampost.local`);
    await page.locator("#password").fill(qaPassword);
    await shot("agent-create-filled");
    await page.getByRole("button", { name: /create|save/i }).last().click();
    await page.waitForFunction(
      (name) => (document.body?.innerText || "").includes(name),
      `QA UI Agent ${suffix}`,
      { timeout: 8_000 },
    ).catch(() => {});
    if (!(await pageText(page)).includes(`QA UI Agent ${suffix}`)) {
      await fillFirstVisibleEditablePlaceholder(page, /search/i, `QA UI Agent ${suffix}`);
      await page.waitForFunction(
        (name) => (document.body?.innerText || "").includes(name),
        `QA UI Agent ${suffix}`,
        { timeout: 8_000 },
      ).catch(() => {});
    }
    let text = await pageText(page);
    if (!text.includes(`QA UI Agent ${suffix}`)) result.issues.push("created agent not visible in agent table");
    await shot("agent-created");

    await page.goto(`${baseUrl}/admin/users/couriers`, { waitUntil: "domcontentloaded" });
    await clickVisible(page, page.getByRole("button", { name: /add|new|courier/i }).first());
    await page.locator("#fullName").fill(`QA UI Courier ${suffix}`);
    await page.locator("#phone").fill(`+237621${suffix}`);
    await page.locator("#email").fill(`qa.ui.courier.${suffix}@smartcampost.local`);
    await page.locator("#password").fill(qaPassword);
    await page.locator("#vehicleId").fill(`QAC-${suffix}`);
    await shot("courier-create-filled");
    await page.getByRole("button", { name: /create|save/i }).last().click();
    await page.waitForFunction(
      (name) => (document.body?.innerText || "").includes(name),
      `QA UI Courier ${suffix}`,
      { timeout: 8_000 },
    ).catch(() => {});
    if (!(await pageText(page)).includes(`QA UI Courier ${suffix}`)) {
      await fillFirstVisibleEditablePlaceholder(page, /search/i, `QA UI Courier ${suffix}`);
      await page.waitForFunction(
        (name) => (document.body?.innerText || "").includes(name),
        `QA UI Courier ${suffix}`,
        { timeout: 8_000 },
      ).catch(() => {});
    }
    text = await pageText(page);
    if (!text.includes(`QA UI Courier ${suffix}`)) result.issues.push("created courier not visible in courier table");
    await shot("courier-created");

    await page.goto(`${baseUrl}/admin/users/staff`, { waitUntil: "domcontentloaded" });
    await clickVisible(page, page.getByRole("button", { name: /add|new|staff|member/i }).first());
    await page.locator("#fullName").fill(`QA UI Staff ${suffix}`);
    await page.locator("#phone").fill(`+237622${suffix}`);
    await page.locator("#email").fill(`qa.ui.staff.${suffix}@smartcampost.local`);
    await page.locator("#password").fill(qaPassword);
    await shot("staff-create-filled");
    await page.getByRole("button", { name: /create|save/i }).last().click();
    await page.waitForFunction(
      (name) => (document.body?.innerText || "").includes(name),
      `QA UI Staff ${suffix}`,
      { timeout: 8_000 },
    ).catch(() => {});
    if (!(await pageText(page)).includes(`QA UI Staff ${suffix}`)) {
      await fillFirstVisibleEditablePlaceholder(page, /search/i, `QA UI Staff ${suffix}`);
      await page.waitForFunction(
        (name) => (document.body?.innerText || "").includes(name),
        `QA UI Staff ${suffix}`,
        { timeout: 8_000 },
      ).catch(() => {});
    }
    text = await pageText(page);
    if (!text.includes(`QA UI Staff ${suffix}`)) result.issues.push("created staff not visible in staff table");
    await shot("staff-created");
  });
}

async function runRoleComponentWorkflows(browser, sessions) {
  for (const role of ["AGENT", "COURIER", "STAFF", "FINANCE", "RISK"]) {
    await recordWorkflow(browser, `${role.toLowerCase()}-component-smoke`, role, sessions[role], async (page, result, shot) => {
      const route = {
        AGENT: "/agent/scan",
        COURIER: "/courier/route-optimization",
        STAFF: "/staff/notification-templates",
        FINANCE: "/finance/payments",
        RISK: "/risk/alerts",
      }[role];
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await shot("initial");
      const text = await pageText(page);
      if (/Something went wrong|Request failed with status code|Cannot read properties|TypeError/i.test(text)) {
        result.issues.push(`${role} component smoke page shows an error banner`);
      }
      const didFillSearch = await fillFirstVisibleEditablePlaceholder(page, /search|track|filter/i, "QA");
      if (didFillSearch) {
        await page.waitForTimeout(300);
        await shot("search-filled");
      }
      const languageToggle = page.getByRole("button", { name: /^FR$/i }).or(page.getByRole("button", { name: /français/i })).first();
      if (await languageToggle.count()) {
        await languageToggle.click().catch(() => result.issues.push(`${role} FR language control not clickable`));
        await page.waitForTimeout(500);
        await shot("language-fr");
        await page.getByRole("button", { name: /^EN$/i }).first().click().catch(() => result.issues.push(`${role} EN language control not clickable`));
      }
    });
  }
}

async function runRbacCrossRoleWorkflows(browser, sessions) {
  const attempts = [
    ["CLIENT", "/admin", /unauthorized|not authorized|login|client|dashboard/i, "client-admin-block"],
    ["AGENT", "/client", /unauthorized|not authorized|login|agent|dashboard/i, "agent-client-block"],
    ["STAFF", "/admin/rbac-permissions", /unauthorized|not authorized|login|staff|dashboard/i, "staff-admin-rbac-block"],
    ["FINANCE", "/risk", /unauthorized|not authorized|login|finance|dashboard/i, "finance-risk-block"],
    ["RISK", "/finance", /unauthorized|not authorized|login|risk|dashboard/i, "risk-finance-block"],
  ];
  for (const [role, route, expected, name] of attempts) {
    await recordWorkflow(browser, name, role, sessions[role], async (page, result, shot) => {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      const text = await pageText(page);
      await shot("result");
      if (/Dynamic RBAC permissions|Admin Dashboard|User Management|Risk dashboard|Finance dashboard/i.test(text) && !expected.test(text)) {
        result.issues.push(`${role} appears to access forbidden route ${route}`);
      }
      if (!expected.test(text)) {
        result.issues.push(`forbidden route ${route} did not show an obvious block/redirect state`);
      }
    });
  }
}

const sessions = await seedUsersAndData();
const launchOptions = { headless: true };
if (process.env.QA_BROWSER_CHANNEL) {
  launchOptions.channel = process.env.QA_BROWSER_CHANNEL;
}
const browser = await chromium.launch(launchOptions);
try {
  if (runPages) {
    if (shouldRunRole("PUBLIC")) {
      for (const route of roleRoutes.PUBLIC) {
        await inspectPage(browser, "PUBLIC", null, route);
      }
    }
    for (const [role, routes] of Object.entries(roleRoutes)) {
      if (role === "PUBLIC" || !shouldRunRole(role)) continue;
      for (const route of routes) {
        await inspectPage(browser, role, sessions[role], route);
      }
    }
  }

  if (runWorkflows) {
    await runPublicWorkflows(browser);
    await runClientWorkflows(browser, sessions);
    await runAdminWorkflows(browser, sessions);
    await runRoleComponentWorkflows(browser, sessions);
    await runRbacCrossRoleWorkflows(browser, sessions);
  }
} finally {
  await browser.close().catch(() => {});
  report.finishedAt = new Date().toISOString();
  saveReport();
}

const pageIssues = report.pages.filter((item) => item.issues.length);
const workflowIssues = report.workflows.filter((item) => item.issues.length);
console.log(`Local E2E manual QA complete. Pages: ${report.pages.length}, page issues: ${pageIssues.length}. Workflows: ${report.workflows.length}, workflow issues: ${workflowIssues.length}. Report: ${path.join(outputDir, "report.json")}`);
if (pageIssues.length || workflowIssues.length) process.exitCode = 1;
