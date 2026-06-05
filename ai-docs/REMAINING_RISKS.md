# SmartCAMPOST — Remaining Risks

**Date:** 2026-05-29  
**QA Engineer:** Claude Sonnet 4.6 (Autonomous QA Mode)

---

## Risk Matrix

| Risk ID | Description | Severity | Likelihood | Mitigation |
|---------|-------------|----------|------------|------------|
| RR-001 | JWT in localStorage — XSS attack vector | HIGH | MEDIUM | Move to httpOnly cookies |
| RR-002 | No token refresh — silent session expiry | MEDIUM | HIGH | Implement refresh tokens |
| RR-003 | Account lockout in-memory — reset on restart | MEDIUM | HIGH | Use Redis for distributed lockout |
| RR-004 | Rate limiting disabled in test mode | HIGH | LOW | Always enable in production |
| RR-005 | H2 in-memory DB — data lost on restart | HIGH (prod) | N/A (dev only) | Production uses PostgreSQL |
| RR-006 | Admin email is null — login only by phone | LOW | LOW | Set admin email in bootstrap |
| RR-007 | Custom Select empty string doesn't show placeholder | LOW | HIGH | Fix `||` vs `??` operator |
| RR-008 | No Content Security Policy headers | MEDIUM | MEDIUM | Configure CSP in SecurityConfig |
| RR-009 | Camera access required for scan console | LOW | HIGH | Provide manual barcode entry fallback |
| RR-010 | OTP codes exposed in API (test mode) | HIGH | LOW | Ensure `expose-code=false` in prod |
| RR-011 | Google OAuth client ID hardcoded | MEDIUM | LOW | Move to environment variable |
| RR-012 | QR code signing key hardcoded in tests | HIGH | LOW | Use proper env var management |

---

## Risk Details

### RR-001 — JWT in localStorage

**Description:** Access tokens stored in `localStorage` are accessible to any JavaScript running in the browser, including third-party scripts and XSS payloads.

**Scenario:** If an XSS vulnerability is introduced in any dependency or user-submitted content, an attacker can steal all active sessions.

**Recommendation:** 
- Use `httpOnly` cookies for JWT storage
- Or implement short-lived tokens (15 min) with refresh tokens stored in httpOnly cookies
- Implement CSP to restrict script sources (mitigates XSS)

---

### RR-002 — No Token Refresh

**Description:** JWT tokens expire after 8 hours. The frontend does not implement automatic token refresh. When a token expires mid-session:
1. API calls return 401
2. User sees error messages or empty data
3. User must manually navigate to login and re-authenticate

**Impact:** Poor user experience; users lose unsaved work.

**Recommendation:** Implement Axios interceptor that detects 401 responses and either refreshes the token (if refresh token exists) or redirects to login.

---

### RR-003 — In-Memory Account Lockout

**Description:** `AccountLockoutService` uses an in-memory `ConcurrentHashMap`. On backend restart, all lockout state is cleared. An attacker performing a brute force attack could restart the backend (if they have system access) to reset the counter.

**Production Risk:** In a distributed deployment (multiple backend instances), lockout state is not shared between instances.

**Recommendation:** Implement lockout storage in Redis with distributed locking. Spring Boot auto-configuration for Redis is already a common pattern.

---

### RR-004 — Rate Limiting Must Be Enabled in Production

**Description:** Rate limiting is disabled for testing via `--smartcampost.security.rate-limit.enabled=false`. If this flag is included in production deployment by mistake, the API is vulnerable to brute force and DoS attacks.

**Recommendation:** 
- Ensure production deployment scripts do NOT include this flag
- Set `smartcampost.security.rate-limit.enabled=true` explicitly in production application.properties
- Add monitoring for unusual request patterns

---

### RR-010 — OTP Codes Exposed in API Response

**Description:** When `smartcampost.otp.expose-code-in-response=true`, the OTP code is returned in the `/api/auth/send-otp` response body. This is a testing convenience but MUST NOT be enabled in production.

**Risk:** Attackers can bypass OTP verification by reading the code from the API response.

**Recommendation:** Ensure this flag is `false` in all production deployments. This is already a configuration flag, but add a startup warning log when enabled.

---

### RR-012 — QR Code Signing Key

**Description:** The QR_SECRET_KEY is currently set as a command-line argument in test startup. For production:
- Must be a strong, randomly-generated 32+ character key
- Must be stored securely (not in source code or shell history)
- Should be rotated periodically (requires QR code regeneration for all active parcels)

---

## Infrastructure Risks

### RR-013 — Production Database Migration

**Description:** The system currently uses H2 in-memory database for local testing. Production migration to PostgreSQL may reveal:
- Enum handling differences (case sensitivity)
- UUID generation/comparison differences
- Constraint behavior differences

**Recommendation:** Run integration tests against PostgreSQL before production deployment.

---

### RR-014 — Google OAuth Client ID

**Description:** Google OAuth client ID is currently embedded in the backend configuration. If the client ID is exposed, it could be used to craft malicious OAuth flows.

**Recommendation:** Store Google client ID in `GOOGLE_CLIENT_ID` environment variable (backend already supports this via Spring properties).

---

## Accepted Risks (Low Priority)

| Risk | Reason Accepted |
|------|----------------|
| Account lockout inconsistency for non-existent users | Security benefit is limited; existing-user lockout works correctly |
| Admin email null in DB | Admin should log in by phone; email login is secondary |
| Custom Select empty placeholder | Visual-only issue; doesn't affect functionality |
| Camera not available in headless tests | Test workaround in place; QR scanner works in real browser |
