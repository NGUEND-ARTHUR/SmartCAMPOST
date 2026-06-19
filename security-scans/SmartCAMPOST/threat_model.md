# SmartCAMPOST Repository Threat Model

## Overview

SmartCAMPOST is a logistics, parcel tracking, payment, and AI-assisted operations platform. The repository contains a Java Spring Boot backend, React web frontend, Flutter mobile app, database schema/migrations, deployment configuration, tests, documents, generated QR/invoice storage artifacts, and operational/AI documentation.

Primary runtime assets are user identities, JWTs, OTP flows, dynamic RBAC permissions, parcel records, scan events, GPS locations, delivery proofs, QR codes, invoices, payment records, CamerPay/MTN/Orange payment callbacks, AI tool execution paths, audit logs, and support conversations. The platform handles PII such as names, phone numbers, addresses, parcel movements, proof photos/URLs, and financial transaction state.

## Threat Model, Trust Boundaries, and Assumptions

Trust boundaries:

- Internet clients to backend REST, SSE, and WebSocket endpoints.
- Public unauthenticated endpoints for auth, OTP, public tracking, QR verification, USSD, MTN test routes, and payment webhooks.
- Authenticated user sessions crossing role boundaries: CLIENT, COURIER, AGENT, STAFF, ADMIN, FINANCE, RISK, plus dynamic DB-backed permissions.
- Backend to third-party providers: CamerPay, MTN MoMo, Orange Money, Twilio/SMS, Google OAuth, OpenAI/AI model providers, maps/geocoding services.
- Backend to PostgreSQL/MySQL/H2 and local storage for generated QR/invoice files.
- Frontend/mobile local storage and secure storage to backend APIs.
- AI assistant/agent tool requests to backend services, which must enforce permission checks and audit logging.

Attacker-controlled inputs include HTTP request bodies, route parameters, query strings, QR scan payloads, uploaded/provided photo URLs, GPS coordinates, webhook bodies/headers, OTP phone numbers/codes, support/chat messages, AI prompts, frontend local storage contents, and any mobile API payloads. Operator-controlled inputs include Render/env variables, API tokens, HMAC secrets, admin-created tariffs, integration configs, and RBAC grants. Developer-controlled inputs include migrations, scripts, test fixtures, documents, generated logs, and deployment files.

Assumptions:

- Production must use strong environment secrets for JWT, QR signing, payment tokens/HMAC, OpenAI, SMS, database credentials, and OAuth.
- The backend is the root of authorization truth; web/mobile checks are usability controls only.
- Payment webhook endpoints can be public only if signatures and state transitions are validated server-side.
- Public tracking must avoid leaking more PII than necessary.
- AI must not directly bypass backend authorization or mutate database state outside audited service/tool paths.

## Attack Surface, Mitigations, and Attacker Stories

Main attack surfaces:

- Spring Security config, JWT filter/service, auth controllers, OTP/password reset, Google OAuth, role routing, and dynamic permission service.
- Parcel, pickup, delivery, scan, QR, tracking, map/GPS, notification, support, payment/refund, AI, RBAC, and admin endpoints.
- CamerPay webhook verification and gateway adapters.
- React and Flutter storage, API base URLs, route guards, QR scanners, map rendering, chat/rating forms, and profile/photo URL fields.
- Database migrations and schema constraints, especially role/permission/payment/audit tables.
- Local generated invoices/QR PDFs and any static/file-serving paths.
- Environment files, deployment configs, logs, docs, screenshots, and generated audit artifacts that may contain secrets or PII.

Existing mitigations visible in the repo include Spring Security route restrictions, JWT authentication, `@PreAuthorize` on many controllers, HMAC verification for CamerPay webhooks, CORS origin allow-listing, disabled CSRF for stateless JWT, environment variable based secrets, QR signing services, audit services, rate-limit configuration, OTP exposure disabled by default, mobile secure storage, and test coverage for auth/scan/api compatibility.

Realistic attacker stories:

- Unauthenticated internet user attempts OTP abuse, public tracking enumeration, QR payload tampering, webhook forgery, or CORS/Swagger exposure.
- Authenticated low-privilege user attempts IDOR across parcels, payments, invoices, support conversations, profiles, GPS, or ratings.
- Courier/agent attempts to modify payment/delivery/parcel states outside assigned workflow.
- Malicious webhook sender attempts to mark payments successful without valid HMAC or by replaying old references.
- Malicious AI prompt attempts to coerce tool calls or access unauthorized parcel/payment data.
- Client-side attacker tampers local storage or mobile API payloads to impersonate roles or hit admin endpoints.
- Insider/operator accidentally commits secrets, logs, generated invoices, or PII into the repository.

Out of scope unless repository evidence shows otherwise: compromise of CamerPay/MTN/Orange/Twilio/OpenAI infrastructure, OS-level compromise of Render/mobile devices, and attacks requiring physical device access beyond normal mobile local-storage risks.

## Severity Calibration

Critical:

- Remote unauthenticated compromise of admin privileges or JWT signing secrets.
- Payment webhook bypass that marks arbitrary payments successful.
- SQL injection or unsafe dynamic query execution allowing data modification or broad PII exfiltration.
- Public file/static path traversal exposing generated invoices, QR payload secrets, or environment files.

High:

- IDOR allowing clients/couriers to read or mutate other users' parcels, payments, invoices, delivery proofs, GPS, or conversations.
- Missing permission validation on AI tools or dynamic RBAC grants.
- Weak OTP/password reset throttling or OTP exposure in production.
- Secrets committed in tracked files or deployed frontend bundles.
- CORS allowing untrusted origins with credentials.

Medium:

- Stored/reflected XSS via support/chat, parcel descriptions, profile/photo URLs, notification templates, or admin-controlled content.
- SSRF or unsafe remote image/file URL handling if backend fetches arbitrary `photoUrl`.
- Weak webhook replay protection when HMAC is valid but events are stale/replayed.
- Swagger/dev/debug/test routes exposed in production.
- Excessive PII leakage through public tracking pages or logs.

Low:

- Client-only authorization/UX inconsistencies when backend still blocks access.
- Missing security headers, minor dependency hygiene, overly verbose non-production logs, or weak local dev defaults not used in production.
- UI information disclosure that does not include sensitive PII or privileged operations.
