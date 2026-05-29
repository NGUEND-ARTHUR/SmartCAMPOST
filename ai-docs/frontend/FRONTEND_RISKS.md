# SmartCAMPOST — Frontend Risks & Issues

## Critical

### FE-RISK-001 — JWT Stored in localStorage (XSS Exposure)
**Severity:** Critical  
**Component:** `authStore.ts` (Zustand persist → localStorage)  
**Issue:** The JWT token is stored in `localStorage` under key `auth-storage`. Any JavaScript running on the page (including via XSS) can read the token.  
**Impact:** Token theft → full account compromise for up to 8 hours (JWT TTL).  
**Fix:** Move token to an `httpOnly` cookie (not accessible via JavaScript). The frontend auth state (user object, role) can remain in memory/Zustand; only the token needs the cookie treatment.

---

### FE-RISK-002 — No 401 Handling in Axios Response Interceptor
**Severity:** High  
**Component:** `axiosClient.ts`  
**Issue:** The Axios response interceptor does not catch 401 Unauthorized responses. When a JWT expires, the user gets silent errors or broken UI instead of being redirected to login.  
**Impact:** Expired sessions cause confusing app behavior (empty lists, failed mutations with no feedback).  
**Fix:** Add response interceptor:
```typescript
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
```

---

### FE-RISK-003 — No Token Expiry Check on App Load
**Severity:** High  
**Component:** `authStore.ts`  
**Issue:** When the app loads and hydrates auth state from localStorage, the JWT expiry is not checked. A user with an 8-hour-old stored token will be considered "authenticated" by the store but every API call will fail with 401.  
**Impact:** User sees broken pages until manually logging out.  
**Fix:** On hydration, decode the JWT and check `exp` claim. If expired, call `logout()`.

---

### FE-RISK-004 — Google OAuth Client ID Hardcoded in Source
**Severity:** Medium  
**Component:** `main.tsx`, `.env.development`  
**Issue:** `428837425425-hvbdljimv02i2kapehk51haap4160v68.apps.googleusercontent.com` is hardcoded as the default fallback in source code.  
**Impact:** If the production environment uses a different client ID and `.env.production` is not set, the app silently uses the development client ID, causing Google auth to work in wrong ways.  
**Fix:** Remove hardcoded default. Throw an error at startup if `VITE_GOOGLE_CLIENT_ID` is not set.

---

## High

### FE-RISK-005 — Axios Token Extraction Fragility
**Severity:** High  
**Component:** `axiosClient.ts`  
**Issue:** The interceptor does `JSON.parse(stored)?.state?.token || JSON.parse(stored)?.token` — two different JSON paths. If the Zustand persist schema changes (e.g., nesting changes), token injection silently fails without any error.  
**Impact:** All authenticated API calls fail silently (no Authorization header sent).  
**Fix:** Centralize token access through the Zustand store's selector: `useAuthStore.getState().token`.

---

### FE-RISK-006 — React Query Stale Data on Role Change
**Severity:** Medium  
**Component:** React Query global config  
**Issue:** If a user's role is upgraded or changed by an admin, the cached React Query data (based on old role) remains stale for up to 5 minutes. The user would not see new features available to them.  
**Impact:** UI out of sync with backend role state.  
**Fix:** On login, call `queryClient.clear()` to flush all cached queries.

---

### FE-RISK-007 — No CSRF Protection for State-Changing Requests
**Severity:** Medium  
**Component:** All forms  
**Issue:** The app uses localStorage JWTs with standard Bearer auth, which is not vulnerable to traditional CSRF. However, if any flow is ever changed to cookie-based auth (as recommended in FE-RISK-001), CSRF protection must be added simultaneously.  
**Impact:** Future cookie migration without CSRF protection = critical vulnerability.  
**Note:** Track this as a prerequisite for any cookie-auth migration.

---

### FE-RISK-008 — Parcel Print Label Page Not Protected Against Unauthorized Access
**Severity:** Medium  
**Component:** `PrintLabelPage.tsx` at `/client/parcels/:id/print-label`  
**Issue:** While the route is protected for CLIENT role, there is no server-side check that the parcel being printed belongs to the requesting client. A CLIENT with knowledge of another parcel's UUID could access its label.  
**Impact:** Parcel data (sender/recipient addresses) exposed to unauthorized client.  
**Fix:** Backend should enforce that `parcel.client_id == caller.entityId` on parcel detail requests.

