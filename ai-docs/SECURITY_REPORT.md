# SmartCAMPOST — Security Report

**Date:** 2026-05-29  
**QA Engineer:** Claude Sonnet 4.6 (Autonomous QA Mode)  
**Scope:** Authentication, Authorization, Session Management, API Security  

---

## Security Assessment Summary

| Category | Finding | Severity | Status |
|----------|---------|----------|--------|
| Authentication | Frozen accounts could log in | CRITICAL | ✅ FIXED |
| Authorization | @PreAuthorize returns 400 not 403 | HIGH | ✅ FIXED |
| Session | JWT stored in localStorage (XSS risk) | MEDIUM | ⚠️ Known Risk |
| Session | No token refresh mechanism | MEDIUM | ⚠️ Known Risk |
| RBAC | All 7 roles properly isolated | — | ✅ VERIFIED |
| Input Validation | @Valid annotations on all endpoints | — | ✅ VERIFIED |
| Rate Limiting | Global rate limit configurable | — | ✅ VERIFIED |
| Account Lockout | Brute force protection active | — | ✅ VERIFIED |
| CORS | Explicitly configured, no wildcard | — | ✅ VERIFIED |
| Headers | CSRF disabled (stateless JWT) | — | ✅ VERIFIED |

---

## Authentication Security

### Verified Mechanisms
- ✅ BCrypt password hashing (BCryptPasswordEncoder with 10 rounds)
- ✅ JWT with HS256 (min 32-char secret enforced in JwtService)
- ✅ JWT expiry: 8 hours (configurable)
- ✅ Google OAuth integration (ID token verification via GoogleTokenVerifierService)
- ✅ OTP-based login and password reset (60s cooldown, one-time use)
- ✅ Account lockout after 5 failed attempts (15-minute lockout, configurable)
- ✅ Frozen account check during login (FIXED: BUG-001)

### Issues Found
- ⚠️ JWT stored in `localStorage` — susceptible to XSS attacks. **Recommendation:** Consider `httpOnly` cookies for token storage.
- ⚠️ No token refresh — expired tokens cause silent API failures without automatic re-login.

---

## Authorization (RBAC) Security

### Security Config Verification

| Endpoint Pattern | Required Role | Verified |
|-----------------|---------------|---------|
| `/api/auth/**` | Public | ✅ |
| `/api/track/**` | Public | ✅ |
| `/api/admin/**` | ADMIN only | ✅ |
| `/api/finance/**` | FINANCE, ADMIN | ✅ |
| `/api/risk/**` | RISK, ADMIN | ✅ |
| `/api/clients/**` | CLIENT, ADMIN, STAFF | ✅ |
| `/api/parcels/**` | Authenticated (method-level RBAC) | ✅ |
| `/api/scan-events/**` | ADMIN, STAFF, AGENT, COURIER | ✅ |
| `/api/delivery/**` | COURIER, AGENT, STAFF, ADMIN | ✅ |
| `/api/tariffs/**` | ADMIN, STAFF | ✅ |
| `/api/notifications/me` | Authenticated | ✅ |

### Method-Level Security

| Endpoint | Annotation | Verified |
|----------|-----------|---------|
| POST `/api/parcels` | `hasRole('CLIENT')` | ✅ (returns 403) |
| GET `/api/parcels/me` | `hasRole('CLIENT')` | ✅ |
| POST `/{id}/validate-and-lock` | `hasAnyRole('AGENT','COURIER','STAFF','ADMIN')` | ✅ |
| PATCH `/{id}/admin-override` | `hasRole('ADMIN')` | ✅ |

### Fixed: @PreAuthorize Now Returns 403 (BUG-002)

Before fix: All `@PreAuthorize` failures returned 400 due to `GlobalExceptionHandler` catching `AccessDeniedException` as `RuntimeException`.

After fix: `AccessDeniedException` is handled by a dedicated `@ExceptionHandler` that returns 403 with body:
```json
{
  "status": 403,
  "error": "Forbidden",
  "code": "AUTH_FORBIDDEN",
  "message": "Access denied: insufficient permissions"
}
```

---

## Role Isolation Testing

### Cross-Role Access Denial (All Verified ✅)

