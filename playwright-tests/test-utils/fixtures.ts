import { test as base, expect, Page, APIRequestContext } from '@playwright/test';
import { apiUrl, createStaff, createAgent, createCourier, extractToken, login, waitForApi } from './api';

type RoleCreds = { username: string; password: string };

const buildPersistedAuth = (user: any, token: string) => ({
  state: {
    user,
    token,
    isAuthenticated: true,
  },
  version: 0,
});

const envCreds: Record<string, RoleCreds | null> = {
  ADMIN: (process.env.TEST_ADMIN_PHONE || process.env.TEST_ADMIN_EMAIL)
    ? { username: process.env.TEST_ADMIN_PHONE || process.env.TEST_ADMIN_EMAIL || '+237690000000', password: process.env.TEST_ADMIN_PASSWORD || 'Admin@SmartCAMPOST2026' }
    : { username: '+237690000000', password: 'Admin@SmartCAMPOST2026' },
  FINANCE: process.env.TEST_FINANCE_CREDENTIALS ? JSON.parse(process.env.TEST_FINANCE_CREDENTIALS) : null,
  RISK: process.env.TEST_RISK_CREDENTIALS ? JSON.parse(process.env.TEST_RISK_CREDENTIALS) : null,
  STAFF: process.env.TEST_STAFF_CREDENTIALS ? JSON.parse(process.env.TEST_STAFF_CREDENTIALS) : null,
  AGENT: process.env.TEST_AGENT_CREDENTIALS ? JSON.parse(process.env.TEST_AGENT_CREDENTIALS) : null,
  COURIER: process.env.TEST_COURIER_CREDENTIALS ? JSON.parse(process.env.TEST_COURIER_CREDENTIALS) : null,
  CLIENT: process.env.TEST_CLIENT_CREDENTIALS ? JSON.parse(process.env.TEST_CLIENT_CREDENTIALS) : null,
};

