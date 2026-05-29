# SmartCAMPOST — Backend Risks & Issues

## Critical Risks

### RISK-001 — In-Memory Rate Limiting Not Multi-Instance Safe
**Severity:** Critical  
**Component:** `RateLimitFilter.java`  
**Issue:** The token bucket rate limiter uses `ConcurrentHashMap` in-memory per JVM instance. If deployed with horizontal scaling (2+ instances), each instance has its own independent bucket — actual throughput cap becomes `N × limit` per IP.  
**Impact:** Brute-force and DoS attacks bypass intended limits.  
**Fix:** Replace with Redis-backed rate limiting (e.g., Bucket4J + Redis, or Nginx-level limiting).

---

### RISK-002 — In-Memory Account Lockout Not Persistent
**Severity:** Critical  
**Component:** `AccountLockoutService.java`  
**Issue:** Failed login attempt counters and lockout timers are stored in a `ConcurrentHashMap` in JVM memory. An application restart or rolling deployment resets all lockout state.  
**Impact:** Attacker can force restart (DoS the app) to bypass lockout and resume brute-force.  
**Fix:** Persist lockout state in Redis or database with TTL.

---

### RISK-003 — Caffeine Cache Not Shared Across Instances
**Severity:** High  
**Component:** `CacheConfig.java`  
**Issue:** Caffeine is an in-process cache. Multi-instance deployments will have stale or inconsistent cache states (e.g., pricing changes visible on one instance, not another).  
**Impact:** Inconsistent pricing or tariff data shown to users.  
**Fix:** Move shared caches to Redis. Keep Caffeine only for JVM-local, read-only, rarely-changing data.

---

### RISK-004 — JWT Token Invalidation Not Supported
**Severity:** High  
**Component:** `JwtService.java`, `JwtAuthFilter.java`  
**Issue:** No token blocklist or refresh token mechanism exists. Once issued, a JWT is valid until its expiration time (default 8 hours). If a user's account is frozen, their existing JWT remains valid until expiry.  
**Impact:** Frozen/compromised accounts continue to have API access for up to 8 hours after freeze.  
**Fix:** On freeze/logout, add token ID (jti claim) to a short-lived Redis blocklist checked in `JwtAuthFilter`.

---

### RISK-005 — GPS Mandatory in ScanEvent but No Validation Logic
**Severity:** Medium  
**Component:** `ScanEvent.java` — `latitude`, `longitude` columns are `NOT NULL`  
**Issue:** The schema requires GPS, but there is no validation that the coordinates are geographically plausible (e.g., `0.0, 0.0` or coordinates in another country pass validation).  
**Impact:** Fraudulent location data can be submitted. Audit trail becomes unreliable.  
**Fix:** Add bounding-box validation (Cameroon: lat 1.6–13.1, lon 8.5–16.2). Flag outliers as `locationSource=MANUAL` for review.

---

### RISK-006 — No Token Expiry Check for Frozen Users on Each Request
**Severity:** High  
**Component:** `JwtAuthFilter.java`  
**Issue:** The filter extracts the JWT and maps claims to a Spring Authentication, but does not perform a live database lookup to confirm `UserAccount.frozen = false` on each request.  
**Impact:** A frozen user's JWT continues to work. They can still access the API until the token expires.  
**Fix:** Add a `UserDetailsService` that loads the live `UserAccount` on each request and checks `frozen` status.

---

### RISK-007 — OTP Rate Limiting Not Persisted
**Severity:** Medium  
**Component:** OTP endpoints  
**Issue:** OTP send rate limiting (if implemented) relies on in-memory state or only on OTP table queries. A distributed or restarted deployment cannot reliably enforce rate limits across sessions.  
**Impact:** Attacker can flood SMS gateway with OTP requests, causing cost spikes or Twilio account suspension.  
**Fix:** Use Redis counters with TTL for per-phone OTP send rate limiting.

---

### RISK-008 — QR Code HMAC Key in Environment Variable
**Severity:** Medium  
**Component:** QR generation/validation  
**Issue:** The `QR_SECRET_KEY` env var is used to HMAC-sign QR codes. If leaked (via logs, misconfigured CI/CD, or environment variable exposure), an attacker can forge valid QR codes for any parcel.  
**Impact:** Forged QR codes can be used to fraudulently "receive" or manipulate parcels.  
**Fix:** Rotate key capability, store in a secret manager (AWS Secrets Manager, HashiCorp Vault). Log warnings if key length < 32 chars.

---

### RISK-009 — No Refresh Token Mechanism
**Severity:** Medium  
**Component:** Authentication system  
**Issue:** The system only issues access tokens (8h TTL) with no refresh token mechanism. Users are force-logged-out after 8 hours, which is disruptive for long-running sessions. Extending TTL increases exposure risk.  
**Impact:** Poor UX (forced re-auth every 8h) or security risk (long TTL tokens).  
**Fix:** Implement refresh tokens (stored as HttpOnly cookie or secure storage) with short access token TTL (15-30 min).

---

### RISK-010 — Parcel Admin Override Not Fully Audited in ScanEvent
**Severity:** Medium  
**Component:** `ParcelService.adminOverrideLockedParcel()`  
**Issue:** Admin overrides write to `AuditLog` but do not create a `ScanEvent`. The parcel tracking history shows no indication that an admin unlocked and modified the parcel.  
**Impact:** Audit trail in the public-facing tracking history is incomplete; tampering could go undetected by external parties.  
**Fix:** Create a ScanEvent of type `ADMIN_OVERRIDE` alongside the AuditLog entry.

---

## High Risks

