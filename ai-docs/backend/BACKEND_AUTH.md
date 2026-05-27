# Backend Authentication & Security

Overview
- The backend uses stateless JWTs for authentication and Spring Security for route authorization. Key protections include rate limiting, account lockout, strict CORS, and conservative allowed headers.

Key components
- `SecurityConfig` — route access rules, CORS settings, session policy: [backend/src/main/java/com/smartcampost/backend/security/SecurityConfig.java](backend/src/main/java/com/smartcampost/backend/security/SecurityConfig.java)
- `JwtService` — generates and validates JWTs. Secret must be provided via env var (`SMARTCAMPOST_JWT_SECRET`) and has minimum length checks: [backend/src/main/java/com/smartcampost/backend/security/JwtService.java](backend/src/main/java/com/smartcampost/backend/security/JwtService.java)
- `JwtAuthFilter` — extracts token from `Authorization` header or `?token=` query param (used by SSE/EventSource). Builds `Authentication` with `ROLE_...` authorities: [backend/src/main/java/com/smartcampost/backend/security/JwtAuthFilter.java](backend/src/main/java/com/smartcampost/backend/security/JwtAuthFilter.java)
- `GoogleTokenVerifierService` — verifies Google ID tokens and extracts payload for social login flows: [backend/src/main/java/com/smartcampost/backend/security/GoogleTokenVerifierService.java](backend/src/main/java/com/smartcampost/backend/security/GoogleTokenVerifierService.java)

Brute-force & abuse protections
- `RateLimitFilter` — per-IP token-bucket limits with stricter limits for auth endpoints. In-memory only; swap to Redis for horizontal scaling: [backend/src/main/java/com/smartcampost/backend/security/RateLimitFilter.java](backend/src/main/java/com/smartcampost/backend/security/RateLimitFilter.java)
- `AccountLockoutService` — tracks failed login attempts and locks accounts for a configurable duration: [backend/src/main/java/com/smartcampost/backend/security/AccountLockoutService.java](backend/src/main/java/com/smartcampost/backend/security/AccountLockoutService.java)

Auth flows
- Password login: `POST /api/auth/login` handled by `AuthServiceImpl.login(...)`. Lockout and rate limiting are applied. On success a JWT is returned (subject = userId UUID). See: [backend/src/main/java/com/smartcampost/backend/controller/AuthController.java](backend/src/main/java/com/smartcampost/backend/controller/AuthController.java) and [backend/src/main/java/com/smartcampost/backend/service/impl/AuthServiceImpl.java](backend/src/main/java/com/smartcampost/backend/service/impl/AuthServiceImpl.java)
- OTP flows: request + verify endpoints exist; OTPs are generated via `OtpService` and codes are intentionally not returned in responses in production.
- Google login: `POST /api/auth/google` — server-side verification via `GoogleTokenVerifierService` and account linking/creation in `AuthServiceImpl`.

Security recommendations
- Ensure `SMARTCAMPOST_JWT_SECRET` is set in production and rotated safely.
- Move in-memory rate limiting and lockout state to Redis for multi-instance robustness.
- Audit `CORS_ALLOWED_ORIGINS` env var to ensure production origins are locked down.
