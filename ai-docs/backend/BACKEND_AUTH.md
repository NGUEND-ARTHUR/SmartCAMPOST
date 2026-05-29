# SmartCAMPOST — Backend Authentication & Authorization

## Authentication Methods

The backend supports three independent authentication pathways, all of which produce a JWT upon success.

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   Phone + Password  │   │    OTP (Passwordless)│   │   Google OAuth2     │
│                     │   │                      │   │                     │
│  POST /auth/login   │   │ /auth/login/otp/req  │   │  POST /auth/google  │
│  phone + password   │   │ /auth/login/otp/conf │   │  Google ID token    │
└────────┬────────────┘   └──────────┬───────────┘   └──────────┬──────────┘
         │                           │                           │
         └───────────────────────────┴───────────────────────────┘
                                     │
                              ┌──────▼──────┐
                              │  JWT Token  │
                              │  (HS256)    │
                              └─────────────┘
```

---

## 1. JWT System

### Token Generation (`JwtService.java`)

**Algorithm:** HS256 (HMAC-SHA256)  
**Secret:** `SMARTCAMPOST_JWT_SECRET` env var (minimum 32 characters)  
**Default Expiry:** 8 hours (configurable via `JWT_EXPIRATION_HOURS`)

**Claims embedded in every token:**

| Claim | Value | Source |
|---|---|---|
| `sub` | User UUID | `UserAccount.id` |
| `phone` | User phone | `UserAccount.phone` |
| `role` | Role enum name | `UserAccount.role` |
| `entityId` | Linked entity UUID | `UserAccount.entityId` |
| `email` | Email (optional) | `UserAccount.email` |
| `iat` | Issued-at timestamp | Generated |
| `exp` | Expiration timestamp | `iat + JWT_EXPIRATION_HOURS` |

### Token Extraction (`JwtAuthFilter.java`)

The filter runs before `UsernamePasswordAuthenticationFilter` on every request.

**Header method (standard):**
```
Authorization: Bearer <token>
```

**Query parameter method (SSE/WebSocket fallback):**
```
GET /api/sse/events?token=<token>
```

**Authority mapping:**
- JWT role claim `ADMIN` → Spring authority `ROLE_ADMIN`
- Pattern: `ROLE_<ENUM_NAME>`

---

## 2. Phone + Password Authentication

```
POST /api/auth/login
Body: { "phone": "+237XXXXXXXXX", "password": "plaintext" }

Flow:
1. Look up UserAccount by phone
2. Check AccountLockoutService → if locked, throw 423 LOCKED
3. BCrypt.verify(plaintext, passwordHash) → if fail, increment failure count
4. If 5 consecutive failures → lock account for 15 minutes
5. On success → reset failure count, generate JWT, return AuthResponse
```

**Registration (`POST /api/auth/register`):**
```
1. Validate OTP (previously sent via /auth/send-otp)
2. Check phone not already registered
3. BCrypt.encode(password) → store hash
4. Create Client entity
5. Create UserAccount (role=CLIENT, entityId=client.id)
6. Generate JWT → return AuthResponse
```

---

## 3. OTP Authentication

OTP is used for: registration verification, passwordless login, password reset, and delivery confirmation.

```
OtpCode entity fields:
├── phone         (target phone number)
├── code          (6-digit code)
├── purpose       (REGISTER | LOGIN | RESET_PASSWORD | DELIVERY)
├── expiresAt     (TTL from generation)
├── used          (boolean — atomic consumption)
└── createdAt
```

**OTP Login Flow:**
```
POST /api/auth/login/otp/request  →  generate OTP, send SMS via Twilio
POST /api/auth/login/otp/confirm  →  verify OTP (atomic mark as used), generate JWT
```

**OTP Validation Rules:**
- Must match phone + code + purpose
- Must not be expired (`expiresAt > now`)
- Must not be already used (`used = false`)
- Atomic consumption: `used` is set to `true` in a single transaction (prevents replay attacks)

---

## 4. Google OAuth2 Authentication

### Backend Verification (`GoogleTokenVerifierService.java`)

```
POST /api/auth/google
Body: { "idToken": "<Google ID Token from client>" }

Flow:
1. GoogleIdTokenVerifier.verify(idToken)
   - Validates signature using Google public keys
   - Validates audience == GOOGLE_CLIENT_ID env var
   - Validates expiry
2. Extract payload: sub (googleId), email, name, picture
3. Find UserAccount by googleId
   a. If found → update email if changed → generate JWT
   b. If not found → look up by email
      i. If email found → link googleId to existing account → generate JWT
      ii. If neither found → create new Client + UserAccount (role=CLIENT, authProvider=GOOGLE)
