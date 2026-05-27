# Role Hierarchy — SmartCAMPOST

Canonical roles
- CLIENT — external end-customer; may self-register.
- COURIER — delivery worker; created/managed by admin.
- AGENT — pickup/validation staff working at agencies; created by admin.
- STAFF — internal operations staff (parcel processing, assignment); created by admin.
- ADMIN — full system administrator; can create roles, manage users, approve AI actions.
- FINANCE — finance users (payments, refunds); created by admin.
- RISK — risk & compliance users; created by admin.

Hierarchy & capabilities (high level)
- `ADMIN` (top): can create/assign roles, manage integrations, approve AI requests (`approval:review`), view all resources.
- `STAFF` / `AGENT` (mid): manage parcels, pickups, validate parcels, request courier assignment; limited user management ability.
- `COURIER` (operational): view assigned pickups/deliveries, update status, confirm delivery (proof/photo).
- `FINANCE` / `RISK` (specialized): finance and risk dashboards, approve financial actions when authorized.
- `CLIENT` (lowest): create parcels, view own parcels, payments, support.

Creation rules (business rules)
- Admin creates internal roles: `COURIER`, `AGENT`, `STAFF`, `FINANCE`, `RISK`, `ADMIN`.
- `CLIENT` is the only role that can self-register through public register APIs and UI.

References
- Role routing (frontend): [smartcampost-frontend/src/lib/routeByRole.ts](smartcampost-frontend/src/lib/routeByRole.ts#L1-L20)
- Mobile role routing: [smartcampost_mobile/lib/main.dart](smartcampost_mobile/lib/main.dart#L400-L420)
