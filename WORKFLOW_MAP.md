# WORKFLOW_MAP

This file maps detected workflows across backend, frontend, and mobile for Playwright E2E coverage.

## Role Hierarchy
- ADMIN (full control)
- FINANCE (finance endpoints)
- RISK (risk endpoints)
- STAFF (limited admin tasks)
- AGENT (operational agent)
- COURIER (delivery actor)
- CLIENT (self-registered users)

## High-level Workflows

- Admin workflows
  - Admin login (bootstrap or env-provisioned admin)
  - Create Staff / Agent / Courier (API + UI)
  - Freeze / Unfreeze accounts
  - View dashboards (finance / risk / tariffs)

- Client workflows
  - Self-register (OTP or Google) -> create Client + UserAccount
  - Login / logout / password reset
  - Create parcel / request pickup / track delivery

- Agent / Courier workflows
  - Agent login
  - Accept pickup / mark delivery

- Permissions & Security
  - Route-level mapping (see SecurityConfig)
  - Unauthorized access attempts -> 401/403
  - JWT persistence and session expiration

## Mapping to tests
- For each workflow, tests will include: happy path, invalid input, unauthorized access, edge cases, validation errors, session/auth behavior.

## Notes
- This is a living map — tests reference environment variables for admin credentials and base URL.