| Accessor → Resource | Expected | Actual |
|---------------------|----------|--------|
| CLIENT → /admin | Redirect to / | ✅ Redirected |
| CLIENT → /finance | Redirect to / | ✅ Redirected |
| CLIENT → /risk | Redirect to / | ✅ Redirected |
| AGENT → /admin | Redirect to / | ✅ Redirected |
| AGENT → /finance | Redirect to / | ✅ Redirected |
| COURIER → /admin | Redirect to / | ✅ Redirected |
| FINANCE → /admin | Redirect to / | ✅ Redirected |
| RISK → /finance | Redirect to / | ✅ Redirected |

### API Authorization (All Verified ✅)

| Role | Endpoint | Expected | Actual |
|------|----------|----------|--------|
| AGENT | POST /api/parcels | 403 | ✅ 403 |
| COURIER | POST /api/parcels | 403 | ✅ 403 |
| CLIENT | POST /api/scan-events | 403 | ✅ 403 |
| CLIENT | POST /api/parcels/{id}/validate-and-lock | 403 | ✅ 403 |
| STAFF | POST /api/staff (create staff) | 403 | ✅ 403 |
| Unauthenticated | GET /api/admin/users | 403 | ✅ 403 |
| Unauthenticated | GET /api/track/{ref} | 200/404 | ✅ Public |

---

## Session Security

### JWT Storage Analysis

**Current implementation:** JWT stored in `localStorage` under key `auth-storage` via Zustand persist.

**Risk:** XSS attacks can steal tokens from localStorage. All JavaScript on the page has access.

**Mitigations in place:**
- Content Security Policy not configured (not verified in headers)
- No sensitive operations without re-authentication (no explicit re-auth on critical actions)

**Recommendation:** 
1. Implement `httpOnly` cookie-based token storage for production
2. Add `SameSite=Strict` to prevent CSRF
3. Alternatively, use short-lived access tokens + refresh tokens

### Token Expiry
- Access token: 8 hours (configurable)
- No refresh token mechanism
- Users with expired tokens see API errors without automatic logout

---

## Input Validation Security

### Backend Validation
- ✅ `@Valid @RequestBody` on all write endpoints
- ✅ `@NotNull`, `@Positive` constraints on parcel creation
- ✅ Password policy enforced at registration (8+ chars, uppercase, lowercase, digit)
- ✅ UUID path variables — invalid UUIDs return 400
- ✅ Enum fields — invalid enum values return 400

### SQL Injection Protection
- ✅ Spring Data JPA with parameterized queries
- ✅ No native SQL queries found that accept user input
- ✅ H2 (local) / production DB config uses JPA (not raw JDBC)

### XSS Protection
- ✅ React renders output safely by default (JSX escaping)
- ⚠️ No explicit CSP headers configured in backend responses

---

## CORS Configuration

```java
configuration.setAllowedOrigins(List.of(
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176"
));
configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", ...));
configuration.setAllowCredentials(true);
```

✅ No wildcard (`*`) origins  
✅ Explicit allowed headers  
✅ Credentials allowed  
⚠️ Production origins should come from `CORS_ALLOWED_ORIGINS` env var (code supports this)

---

## Rate Limiting & Brute Force Protection

### Rate Limiting
- Configurable via `smartcampost.security.rate-limit.enabled`
- Disabled for testing (`--smartcampost.security.rate-limit.enabled=false`)
- **Production note:** Must be enabled in production deployment

### Account Lockout
- Threshold: 5 failed attempts (configurable: `smartcampost.security.lockout.max-attempts`)
- Duration: 15 minutes (configurable: `smartcampost.security.lockout.duration-minutes`)
- In-memory storage (resets on restart) — **not suitable for distributed deployment**
- ✅ Works correctly for existing users
- ⚠️ Non-deterministic behavior for non-existent users in concurrent tests

---

## Security Recommendations for Production

1. **CRITICAL:** Enable rate limiting (`smartcampost.security.rate-limit.enabled=true`)
2. **HIGH:** Move JWT to `httpOnly` cookies with `SameSite=Strict`
3. **HIGH:** Implement token refresh mechanism
4. **MEDIUM:** Configure Content Security Policy headers
5. **MEDIUM:** Move account lockout to Redis for distributed deployment
6. **MEDIUM:** Set `CORS_ALLOWED_ORIGINS` environment variable to production domain(s)
7. **LOW:** Configure admin account email in bootstrap data
8. **LOW:** Fix custom Select component empty-string placeholder issue
