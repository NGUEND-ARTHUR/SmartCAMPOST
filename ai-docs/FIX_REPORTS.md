# SmartCAMPOST — Fix Reports

**Date:** 2026-05-29  
**QA Engineer:** Claude Sonnet 4.6 (Autonomous QA Mode)  
**Final Test Result:** 289 passed, 1 skipped, 0 failed

---

## Fix #1 — Frozen Account Login Bypass (SECURITY BUG)

**Severity:** HIGH  
**Type:** Security — Authentication Bypass  
**File:** `backend/src/main/java/com/smartcampost/backend/service/impl/AuthServiceImpl.java`  
**Method:** `login()`  

**Problem:** The `login()` method validated password and generated a JWT token without checking the `frozen` field on `UserAccount`. Frozen accounts could log in and receive valid tokens.

**Root Cause:** Missing authorization check in the login flow.

**Fix Applied:**
```java
// SECURITY: Block login for frozen accounts
if (Boolean.TRUE.equals(user.isFrozen())) {
    throw new AuthException(
        ErrorCode.AUTH_ACCOUNT_LOCKED,
        "Account is frozen. Contact support to restore access."
    );
}
```

**Location:** After password validation, before `jwtService.generateToken()`  
**Impact:** Frozen accounts now receive 423 (Locked) and cannot access the system.

---

## Fix #2 — AccessDeniedException Returns 400 Instead of 403 (SECURITY BUG)

**Severity:** HIGH  
**Type:** Security — HTTP Status Code Masking  
**File:** `backend/src/main/java/com/smartcampost/backend/exception/GlobalExceptionHandler.java`  

**Problem:** `GlobalExceptionHandler` had a generic `@ExceptionHandler(RuntimeException.class)` handler that returned 400 for ALL RuntimeExceptions. Since Spring Security's `AccessDeniedException` extends `RuntimeException`, ALL `@PreAuthorize` failures returned 400 (Bad Request) instead of 403 (Forbidden).

**Impact:**
- Client-facing: Authorization failures were indistinguishable from validation errors
- Security monitoring: Authorization errors could not be distinguished from input errors in logs
- Tests: Tests expecting 403 for role-based access denial were failing

**Root Cause:** Missing specific handler for `AccessDeniedException`; the generic `RuntimeException` catch-all intercepted security exceptions.

**Fix Applied:**
```java
// BEFORE RuntimeException handler — must be declared first!
@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<ErrorResponse> handleAccessDenied(
        AccessDeniedException ex,
        HttpServletRequest request
) {
    return buildErrorResponse(
            "Access denied: insufficient permissions",
            ErrorCode.AUTH_FORBIDDEN,
            request,
            HttpStatus.FORBIDDEN  // 403
    );
}
```

**Affected endpoints:** ALL endpoints with `@PreAuthorize` annotations (parcels, couriers, scan-events, validate-and-lock, etc.)

---

## Fix #3 — Global Test Locale Fixed (English)

**Severity:** MEDIUM  
**Type:** Test Infrastructure — Locale Issue  
**File:** `smartcampost-frontend/e2e/fixtures/global.setup.ts`  

**Problem:** `saveApiAuthState()` wrote Zustand auth state to `auth-storage` localStorage key but did NOT write `i18nextLng`. The Vite dev server running on Windows/Cameroon defaulted to French locale (`fr-CM`), causing all English text-based locators to fail.

**Fix Applied:**
```typescript
const storageState = {
  cookies: [],
  origins: [{
    origin: ORIGIN,
    localStorage: [
      { name: 'auth-storage', value: JSON.stringify(zustandState) },
      { name: 'i18nextLng', value: 'en' },  // ← ADDED
    ],
  }],
};
```

**Impact:** All UI tests now use English locale consistently. 40+ tests that were failing due to French UI text now pass.

---

## Fix #4 — Admin Login by Email Fails (DB has null email)

**Severity:** LOW  
**Type:** Test Data — Credential Issue  
**Files:** Multiple test files  

**Problem:** The bootstrapped admin account (`+237690000000`) has a null `email` field in the H2 database. Tests using `apiLogin(request, 'admin@smartcampost.cm', ...)` failed with 404 (AUTH_USER_NOT_FOUND) because `findByEmail(null)` returns empty.

**Fix Applied:** Changed all test calls from email to phone:
```typescript
// Before (wrong):
await apiLogin(request, 'admin@smartcampost.cm', 'Admin@SmartCAMPOST2026');

// After (correct):
await apiLogin(request, '+237690000000', 'Admin@SmartCAMPOST2026');
```

**Files changed:**
- `e2e/finance/refund-management.spec.ts`
- `e2e/client/create-parcel.spec.ts`
- `e2e/permissions/role-boundaries.spec.ts`