### RISK-011 — CORS Wildcard Risk on Dev Config
**Severity:** Medium  
**Component:** `SecurityConfig.java` / `WebConfig.java`  
**Issue:** Dev CORS config allows `localhost:5173-5176`. If the `CORS_ALLOWED_ORIGINS` env var is not set in production, the app may fall back to localhost-based origins or a misconfigured state.  
**Impact:** Cross-origin requests might be blocked or, conversely, allowed from unintended origins.  
**Fix:** Make `CORS_ALLOWED_ORIGINS` a required variable; fail startup if not set in production.

---

### RISK-012 — No Input Sanitization for Free-Text Fields
**Severity:** Medium  
**Component:** Parcel `descriptionComment`, `validationComment`, ScanEvent `comment`  
**Issue:** Free-text fields are stored and returned as-is. While JPA prevents SQL injection via parameterized queries, there is no XSS sanitization of stored text.  
**Impact:** If any of these values are rendered as HTML in a frontend without sanitization, stored XSS is possible.  
**Fix:** Sanitize or escape all free-text user inputs before storage. Ensure frontends use text-only rendering.

---

### RISK-013 — MTN MoMo Webhook Not Authenticated
**Severity:** High  
**Component:** `POST /api/payments/mtn/**`  
**Issue:** The MTN MoMo webhook endpoint is publicly accessible (`SecurityConfig` marks it as `permitAll()`). If there is no webhook signature verification logic in `MtnController`, any actor can POST fake payment confirmations.  
**Impact:** Forged payment success webhooks could mark unpaid parcels as paid.  
**Fix:** Verify MTN's webhook signature/IP whitelist on every inbound webhook. Reject requests failing verification.

---

### RISK-014 — No Database Connection Pooling Config Visible
**Severity:** Low-Medium  
**Component:** `application.properties`  
**Issue:** No explicit HikariCP pool size or timeout configuration is present. Default HikariCP pool size (10) may be insufficient under load.  
**Impact:** Database connection exhaustion under load → 500 errors.  
**Fix:** Set explicit pool sizes: `spring.datasource.hikari.maximum-pool-size`, `minimum-idle`, `connection-timeout`.

---

### RISK-015 — Delivery OTP Sent to Hardcoded Phone in Test Paths
**Severity:** Low  
**Component:** Delivery OTP flow  
**Issue:** If test/staging environments use the same Twilio account, delivery OTPs could be sent to real phone numbers during QA testing.  
**Impact:** Real users may receive unexpected SMS messages.  
**Fix:** Use Twilio test credentials or a mock SMS service in non-production environments (`NOTIFICATION_GATEWAY=mock` env already exists but must be enforced).

---

## Medium Risks

### RISK-016 — No API Versioning
**Severity:** Medium  
**Issue:** All endpoints are under `/api/` with no version prefix (e.g., `/api/v1/`). Breaking changes to API contracts will break all connected clients (frontend web, mobile app) simultaneously.  
**Fix:** Introduce `/api/v1/` prefix and maintain it through API evolution.

---

### RISK-017 — Soft-Delete Not Implemented
**Severity:** Low  
**Issue:** Entities are hard-deleted. There is no `deletedAt` or `active` flag on most entities to support soft-delete/recovery patterns.  
**Impact:** Accidental deletions are unrecoverable. GDPR right-to-erasure vs. audit obligations create a tension.  
**Fix:** Add `deletedAt: Instant` nullable column to key entities. Filter `WHERE deleted_at IS NULL` in repositories.

---

### RISK-018 — Spring AI / OpenAI Key Security
**Severity:** Medium  
**Issue:** `OPENAI_API_KEY` is loaded from environment. If the key is exposed, all AI interactions (prompts, delivery data) could be intercepted and the key used to incur costs.  
**Fix:** Rotate key immediately if suspected exposure. Use secret manager, not env vars, in production.

---

### RISK-019 — No Idempotency on Parcel Creation
**Severity:** Low  
**Issue:** Double-tap on "Create Parcel" or network retry can create duplicate parcels. There is a unique `trackingRef` but it is server-generated, so the client cannot prevent double submission.  
**Fix:** Accept an `idempotencyKey` header. Cache responses per key for 24 hours.

---

## Summary Table

| ID | Severity | Component | Issue |
|---|---|---|---|
| RISK-001 | Critical | RateLimitFilter | In-memory rate limit not multi-instance safe |
| RISK-002 | Critical | AccountLockoutService | Lockout state lost on restart |
| RISK-003 | High | CacheConfig | Caffeine cache not shared across instances |
| RISK-004 | High | JwtService | No token invalidation/blocklist |
| RISK-005 | Medium | ScanEvent | GPS coords not geographically validated |
| RISK-006 | High | JwtAuthFilter | Frozen users still pass JWT auth |
| RISK-007 | Medium | OTP endpoints | OTP rate limiting not persistent |
| RISK-008 | Medium | QR system | HMAC key exposure = forged QR codes |
| RISK-009 | Medium | Auth | No refresh token mechanism |
| RISK-010 | Medium | Admin override | Override not recorded in ScanEvent history |
| RISK-011 | Medium | CORS | Dev origins may leak to production |
| RISK-012 | Medium | Free-text fields | No XSS sanitization on stored text |
| RISK-013 | High | MTN webhook | No webhook signature verification |
| RISK-014 | Medium | Database | No explicit connection pool config |
| RISK-015 | Low | Delivery OTP | OTPs may hit real phones in test env |
| RISK-016 | Medium | All APIs | No API versioning |
| RISK-017 | Low | All entities | Hard-delete only, no soft-delete |
| RISK-018 | Medium | AI integration | OpenAI key security |
| RISK-019 | Low | Parcel creation | No idempotency key |
