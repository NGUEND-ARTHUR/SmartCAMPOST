# SmartCAMPOST — Complete Workflow Map

This file enumerates every workflow in the application, per role, with entry points, permissions, pages, APIs, expected results, failure states, and security validations.

Important business rules
- Only `ADMIN` may create internal roles (`COURIER`, `AGENT`, `STAFF`, `FINANCE`, `RISK`, `ADMIN`).
- `CLIENT` can self-register via public register APIs and UI.

Legend
- Pages: frontend/mobile paths when available.
- API: backend endpoint path (approximate) exposed by Spring Boot.
- Permission: backend authority or role required.

ROLE: CLIENT

1) Registration & Onboarding
- Entry point: Web `/auth/register` or Mobile `RegisterScreen`.
- Required permissions: none (public).
- Involved pages: [smartcampost-frontend/src/pages/auth/Register.tsx](smartcampost-frontend/src/pages/auth/Register.tsx#L1-L40), [smartcampost_mobile/lib/screens/auth/register_screen.dart](smartcampost_mobile/lib/screens/auth/register_screen.dart)
- Involved APIs: `POST /api/auth/register`, `POST /api/auth/verify-otp`.
- Expected results: account created; JWT access (and refresh) returned; redirect to dashboard.
- Failure states: invalid OTP, duplicate account, rate limits, input validation errors.
- Security validations: CAPTCHA or rate-limiting recommended; validate phone/email ownership (OTP), sanitize inputs.
- CRUD: Create user (C). No Update/Delete until authenticated.
- Forms: registration form -> OTP form -> profile completion.

2) Login — password / OTP / Google
- Entry point: Web `/auth/login`, Mobile `LoginScreen`.
- Permissions: public.
- Pages: [smartcampost-frontend/src/pages/auth/Login.tsx](smartcampost-frontend/src/pages/auth/Login.tsx), [smartcampost_mobile/lib/screens/auth/login_screen.dart](smartcampost_mobile/lib/screens/auth/login_screen.dart)
- APIs: `POST /api/auth/login`, `POST /api/auth/login-otp`, OAuth callback endpoints.
- Expected: JWT returned; `useAuthStore` (web) persists token; mobile stores in secure storage.
- Failure: invalid credentials, revoked account, 2FA failure.
- Security: throttle login attempts; store minimal user info client-side.

3) Create Parcel (Client)
- Entry: Web `Create Parcel` page or mobile create parcel screen.
- Permissions: `ROLE_CLIENT` authenticated.
- Pages: [smartcampost-frontend/src/pages/parcels/CreateParcel.tsx](smartcampost-frontend/src/pages/parcels/CreateParcel.tsx), [smartcampost_mobile/lib/screens/client/create_parcel_screen.dart](smartcampost_mobile/lib/screens/client/create_parcel_screen.dart)
- APIs: `POST /api/parcels`, `GET /api/parcels/{id}` (tracking), `POST /api/payments/initiate` (if paid)
- Expected: Parcel persisted with tracking id; payment initiated when required; user redirected to tracking.
- Failures: validation errors, payment gateway errors, server errors, quota exceeded.
- Security: validate ownership, sanitize addresses, verify payment tokens.
- CRUD: Create parcel (C); Read own parcels (R); Update limited (U) for allowed pre-dispatch edits; Delete usually disallowed or admin-only.

4) Track Parcel / View History
- Entry: link / dashboard / tracking page.
- Permissions: public for tracking token or authenticated for detailed view.
- Pages: [smartcampost-frontend/src/pages/parcels/Track.tsx](smartcampost-frontend/src/pages/parcels/Track.tsx)
- APIs: `GET /api/parcels/{trackingId}`, `GET /api/parcels/{id}/events`
- Expected: Live tracking information displayed; history, ETA.
- Failures: invalid tracking id, permission-denied for detailed info.

5) Payments (Create / Pay / Refund Request)
- Entry: Checkout on create parcel or payments page.
- Permissions: `ROLE_CLIENT` for initiating; `ROLE_FINANCE`/`ADMIN` for refunds.
- Pages: frontend payments components; mobile payments screens.
- APIs: `POST /api/payments/initiate`, `GET /api/payments/{id}/status`, `POST /api/payments/{id}/refund` (finance/admin)
- Expected: Payment processed via MTN/Orange adapter; status updated; receipts generated.
- Failure: payment gateway failure, network, invalid payment method, duplicate charge.
- Security: PCI compliance for stored card data (avoid storing), validate webhooks from payment provider.

