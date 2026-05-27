# Backend Roles & Permissions

Core Roles (UserRole enum)
- CLIENT — end-user who ships parcels
- COURIER — delivery agent
- AGENT — agency staff
- STAFF — internal staff
- ADMIN — administrative user with elevated privileges
- FINANCE — finance role
- RISK — risk/compliance role

Where roles map to routes
- See `SecurityConfig` for concrete mappings and protected routes: [backend/src/main/java/com/smartcampost/backend/security/SecurityConfig.java](backend/src/main/java/com/smartcampost/backend/security/SecurityConfig.java)

Examples
- `/api/admin/**` → `ROLE_ADMIN` only
- `/api/finance/**` → `ROLE_FINANCE` or `ROLE_ADMIN`
- `/api/risk/**` → `ROLE_RISK` or `ROLE_ADMIN`
- `/api/clients/**` → `ROLE_CLIENT`, `ROLE_ADMIN`, `ROLE_STAFF`
- `/api/delivery/**` → `ROLE_COURIER`, `ROLE_AGENT`, `ROLE_STAFF`, `ROLE_ADMIN`

Fine-grained permissions
- The code also checks authorities directly in some places (e.g., `hasAuthority('approval:review')`) — these are represented as granted authorities on the Authentication object created by `JwtAuthFilter`.

How to add new permission checks
1. Add the role or authority to user's `UserAccount` and include it in the JWT claims at generation time (`JwtService.generateToken`).
2. Protect routes in `SecurityConfig` with `requestMatchers(...).hasRole(...)` or `hasAuthority(...)`.