4. Return AuthResponse with JWT
```

### UserAccount fields for Google auth:

| Field | Value |
|---|---|
| `authProvider` | `GOOGLE` |
| `googleId` | Google `sub` claim (unique user identifier) |
| `passwordHash` | `null` (no password for Google-only accounts) |

---

## 5. Account Lockout (`AccountLockoutService.java`)

**Brute-force protection on login:**

```
Max failed attempts:   5
Lockout duration:      15 minutes
Inactivity reset:      1 hour (counter resets if no attempt for 1h)
Storage:               In-memory (not persistent across restarts)
Log masking:           Phone → ****XXXX (last 4 digits shown)
```

**States:**
```
NORMAL → [1-4 failures] → WARNING → [5th failure] → LOCKED (15 min) → NORMAL (auto-expiry)
```

**HTTP Responses:**
- Wrong credentials: `401 Unauthorized`
- Account locked: `423 Locked` with `ErrorCode.AUTH_ACCOUNT_LOCKED`

---

## 6. Rate Limiting (`RateLimitFilter.java`)

**Algorithm:** Token Bucket per IP address

| Endpoint Group | Limit | Error |
|---|---|---|
| General `/api/**` | 60 req/min per IP | `429 Too Many Requests` |
| Auth `/api/auth/**` | 10 req/min per IP | `429 Too Many Requests` |

**Client IP detection order:**
1. `X-Forwarded-For` header (first IP in chain)
2. `X-Real-IP` header
3. TCP remote address

> **Note:** In-memory token buckets are per-instance. For horizontally-scaled deployments, use Redis-backed rate limiting.

---

## 7. Spring Security Configuration (`SecurityConfig.java`)

**Session policy:** `STATELESS` — no server-side session, fully JWT-based.

**CSRF:** Disabled (appropriate for stateless REST API with JWT).

**Filter order:**
```
RateLimitFilter (before Spring Security)
    → JwtAuthFilter (before UsernamePasswordAuthenticationFilter)
        → Spring Security authorization
```

**Public endpoints (no token required):**
```
/api/auth/**
/api/payments/mtn/**   (MTN MoMo webhook)
/api/track/**          (public parcel tracking)
/api/ussd/**           (USSD gateway)
```

**Role-restricted endpoints:**
```
/api/admin/**          → ADMIN only
/actuator/**           → ADMIN only
/api/finance/**        → FINANCE only
/api/risk/**           → RISK only
/api/dashboard/**      → Any authenticated user (role-adaptive)
/api/parcels/**        → CLIENT, AGENT, STAFF, ADMIN
/api/pickups/**        → CLIENT, COURIER, AGENT, ADMIN
```

---

## 8. Password Management

**Hashing:** BCrypt (Spring Security `PasswordEncoder`)

**Change Password:**
```
POST /api/auth/password/change
Requires: current JWT + old password + new password
```

**Reset Password (forgotten):**
```
POST /api/auth/password/reset/request   → send OTP to registered phone
POST /api/auth/password/reset/confirm   → verify OTP + set new BCrypt hash
```

---

## 9. Account Freeze / Unfreeze

Administrators can freeze any user account for compliance/risk reasons:

```
PATCH /api/admin/users/{userId}/freeze    → UserAccount.frozen = true
PATCH /api/admin/users/{userId}/unfreeze  → UserAccount.frozen = false
```

- A frozen account's JWT is still technically valid until expiry
- The `JwtAuthFilter` checks `UserAccount.frozen` on each request
- Frozen users receive `403 Forbidden` with `ErrorCode.AUTH_ACCOUNT_FROZEN`
- All freeze/unfreeze actions are recorded in `AuditLog`

---

## 10. AuthResponse DTO

All successful authentication flows return:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "role": "CLIENT",
  "entityId": "uuid-of-linked-entity",
  "phone": "+237XXXXXXXXX",
  "email": "user@example.com"
}
```

---

## 11. Error Codes — Auth Domain

| Code | HTTP | Meaning |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong phone/password |
| `AUTH_ACCOUNT_LOCKED` | 423 | Too many failed attempts |
| `AUTH_ACCOUNT_FROZEN` | 403 | Admin froze this account |
| `AUTH_GOOGLE_TOKEN_INVALID` | 401 | Google ID token rejected |
| `AUTH_GOOGLE_TOKEN_EXPIRED` | 401 | Google ID token expired |
| `OTP_INVALID` | 400 | Wrong OTP code |
| `OTP_EXPIRED` | 400 | OTP TTL exceeded |
| `OTP_ALREADY_USED` | 400 | OTP already consumed |
| `OTP_RATE_LIMIT` | 429 | Too many OTP requests |