6) Support Ticket / Contact
- Entry: help/support page or chat widget.
- Permissions: authenticated or guest for basic contact.
- APIs: `POST /api/support/tickets`, `GET /api/support/tickets/{id}`
- Expected: ticket created; user receives confirmation and tracking id.

Role transitions for CLIENT
- Self-register -> CLIENT role assigned on creation.
- Admin can change role to STAFF/AGENT/COURIER/FINANCE/RISK (admin-only action via User Management API).

ROLE: COURIER

1) View Assigned Deliveries
- Entry: Courier dashboard.
- Permissions: `ROLE_COURIER` authenticated.
- Pages: [smartcampost_mobile/lib/screens/courier/dashboard.dart](smartcampost_mobile/lib/screens/courier/dashboard.dart), web courier pages under `/courier`.
- APIs: `GET /api/deliveries/assigned`, `GET /api/deliveries/{id}`
- Expected: list of assigned pickups/deliveries with details and navigation link.
- Failure: no assignments found, network error, 401/403 if token invalid.
- Security: enforce courier can only see assigned deliveries.
- CRUD: Read deliveries (R); Update status (U) for accepted/picked/delivered.

2) Accept/Decline Assignment
- Entry: assignment notification or assignments list.
- Permissions: `ROLE_COURIER`.
- APIs: `POST /api/deliveries/{id}/accept`, `POST /api/deliveries/{id}/decline`
- Expected: acceptance updates delivery state; system notifies dispatcher; courier starts pickup.
- Failure: assignment already taken, stale assignment, conflict (409).
- Security: check idempotency and race conditions; verify courier is assigned or offered the delivery.

3) Pickup Confirmation (with proof)
- Entry: pickup screen -> take photo / capture signature.
- Permissions: `ROLE_COURIER`.
- APIs: `POST /api/deliveries/{id}/pickup` (multipart upload), `PUT /api/deliveries/{id}/status`
- Expected: proof uploaded; status changed to `IN_TRANSIT` or `PICKED_UP`.
- Failures: file size limits, camera permissions denied, upload failed.

4) Delivery Confirmation
- Entry: deliver screen -> capture recipient signature/photo, optionally OTP from client.
- APIs: `POST /api/deliveries/{id}/complete` with proof and location.
- Expected: status `DELIVERED`; notification to client; payment settlement if COD.
- Failures: recipient not available, signature mismatch, payment collection failure.

5) CRUD operations
- Read assignments (R), Update status (U). Create/Delete deliveries not allowed; only admin/staff can create/delete.

Role transitions for COURIER
- Created by Admin -> COURIER assigned to deliveries by staff or AI. Admin may deactivate or change role.

ROLE: AGENT (agency staff)

1) Parcel Intake & Validation
- Entry: Agent desk UI on web or mobile agency screen.
- Permissions: `ROLE_AGENT`.
- Pages: agent parcel intake screens.
- APIs: `POST /api/parcels/agency-create`, `PUT /api/parcels/{id}/validate`
- Expected: Parcel created with agency metadata; validated and queued for dispatch.
- Failures: duplicate parcel, missing client info, validation errors.

2) Drop-off & Handover
- APIs: `POST /api/parcels/{id}/handover-to-storage`
- Expected: parcel moved to storage/processing queue.

3) CRUD: Create (C) for agency intake, Read (R), Update (U) validation states.

ROLE: STAFF (operations / dispatch)

