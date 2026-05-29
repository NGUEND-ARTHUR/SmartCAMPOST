# SmartCAMPOST — Global Risks

This document consolidates all critical cross-cutting risks across the backend, frontend, and mobile, grouped by severity and category.

---

## CRITICAL — Must Fix Before Production

### GR-01 — No Token Invalidation / Refresh Across All Clients
**Layer:** Backend + Web + Mobile  
**Issue:** JWTs are issued with 8-hour TTL and no revocation mechanism. Frozen/compromised users retain API access for up to 8 hours. No refresh token means users are force-logged-out after 8h.  
**Impact:** Security breach window = up to 8 hours. Poor UX for long sessions.  
**Fix:** Implement refresh tokens (15-min access token + 30-day refresh token). Add JWT blocklist (Redis) checked on each request. Handle token refresh transparently in web and mobile interceptors.

---

### GR-02 — In-Memory Security State Not Multi-Instance Safe
**Layer:** Backend  
**Issue:** Both rate limiting (RateLimitFilter) and account lockout (AccountLockoutService) use in-memory JVM state. In horizontally-scaled deployments, each instance has independent state.  
**Impact:** Rate limits and lockout bypass-able by hitting different instances. Application restart resets all lockout counters.  
**Fix:** Redis-backed rate limiting (Bucket4J + Lettuce) and Redis-backed lockout counters.

---

### GR-03 — No Offline Database in Mobile (Critical for Core Use Case)
**Layer:** Mobile  
**Issue:** Agents and couriers — the primary field users — operate in areas with poor connectivity. The app has no local database. All scan events, validations, and delivery confirmations require live network.  
**Impact:** Any connectivity interruption during parcel intake or delivery confirmation = data loss.  
**Fix:** Implement Hive/Drift local database. Queue scan events and delivery actions locally. Use workmanager for background sync. This is the single most important mobile gap.

---

### GR-04 — JWT Stored in localStorage (XSS Exposure — Web)
**Layer:** Frontend Web  
**Issue:** The JWT is stored in localStorage via Zustand persist. Any XSS vulnerability can steal the token.  
**Impact:** Token theft = full account takeover for up to 8 hours.  
**Fix:** Move to httpOnly cookie for the token. Keep user object in memory/Zustand.

---

### GR-05 — MTN MoMo Webhook Not Authenticated
**Layer:** Backend  
**Issue:** `POST /api/payments/mtn/**` is public (no auth required). If webhook signature verification is missing from MtnController, any actor can POST fake payment confirmations.  
**Impact:** Forged webhooks mark parcels as paid without actual payment.  
**Fix:** Verify MTN webhook signatures on every inbound request. Reject unsigned requests.

---

## HIGH — Fix Before Launch

### GR-06 — 401 Does Not Redirect to Login (Web + Mobile)
**Layer:** Web + Mobile  
**Issue:** Expired JWT causes 401 responses, but neither the web Axios interceptor nor the mobile Dio interceptor navigate the user to the login screen.  
**Impact:** Users see empty/broken UI after token expiry with no explanation.  
**Fix:** Add response interceptor: on 401, clear auth state and redirect to login.

---

### GR-07 — No JWT Expiry Check on App Start (Web + Mobile)
**Layer:** Web + Mobile  
**Issue:** Stored JWTs are restored without checking the `exp` claim. Users with expired tokens are routed to their dashboards, then all API calls fail silently.  
**Fix:** Decode JWT on startup, compare `exp` to current time, logout if expired.

---

### GR-08 — No Push Notifications (Mobile Critical Gap)
**Layer:** Mobile  
**Issue:** Couriers and agents have no way to receive real-time assignment notifications without manually refreshing the app.  
**Impact:** Assignments missed. Deliveries delayed.  
**Fix:** Firebase Cloud Messaging integration. Handle foreground + background notifications with deep links.

---

### GR-09 — Frozen Users Retain API Access Until JWT Expiry
**Layer:** Backend  
**Issue:** JwtAuthFilter does not perform a live database check for `UserAccount.frozen = false` on each request. Once a user is frozen, their existing JWT continues to work for up to 8 hours.  
**Fix:** Add live `UserAccount` lookup in the filter, check frozen flag per request, or implement token blocklist.

---

## MEDIUM — Fix in Next Sprint

### GR-10 — Google OAuth Client ID Hardcoded Across All Clients
**Layer:** Web + Mobile  
**Issue:** `428837425425-hvbdljimv02i2kapehk51haap4160v68.apps.googleusercontent.com` is hardcoded as a fallback in web `.env.development` and mobile `login_screen.dart`. Production builds may use the wrong client ID.  
**Fix:** Remove hardcoded fallbacks. Require explicit environment configuration. Document in deployment guide.

