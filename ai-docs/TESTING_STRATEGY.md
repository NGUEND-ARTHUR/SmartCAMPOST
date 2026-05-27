# Testing Strategy — SmartCAMPOST

Objectives
- Verify all workflows end-to-end across web and mobile, assert permissions, and automate regression testing.

Test types
- Unit tests: backend services, policy evaluation, small frontend hooks and stores.
- Integration tests: backend API endpoints with in-memory DB or test containers (parcels, deliveries, approvals).
- End-to-end (E2E): Playwright for web flows; Flutter integration tests or Appium for mobile flows.
- Security tests: token lifecycle, XSS scan, permission fuzzing.

Playwright strategy (web)
- Baseline suites:
  - Auth flows (login/password, OTP, Google) with role redirects.
  - Client parcel lifecycle (create → track → payment).
  - Staff/admin flows (parcel management, assign courier, approvals).
  - AI & Approval flow: simulate AI-generated approval request, approve via UI, confirm replayed action effect.
- Test data: use test tenant and mocked third-party integrations (payment gateway sandbox).

Mobile strategy
- Flutter integration tests for navigation and core screens.
- End-to-end device tests for QR scan and camera flows (manual/CI via emulator). For camera, mock scan payload where possible.

Permissions & RBAC tests
- Generate a matrix (see `PERMISSIONS_MATRIX.md`) and produce automated tests that attempt each action with each test role user; assert success or 403.

Test automation & CI
- Run unit tests on pull requests; run integration & Playwright smoke on merge to main; full regression nightly.

Playwright test generation (next step)
- I can scaffold Playwright test templates for the highest-priority workflows: register/login, create parcel, approve AI action, courier delivery. Shall I scaffold them now?