1) Parcel Management Dashboard
- Entry: Staff web app `/staff/dashboard`.
- Permissions: `ROLE_STAFF`.
- Pages: [smartcampost-frontend/src/pages/staff/*](smartcampost-frontend/src/pages/staff)
- APIs: `GET /api/parcels`, `PUT /api/parcels/{id}`, `POST /api/parcels/{id}/assign`, `GET /api/deliveries`.
- Expected: manage queue, inspect parcels, edit metadata, trigger assignment.
- Failures: invalid parcel state, concurrent edits, insufficient permissions.

2) Manual Assignment (Staff) — dispatch
- Entry: staff parcel details -> assign courier.
- Permissions: `ROLE_STAFF` or `ROLE_ADMIN`.
- APIs: `POST /api/assignments` or `POST /api/parcels/{id}/assign`.
- Expected: create assignment record; notify courier; update parcel status to `ASSIGNED`.
- Failure: courier unavailable, scheduling conflict, capacity exceeded.
- Security: ensure staff cannot assign beyond allowed couriers (e.g., geographic constraints); validate idempotency.

3) AI-assisted Assignment (assignCourierTool)
- Entry: staff triggers `suggest assignment` or AI automatically suggests.
- Permissions: `ROLE_STAFF` to request; AI may propose and auto-assign if policy allows.
- APIs: `POST /api/ai/assign-suggest`, `POST /api/ai/execute-tool`.
- Expected: AI returns suggested courier(s); if policy requires approval, `ApprovalRequest` persisted; after approval, `AssignmentService` executes assignment.
- Failure: AI suggestion invalid, policy requires approval and remains pending, replay fails.
- Security: log AiDecisionLog and AiExecutionLog; if approval required, block assignment until approved.

4) Approvals (Staff reviewer)
- Entry: Approvals page in admin/staff UI.
- Permissions: `approval:review` authority or `ROLE_ADMIN`.
- Pages: [smartcampost-frontend/src/pages/admin/ApprovalsPage.tsx](smartcampost-frontend/src/pages/admin/ApprovalsPage.tsx#L1-L80)
- APIs: `GET /api/approvals/pending`, `POST /api/approvals/{id}/approve`, `POST /api/approvals/{id}/deny`
- Expected: reviewer inspects request metadata and approves/denies; on approve, `ApprovalProcessor` replays action.
- Failures: stale requests, race conditions, insufficient evidence.

5) CRUD: full R/U for parcels; Create assignments (C), Update statuses (U), limited Delete (D) by admin-only.

ROLE: ADMIN

1) User & Role Management
- Entry: Admin console `/admin/users`.
- Permissions: `ROLE_ADMIN` (top-level) and higher authority.
- Pages: [smartcampost-frontend/src/pages/admin/Users.tsx](smartcampost-frontend/src/pages/admin/Users.tsx)
- APIs: `GET /api/users`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`, `POST /api/users/{id}/roles`
- Expected: create internal users, assign roles, deactivate users, audit trail created.
- Forbidden: clients self-creating internal roles.
- Failures: duplicate user, constraint violations, missing permissions.
- Security: MFA for admin actions recommended; log all role changes.

2) Create Internal Roles (Business-critical)
- Entry: Admin role management UI.
- Permissions: `ROLE_ADMIN` only.
- APIs: `POST /api/roles`, `PUT /api/roles/{id}`
- Expected: new roles created and available for assignment.
- Failure: name conflicts, missing permissions validation.

3) View & Approve AI Approval Requests
- Same as Staff approvals but with full authority; can audit and force-execute actions.

4) System Config & Integrations
- Entry: Admin -> Integrations/Settings pages.
- APIs: `GET/POST /api/integrations/*`, `POST /api/integrations/{id}/test`
- Expected: configure MTN/Orange, webhooks, Google OAuth client IDs.
- Failure: invalid credentials, sandbox misconfig.

5) Observability & Logs
- Entry: Admin monitoring pages; link to `AiDecisionLog`, `AiExecutionLog`.
- APIs: `GET /api/logs/ai`, `GET /api/logs/audit`

ROLE: FINANCE

1) View Payments & Issue Refunds
- Entry: Finance dashboard `/finance`.
- Permissions: `ROLE_FINANCE`.
- APIs: `GET /api/payments`, `POST /api/payments/{id}/refund` (requires admin approval or `finance:refund` authority)
- Expected: view transactions, request refunds; refunds processed via payment adapter.
- Failures: insufficient funds, payment gateway errors.

ROLE: RISK

1) Risk Dashboard & Manual Holds
- Entry: Risk dashboard.
- Permissions: `ROLE_RISK`.
- APIs: `GET /api/risk/incidents`, `POST /api/risk/{id}/hold` (mark parcel/account on hold)
- Expected: put holds, request escalations to admin.

COMMON WORKFLOWS (Cross-role)

1) AI Runtime → Approval Queue → Replay
- Entry: AI runtime issues `AiDecision` when running a tool (e.g., `assignCourierTool`).
- Permissions: depends on originating actor; AI runtime runs under service account but the action is recorded against actor.
- APIs: `POST /api/ai/execute-tool`, `GET /api/approvals/pending`
- Pages: staff/admin approvals pages; AI runtime logs available in admin UI.
- Expected: when policy requires approval, create `ApprovalRequest` persisted; SSE event `ai-decision` emitted. Approver uses UI to approve; `ApprovalProcessor` replays by calling `AiRuntimeService.executeTool(..., approvalGranted=true)`. AssignmentService performs domain change.
- Failure: approval not granted; processor replay fails; duplicate processing in multi-instance deployments.
- Security: append-only logs, role checks on approval endpoints, distributed lock on ApprovalProcessor (use Redis lock or leader-election).

2) SSE Subscription for AI Events
- Entry: client opens AI chat or admin opens monitoring.
- Permissions: authenticated; SSE token passed via `?token=` due to EventSource limitations.
- Pages: `useAiSSE` hook in [smartcampost-frontend/src/hooks/useAiSSE.tsx](smartcampost-frontend/src/hooks/useAiSSE.tsx#L1-L40)
- APIs: `GET /api/stream/ai?token=<sse-token>`
- Expected: receive `ai-decision`, `ai-execution`, `ai-runtime` events and update UI.
- Failures: token leakage via URL, SSE disconnects, expired tokens.
- Security: use short-lived SSE token issued server-side; prefer cookies or Authorization header when possible.

3) Webhooks / External Integrations
- Entry: payment provider sends webhook; courier GPS webhook updates telemetry.
- APIs: `POST /api/webhooks/payments`, `POST /api/webhooks/courier-location`
- Expected: process webhook securely, validate signature, update internal state.
- Failures: signature mismatch, replayed webhook, malformed payload.
- Security: verify vendor signature, idempotency keys, replay protection.

4) RBAC Verification Matrix (Automated Tests)
- For every API endpoint, run matrix of roles (CLIENT, COURIER, AGENT, STAFF, FINANCE, RISK, ADMIN). Expected results are defined in `PERMISSIONS_MATRIX.md`.
- APIs to test: `/api/parcels`, `/api/deliveries`, `/api/assignments`, `/api/payments`, `/api/approvals`, `/api/users`.

IMPLEMENTATION NOTES & SECURITY VALIDATIONS
- ApprovalProcessor concurrency: implement a distributed lock (Redis SETNX with TTL) before processing approvals to avoid duplicate replays when multiple instances run.
- SSE tokens: issue short-lived server-side tokens; consider switching to cookies or use WebSocket with authenticated connection.
- Storage: avoid storing JWT in `localStorage` for admin accounts; prefer refresh token + httpOnly cookie and client refresh flow.
- Logging: all role changes and approval actions must be stored in audit logs with actor, timestamp, and correlation id.

API list (canonical)
- Authentication: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/otp`, `GET /api/auth/me`
- Parcels: `POST /api/parcels`, `GET /api/parcels`, `GET /api/parcels/{id}`, `PUT /api/parcels/{id}`
- Deliveries/Assignments: `GET /api/deliveries`, `POST /api/assignments`, `POST /api/deliveries/{id}/accept`, `POST /api/deliveries/{id}/pickup`, `POST /api/deliveries/{id}/complete`
- Payments: `POST /api/payments/initiate`, `GET /api/payments/{id}`, `POST /api/payments/{id}/refund`
- AI & Approvals: `POST /api/ai/execute-tool`, `GET /api/approvals/pending`, `POST /api/approvals/{id}/approve`, `POST /api/approvals/{id}/deny`
- Admin: `GET /api/users`, `POST /api/users`, `PUT /api/users/{id}`, `POST /api/roles`

How to use this map
- Use `PERMISSIONS_MATRIX.md` to derive automated tests per endpoint.
- Use `QA_ROADMAP.md` and `TESTING_STRATEGY.md` to prioritize fixing and test coverage.

If you want, I can now:
- generate machine-readable test cases for the RBAC matrix (Playwright + API tests), or
- scaffold Playwright test templates for the high-priority workflows.