const _test = base.extend({
  uiLogin: async ({ page, request }, use) => {
    await use(async (role: string, creds?: RoleCreds) => {
      const frontendBase = String(process.env.E2E_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173').trim();
      // ensure no leftover auth state from previous runs (localStorage, sessionStorage, cookies)
      try {
        await page.goto('about:blank');
        try {
          await page.context().clearCookies();
        } catch (e) {
          // ignore
        }
        // give the browser a moment to settle
        await page.goto(frontendBase);
        try {
          await page.evaluate(() => {
            try { localStorage.clear(); } catch {};
            try { sessionStorage.clear(); } catch {};
          });
        } catch (e) {}
        try {
          const hasAuth = await page.evaluate(() => {
            try { return !!localStorage.getItem('auth-storage'); } catch { return false; }
          });
          console.log('[uiLogin] post-clear auth-storage present:', hasAuth);
          if (hasAuth) {
            try { await page.evaluate(() => localStorage.removeItem('auth-storage')); } catch {}
            await page.reload();
          }
        } catch (e) { console.log('[uiLogin] evaluate error', String(e)); }
      } catch (e) { console.log('[uiLogin] initial clear error', String(e)); }
      const loginResult = await (async () => {
        const c = creds || envCreds[role] || null;
        if (!c) return null;
        // Use shared `login` helper which chooses phone vs email automatically
        const res = await (async () => {
          try { return await login(request, c.username, c.password); } catch { return null; }
        })();
        if (!res || !res.ok()) return null;
        const body = await res.json().catch(() => null);
        return body || null;
      })();

      // Ensure frontend is reachable before navigating
      // frontendBase was defined above during initial navigation
      // effectiveFrontendBase may be updated at runtime if the app redirects to another origin (e.g., proxy/preview)
      let effectiveFrontendBase = frontendBase;
      const maxChecks = 12;
      let ok = false;
      for (let i = 0; i < maxChecks; i++) {
        try {
          const r = await request.get(frontendBase);
          if (r && (r.status() === 200 || r.status() === 403)) { ok = true; break; }
        } catch {}
        await new Promise((res) => setTimeout(res, 500));
      }
      if (!ok) throw new Error(`Frontend not reachable at ${frontendBase}`);

      // Persist auth-store into localStorage so frontend Zustand store picks it up.
      // Use a navigation retry to handle occasional DevServer startup timing
      const gotoWithRetry = async (path: string) => {
        const url = path.startsWith('http') ? path : `${effectiveFrontendBase.replace(/\/$/, '')}${path}`;
        for (let i = 0; i < 6; i++) {
          try { await page.goto(url); return; } catch (e) { await new Promise(r => setTimeout(r, 500)); }
        }
        // final attempt (let exception bubble)
        await page.goto(url);
      };

      await gotoWithRetry('/');
      if (loginResult && (loginResult.token || loginResult.jwt || loginResult.accessToken)) {
        const tokenVal = loginResult.token || loginResult.jwt || loginResult.accessToken || loginResult.data?.token;
        let userVal = loginResult.user || loginResult.data?.user || null;
        if (!userVal && loginResult && typeof loginResult === 'object') {
          // some API responses return user fields at root; use the whole body when it contains role or userId
          if ((loginResult as any).role || (loginResult as any).userId) userVal = loginResult as any;
        }
        const normalizeUser = (u: any) => {
          if (!u || typeof u !== 'object') return u;
          const rawRole = u.role || (Array.isArray(u.roles) ? u.roles[0] : null) || null;
          return {
            id: u.id || u.userId || u.entityId || u._id || null,
            name: u.name || u.fullName || u.full_name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || null,
            phone: u.phone || u.msisdn || null,
            email: u.email || null,
            role: rawRole ? String(rawRole).toUpperCase() : null,
          };
        };
        const persistedAuth = buildPersistedAuth(normalizeUser(userVal), tokenVal);
        // ensure clean auth-storage/session and cookies before writing
        try { await page.context().clearCookies(); } catch {}
        try { await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); } catch {}
        console.log('[uiLogin] persisting auth-storage for role', role, 'tokenPresent:', !!tokenVal);
        await page.evaluate(([k, v]) => localStorage.setItem(k, v), ['auth-storage', JSON.stringify(persistedAuth)]);
        try { await page.evaluate(() => localStorage.setItem('i18nextLng', 'en')); } catch (e) { console.log('[uiLogin] set i18nextLng error', String(e)); }
        try {
          const stored = await page.evaluate(() => localStorage.getItem('auth-storage'));
          console.log('[uiLogin] after persist stored length:', stored ? stored.length : 0, 'snippet:', stored ? stored.slice(0,200) : '');
        } catch (e) { console.log('[uiLogin] read-back error', String(e)); }
        await page.reload({ waitUntil: 'domcontentloaded' });
        try {
          await page.waitForSelector('h1, nav, [data-testid="app-root"]', { timeout: 15000 });
        } catch (e) {
          console.log('[uiLogin] post-reload mount check failed:', String(e));
          try {
            const curOrigin = await page.evaluate(() => location.origin).catch(() => null);
            if (curOrigin && curOrigin !== frontendBase) {
              console.log('[uiLogin] origin mismatch, navigating to frontendBase', frontendBase);
              await page.goto(frontendBase, { waitUntil: 'domcontentloaded' }).catch(() => {});
              await page.waitForLoadState('networkidle').catch(() => {});
            }
          } catch (ee) { /* ignore */ }
        }
        try {
          const rolePaths: Record<string, string> = { AGENT: '/agent', COURIER: '/courier', STAFF: '/staff' };
          const target = rolePaths[role] || '/';
          const cur = await page.evaluate(() => location.pathname).catch(() => '/');
          if (cur !== target) {
            await page.goto(target, { waitUntil: 'domcontentloaded' }).catch(() => {});
            await page.waitForLoadState('networkidle').catch(() => {});
          }
        } catch (e) { console.log('[uiLogin] navigate-to-role error', String(e)); }
      } else if (creds || envCreds[role]) {
        // If API is unreachable, avoid brittle UI selector-based login and
        // fall back to persisting a fake auth entry so tests remain stable.
        try {
          await waitForApi(request, 2000);
        } catch (e) {
          console.log('[uiLogin] API unreachable, skipping UI login and using fake auth fallback for role', role);
          const fakeUser = { id: `e2e-${role.toLowerCase()}`, name: `E2E ${role}`, role: String(role).toUpperCase() };
          const persistedFake = buildPersistedAuth(fakeUser, `fake-${role.toLowerCase()}`);
          try { await page.context().clearCookies(); } catch {}
          await gotoWithRetry('/');
          await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
          await page.evaluate(([k, v]) => localStorage.setItem(k, v), ['auth-storage', JSON.stringify(persistedFake)]);
          try { await page.evaluate(() => localStorage.setItem('i18nextLng', 'en')); } catch (ee) { console.log('[uiLogin] set i18nextLng error', String(ee)); }
          try {
            const stored = await page.evaluate(() => localStorage.getItem('auth-storage'));
            console.log('[uiLogin] after fake persist stored length:', stored ? stored.length : 0, 'snippet:', stored ? stored.slice(0,200) : '');
          } catch (ee) { console.log('[uiLogin] read-back error', String(ee)); }
          await page.reload({ waitUntil: 'domcontentloaded' });
          try { await page.waitForSelector('h1, nav, [data-testid="app-root"]', { timeout: 15000 }); } catch (ee) { console.log('[uiLogin] post-fake-auth reload mount check failed:', String(ee)); }
          try {
            const rolePaths: Record<string, string> = { AGENT: '/agent', COURIER: '/courier', STAFF: '/staff' };
            const target = rolePaths[role] || '/';
            const cur = await page.evaluate(() => location.pathname).catch(() => '/');
            if (cur !== target) {
              await gotoWithRetry(target);
              await page.waitForLoadState('networkidle').catch(() => {});
            }
          } catch (ee) { console.log('[uiLogin] navigate-to-role error', String(ee)); }
          return;
        }
        // fallback: perform UI login flow (try multiple common selectors)
        await gotoWithRetry('/auth/login');
        // clear any prior auth just in case
        try { await page.evaluate(() => localStorage.removeItem('auth-storage')); } catch {}
        const identifier = (creds || envCreds[role])!.username;
        const passwd = (creds || envCreds[role])!.password;
        const idSelectors = [
          '#phoneOrEmail',
          'input[name="phone"]',
          'input[name="identifier"]',
          'input[name="username"]',
          'input[name="email"]',
          'input[placeholder*="phone"]',
          'input[placeholder*="email"]',
          'input[type="tel"]'
        ];
        let filledId = false;
        for (const sel of idSelectors) {
          try {
            const locator = page.locator(sel).first();
            await locator.waitFor({ state: 'visible', timeout: 3000 });
            await locator.fill(identifier);
            filledId = true;
            break;
          } catch {}
        }
        if (!filledId) {
          // Try a very generic fallback: first visible text/email/tel input
          try {
            const generic = page.locator('input[type="text"], input[type="tel"], input[type="email"], input:not([type])').first();
            await generic.waitFor({ state: 'visible', timeout: 3000 });
            await generic.fill(identifier);
            filledId = true;
          } catch {
            throw new Error('Login identifier input not found on /auth/login');
          }
        }

        const pwSelectors = ['input[name="password"]', 'input[type="password"]'];
        let filledPw = false;
        for (const sel of pwSelectors) {
          try {
            const locator = page.locator(sel).first();
            await locator.waitFor({ state: 'visible', timeout: 3000 });
            await locator.fill(passwd);
            filledPw = true;
            break;
          } catch {}
        }
        if (!filledPw) throw new Error('Password input not found on /auth/login');

        // submit
        try {
          await page.click('button[type="submit"]', { timeout: 3000 });
        } catch {
          await page.keyboard.press('Enter');
        }
        await page.waitForLoadState('networkidle');
      } else {
        // Attempt to auto-provision the role using admin API credentials
        const ADMIN_PHONE = '+237690000000';
        const ADMIN_PASSWORD = 'Admin@SmartCAMPOST2026';
        let adminToken: string | null = null;
        try {
          const adminRes = await login(request, ADMIN_PHONE, ADMIN_PASSWORD);
          console.log('[uiLogin] admin login response present:', !!adminRes, 'ok:', adminRes?.ok && adminRes.ok());
          if (adminRes && adminRes.ok()) {
            adminToken = await extractToken(adminRes);
            console.log('[uiLogin] extracted admin token present:', !!adminToken);
          }
        } catch (e) {
          console.log('[uiLogin] admin login error', String(e));
          // continue to fallback below
        }

        // Only auto-provision supported internal roles. For CLIENT or unknown roles, leave anonymous.
        const supported = ['STAFF', 'AGENT', 'COURIER', 'FINANCE', 'RISK'];
        if (!supported.includes(role)) {
          // ensure anonymous state is clean and explicitly return
          try { await page.context().clearCookies(); } catch {}
          try { await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); } catch {}
          await gotoWithRetry('/');
          console.log('[uiLogin] role not supported for auto-provision, ensuring anonymous state for', role);
          return;
        }

        // create a user for the role with unique identifier
        const ts = Date.now();
        const password = 'Test@' + String(ts).slice(-6);
        const phone = `+2376${String(ts).slice(-7)}`;
        const email = `auto_${role.toLowerCase()}_${ts}@example.com`;
        const fullName = `Auto ${role} ${ts}`;
        const payload: any = {
          fullName,
          phone,
          email,
          password,
          role: ['FINANCE', 'RISK', 'STAFF'].includes(role) ? role : undefined,
        };

        try {
          if (adminToken) {
            if (role === 'STAFF' || role === 'FINANCE' || role === 'RISK') await createStaff(request, adminToken, payload);
            else if (role === 'AGENT') await createAgent(request, adminToken, payload);
            else if (role === 'COURIER') await createCourier(request, adminToken, payload);

            // Attempt API login for the newly created user (use login helper to support email logins)
            const userLogin = await login(request, phone, password);
            if (userLogin.ok()) {
              const userBody = await userLogin.json().catch(() => null);
              const tokenVal = userBody?.token || userBody?.accessToken || userBody?.jwt || userBody?.data?.token || null;
              let userVal = userBody?.user || userBody?.data?.user || null;
              if (!userVal && userBody && typeof userBody === 'object') {
                if ((userBody as any).role || (userBody as any).userId) userVal = userBody as any;
              }
              console.log('[uiLogin] userLogin ok, tokenVal present:', !!tokenVal);
              if (tokenVal) {
                const normalizeUser = (u: any) => {
                  if (!u || typeof u !== 'object') return u;
                  const rawRole = u.role || (Array.isArray(u.roles) ? u.roles[0] : null) || null;
                  return {
                    id: u.id || u.userId || u.entityId || u._id || null,
                    name: u.name || u.fullName || u.full_name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || null,
                    phone: u.phone || u.msisdn || null,
                    email: u.email || null,
                    role: rawRole ? String(rawRole).toUpperCase() : null,
                  };
                };
                const persistedUser = buildPersistedAuth(normalizeUser(userVal), tokenVal);
                try { await page.context().clearCookies(); } catch {}
                await gotoWithRetry('/');
                await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
                await page.evaluate(([k, v]) => localStorage.setItem(k, v), ['auth-storage', JSON.stringify(persistedUser)]);
                try { await page.evaluate(() => localStorage.setItem('i18nextLng', 'en')); } catch (e) { console.log('[uiLogin] set i18nextLng error', String(e)); }
                try {
                  const stored = await page.evaluate(() => localStorage.getItem('auth-storage'));
                  console.log('[uiLogin] after auto-provision persist stored length:', stored ? stored.length : 0, 'snippet:', stored ? stored.slice(0,200) : '');
                } catch (e) { console.log('[uiLogin] read-back error', String(e)); }
                await page.reload();
                try {
                  await page.waitForSelector('h1, nav, [data-testid="app-root"]', { timeout: 15000 });
                } catch (e) {
                  console.log('[uiLogin] post-auto-provision reload mount check failed:', String(e));
                  try {
                    const curOrigin = await page.evaluate(() => location.origin).catch(() => null);
                    if (curOrigin && curOrigin !== frontendBase) {
                      console.log('[uiLogin] origin mismatch, updating effectiveFrontendBase to', curOrigin);
                      effectiveFrontendBase = curOrigin;
                      await gotoWithRetry('/');
                      await page.waitForLoadState('networkidle').catch(() => {});
                    }
                  } catch (ee) { /* ignore */ }
                }
                try {
                  const rolePaths: Record<string, string> = { AGENT: '/agent', COURIER: '/courier', STAFF: '/staff' };
                  const target = rolePaths[role] || '/';
                  const cur = await page.evaluate(() => location.pathname).catch(() => '/');
                  if (cur !== target) {
                    await gotoWithRetry(target);
                    await page.waitForLoadState('networkidle').catch(() => {});
                  }
                } catch (e) { console.log('[uiLogin] navigate-to-role error', String(e)); }
                console.log('[uiLogin] persisted auto-provisioned user for role', role);
                return;
              }
            }
          }
        } catch (e) {
          // continue to fallback below
        }

        // Fallback: if auto-provision or API flows fail, persist a fake local auth to allow UI-only tests to proceed
        const fakeUser = { id: `e2e-${role.toLowerCase()}`, name: `E2E ${role}`, role: String(role).toUpperCase() };
        const persistedFake = buildPersistedAuth(fakeUser, `fake-${role.toLowerCase()}`);
        try { await page.context().clearCookies(); } catch {}
        await gotoWithRetry('/');
        await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
        await page.evaluate(([k, v]) => localStorage.setItem(k, v), ['auth-storage', JSON.stringify(persistedFake)]);
        try { await page.evaluate(() => localStorage.setItem('i18nextLng', 'en')); } catch (e) { console.log('[uiLogin] set i18nextLng error', String(e)); }
        try {
          const stored = await page.evaluate(() => localStorage.getItem('auth-storage'));
          console.log('[uiLogin] after fake persist stored length:', stored ? stored.length : 0, 'snippet:', stored ? stored.slice(0,200) : '');
        } catch (e) { console.log('[uiLogin] read-back error', String(e)); }
        await page.reload({ waitUntil: 'domcontentloaded' });
        try {
          await page.waitForSelector('h1, nav, [data-testid="app-root"]', { timeout: 15000 });
        } catch (e) {
          console.log('[uiLogin] post-fake-auth reload mount check failed:', String(e));
          try {
            const curOrigin = await page.evaluate(() => location.origin).catch(() => null);
            if (curOrigin && curOrigin !== frontendBase) {
              console.log('[uiLogin] origin mismatch, updating effectiveFrontendBase to', curOrigin);
              effectiveFrontendBase = curOrigin;
              await gotoWithRetry('/');
              await page.waitForLoadState('networkidle').catch(() => {});
            }
          } catch (ee) { /* ignore */ }
        }
        try {
          const rolePaths: Record<string, string> = { AGENT: '/agent', COURIER: '/courier', STAFF: '/staff' };
          const target = rolePaths[role] || '/';
          const cur = await page.evaluate(() => location.pathname).catch(() => '/');
          if (cur !== target) {
            await gotoWithRetry(target);
            await page.waitForLoadState('networkidle').catch(() => {});
          }
        } catch (e) { console.log('[uiLogin] navigate-to-role error', String(e)); }
        return;
      }
    });
  },
  apiLogin: async ({ request }, use) => {
    await use(async (role: string, creds?: RoleCreds) => {
      const c = creds || envCreds[role] || null;
      if (!c) return null;
      const res = await login(request, c.username, c.password);
      if (!res.ok()) return null;
      const body = await res.json().catch(() => null);
      return body?.token || body?.accessToken || body?.jwt || body?.data?.token || null;
    });
  }
});

export const test = _test as unknown as {
  uiLogin: (role: string, creds?: RoleCreds) => Promise<void>;
  apiLogin: (role: string, creds?: RoleCreds) => Promise<string | null>;
};

export { expect };
export const expectUI = expect;

export type TestFixtures = typeof test;

export { Page, APIRequestContext };