---

### FE-RISK-009 — API Coverage Debug Page Accessible in Production
**Severity:** Low  
**Component:** `ApiCoverage.tsx` at `/admin/api-coverage`  
**Issue:** A debug page listing all API endpoints and their coverage status is accessible to any ADMIN in production. This page reveals the system's internal API surface.  
**Impact:** Information disclosure about internal endpoints to any admin-level attacker.  
**Fix:** Gate the `/admin/api-coverage` route behind a `NODE_ENV === 'development'` check or remove from production build.

---

## Medium

### FE-RISK-010 — No Input Sanitization on Free-Text Fields
**Severity:** Medium  
**Component:** Forms in `CreateParcel`, `ScanConsole`, support tickets  
**Issue:** Free-text fields (description, comments) are submitted directly without HTML sanitization. If the backend stores them raw and the frontend renders them as HTML (not text), stored XSS is possible.  
**Impact:** Stored XSS if backend data is rendered unsafely.  
**Fix:** Ensure all text fields render via React's default text rendering (not `dangerouslySetInnerHTML`). Audit all data display for XSS risk.

---

### FE-RISK-011 — Offline Sync Hook May Replay Events
**Severity:** Medium  
**Component:** `useOfflineSync.ts`  
**Issue:** The offline sync queue uses localStorage to persist events. If a sync request partially succeeds (some events saved, connection drops mid-request), the remaining events are re-sent, potentially creating duplicate scan events.  
**Impact:** Duplicate scan events in the parcel history.  
**Fix:** The backend `/api/sync/scan-events` should implement idempotent deduplication by `parcelId + offlineCreatedAt`. Frontend should mark synced events individually.

---

### FE-RISK-012 — MTN Test Page Reachable in Production
**Severity:** Low  
**Component:** `MtnTest.tsx` at `/mtn-test`  
**Issue:** A payment test page with no role protection is accessible at `/mtn-test` in production.  
**Impact:** Any user can access a payment testing interface.  
**Fix:** Remove from production router or add ADMIN role guard.

---

### FE-RISK-013 — i18n Key Missing for Some Error Codes
**Severity:** Low  
**Component:** `lib/api.ts` error code mapping  
**Issue:** Not all backend error codes (168+ total) have corresponding i18n mappings. Unknown error codes fall through to a generic message or raw backend message.  
**Impact:** Non-translated, technical error messages shown to French users.  
**Fix:** Audit all `ErrorCode` enum values against i18n `en.json` / `fr.json` translation files and add missing keys.

---

### FE-RISK-014 — React Query DevTools in Production
**Severity:** Low  
**Component:** `App.tsx` or `main.tsx`  
**Issue:** React Query DevTools may be enabled in production builds if not gated on `process.env.NODE_ENV`.  
**Impact:** Performance overhead + reveals internal query structure to end users.  
**Fix:** Ensure DevTools render only in `import.meta.env.DEV` mode.

---

## Summary Table

| ID | Severity | Component | Issue |
|---|---|---|---|
| FE-RISK-001 | Critical | authStore | JWT in localStorage — XSS risk |
| FE-RISK-002 | High | axiosClient | No 401 response interceptor |
| FE-RISK-003 | High | authStore | No JWT expiry check on app load |
| FE-RISK-004 | Medium | main.tsx | Google OAuth client ID hardcoded |
| FE-RISK-005 | High | axiosClient | Fragile token extraction |
| FE-RISK-006 | Medium | React Query | Stale data after role change |
| FE-RISK-007 | Medium | All forms | CSRF risk if migrating to cookies |
| FE-RISK-008 | Medium | PrintLabelPage | No server-side parcel ownership check |
| FE-RISK-009 | Low | ApiCoverage | Debug page reachable in production |
| FE-RISK-010 | Medium | All forms | No free-text sanitization |
| FE-RISK-011 | Medium | useOfflineSync | Potential event replay on sync |
| FE-RISK-012 | Low | MtnTest | Payment test page unguarded |
| FE-RISK-013 | Low | lib/api.ts | Incomplete i18n error code mapping |
| FE-RISK-014 | Low | App.tsx | React Query DevTools in production |