---

## Fix #5 — Port Mismatch (8080 vs 8082)

**Severity:** LOW  
**Type:** Test Infrastructure — Configuration  
**Files:** 17 e2e spec files  

**Problem:** Backend runs on port 8082 but 17 test files used hardcoded fallback `localhost:8080`.

**Fix Applied:** Bulk sed replacement of all `localhost:8080` occurrences with `localhost:8082` across the e2e directory.

---

## Fix #6 — Missing `date-fns` Package

**Severity:** MEDIUM  
**Type:** Dependency — Build Error  
**File:** `package.json` (node_modules)  

**Problem:** `Notifications.tsx` imports `date-fns` (`import { format } from 'date-fns'`) but the package was not in `node_modules`. This caused Vite's dev server to show an error overlay on ALL pages, breaking all UI tests.

**Fix Applied:** `npm install date-fns`

---

## Fix #7 — UUID Type Mismatch in API Test Bodies

**Severity:** LOW  
**Type:** Test Logic — Incorrect Request Body  
**Files:** `e2e/agent/scan-intake.spec.ts`, `e2e/permissions/role-boundaries.spec.ts`  

**Problem:** Tests used non-UUID strings (e.g., `"some-parcel"`, `"x"`) as path variables or body fields for `@PathVariable UUID` or `@RequestBody CreateParcelRequest.senderAddressId (UUID)`. Spring MVC fails JSON deserialization and returns 400 BEFORE `@PreAuthorize` runs, making the test unable to verify authorization.

**Fix Applied:** Changed to nil UUID `'00000000-0000-0000-0000-000000000000'` and added all required fields with valid types so Spring MVC can bind arguments and `@PreAuthorize` can actually run.

---

## Fix #8 — Broken `{ token }` Destructuring Pattern

**Severity:** MEDIUM  
**Type:** Test Logic — Wrong Response Field  
**Files:** `e2e/agent/dashboard.spec.ts`, `e2e/courier/dashboard.spec.ts`  

**Problem:** Tests directly destructured `{ token }` from `loginRes.json()`. The backend returns `{ accessToken: "..." }` (not `token`). Result: `token = undefined`, making all subsequent API calls unauthenticated.

**Fix Applied:** Changed from direct JSON destructuring to using the `apiLogin()` helper which normalizes `accessToken → token`:
```typescript
// Before (wrong):
const { token } = await loginRes.json();

// After (correct):
const result = await apiLogin(request, phone, password);
const token = result.token;
```

---

## Fix #9 — Camera Initialization Blocking Navigation

**Severity:** LOW  
**Type:** Test Stability — Headless Browser Limitation  
**Files:** `e2e/agent/dashboard.spec.ts`, `e2e/agent/scan-intake.spec.ts`  

**Problem:** QRCodeScanner component auto-starts camera on mount. In headless Playwright, `Html5Qrcode.getCameras()` may hang indefinitely waiting for camera permissions, causing `page.goto()` to wait past `navigationTimeout`.

**Fix Applied:** Added `waitUntil: 'domcontentloaded'` to navigation calls on scan/camera pages:
```typescript
await page.goto('/agent/scan', { waitUntil: 'domcontentloaded' });
```

---

## Fix #10 — Git Merge Conflict in `playwright.config.ts`

**Severity:** HIGH (blocked all tests)  
**Type:** Repository Hygiene — Merge Conflict  
**File:** `smartcampost-frontend/playwright.config.ts`  

**Problem:** `playwright.config.ts` contained unresolved git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) which caused Babel parse errors and prevented ALL tests from running.

**Fix Applied:** Resolved conflict by keeping the current HEAD version (proper local config with `BASE_URL`, `API_URL` exports) and discarding the remote branch's `webServer` config (which referenced a different machine's Python script path).

---

## Fix #11 — Legacy Cross-Cutting Tests Used Hardcoded Remote URLs

**Severity:** MEDIUM  
**Type:** Test Infrastructure — Remote URL Dependency  
**Files:** `e2e/api.spec.ts`, `e2e/roles.spec.ts`, `e2e/workflows.spec.ts`, `e2e/edgecases.spec.ts`, `e2e/ui.spec.ts`  

**Problem:** Five cross-cutting test files used hardcoded URLs:
- `https://smartcampost-frontend.vercel.app` (production frontend)
- `https://smartcampost-backend.onrender.com/api` (production backend)

These tests would not work in local development and referenced stale user credentials.

**Fix Applied:** Rewrote all five files to use `process.env.BASE_URL ?? 'http://localhost:5173'` and `process.env.API_URL ?? 'http://localhost:8082'` with proper test user credentials.