---

### GR-11 — No API Versioning
**Layer:** Backend  
**Issue:** All endpoints are at `/api/` with no version prefix. Breaking changes will simultaneously break web and mobile clients.  
**Fix:** Introduce `/api/v1/` prefix now, before any breaking API changes are needed.

---

### GR-12 — No Idempotency on Parcel Creation
**Layer:** Backend + Web + Mobile  
**Issue:** Double-tap or network retry can create duplicate parcels. No `idempotencyKey` mechanism.  
**Fix:** Accept `X-Idempotency-Key` header on POST endpoints. Cache responses per key for 24h.

---

### GR-13 — Invoice Download Not Implemented (Web + Mobile)
**Layer:** Web + Mobile  
**Issue:** Backend generates invoices (PDFBox) but no client UI allows downloading them. Finance users and clients cannot access their invoices.  
**Fix:** Implement `GET /api/invoices/{id}/pdf` download in web `InvoicesPage.tsx` and mobile.

---

### GR-14 — Analytics Dashboards Are Stubs
**Layer:** Web + Mobile  
**Issue:** Analytics pages exist in both clients but show no real data. This is a core feature for ADMIN, STAFF, and FINANCE roles.  
**Fix:** Wire analytics pages to backend analytics endpoints. Implement charts (Recharts/FL Chart already available).

---

### GR-15 — Delivery Photo Proof Not in Mobile
**Layer:** Mobile  
**Issue:** `image_picker` is installed but unused. Backend supports `DeliveryProof.proofType = PHOTO`. Couriers have no way to capture photographic proof of delivery.  
**Fix:** Add camera capture + upload in `DeliveryConfirmationScreen`.

---

### GR-16 — Offline Indicator Missing from All Clients
**Layer:** Web + Mobile  
**Issue:** Neither client shows a banner or message when network is unavailable. Users get cryptic timeout errors.  
**Fix:** Web: detect offline via `window.addEventListener('offline', ...)`. Mobile: use `connectivity_plus` (already installed). Show banner + disable submit buttons.

---

### GR-17 — GPS Coordinates Not Geographically Validated
**Layer:** Backend  
**Issue:** `ScanEvent.latitude/longitude` are NOT NULL but not bounds-checked. Coordinates of `0.0, 0.0` or points outside Cameroon are accepted.  
**Fix:** Add service-layer validation: latitude 1.6–13.1, longitude 8.5–16.2 for Cameroon. Flag out-of-bounds as `locationSource = MANUAL` and create a risk alert.

---

## LOW — Technical Debt

### GR-18 — MTN Test Page + API Debug Page in Production
**Layer:** Web  
**Paths:** `/mtn-test` (no auth), `/admin/api-coverage`  
**Fix:** Remove from production router or add environment gating.

---

### GR-19 — Caffeine Cache Not Shared Across Backend Instances
**Layer:** Backend  
**Fix:** Migrate shared caches to Redis for multi-instance deployments.

---

### GR-20 — No Soft-Delete on Entities
**Layer:** Backend  
**Fix:** Add `deletedAt` nullable column to key entities (Client, Staff, Parcel, Agent, Courier).

---

## Risk Summary Table

| ID | Severity | Category | Layer | Status |
|---|---|---|---|---|
| GR-01 | Critical | Security | All | Open |
| GR-02 | Critical | Security | Backend | Open |
| GR-03 | Critical | Functionality | Mobile | Open |
| GR-04 | Critical | Security | Web | Open |
| GR-05 | Critical | Security | Backend | Open |
| GR-06 | High | UX/Security | Web+Mobile | Open |
| GR-07 | High | UX/Security | Web+Mobile | Open |
| GR-08 | High | Functionality | Mobile | Open |
| GR-09 | High | Security | Backend | Open |
| GR-10 | Medium | Config | All | Open |
| GR-11 | Medium | Architecture | Backend | Open |
| GR-12 | Medium | Data Integrity | All | Open |
| GR-13 | Medium | Functionality | Web+Mobile | Open |
| GR-14 | Medium | Functionality | Web+Mobile | Open |
| GR-15 | Medium | Functionality | Mobile | Open |
| GR-16 | Medium | UX | Web+Mobile | Open |
| GR-17 | Medium | Data Integrity | Backend | Open |
| GR-18 | Low | Security | Web | Open |
| GR-19 | Low | Performance | Backend | Open |
| GR-20 | Low | Data | Backend | Open |
