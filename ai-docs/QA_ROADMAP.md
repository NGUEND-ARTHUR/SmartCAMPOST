# QA Roadmap — Prioritized

Goal: stabilize architecture, fix inconsistencies, validate permissions, and automate end-to-end verification.

Phase 0 — Quick fixes (Days 0–3)
- Fix `fr.json` syntax and install missing TS `@types/*` so web type-checks succeed. (Frontend)
- Add CI check to run `npm run type-check` and fail fast.

Phase 1 — Stabilize auth & tokens (Week 1)
- Harmonize token handling: implement refresh-token flow on backend and clients; migrate web from persistent `localStorage` token to short-lived access + refresh cookie or secure storage shim.
- Add token expiry detection and automatic re-login flows (mobile & web).

Phase 2 — Approval & AI hardening (Week 2)
- Ensure ApprovalProcessor uses distributed lock (Redis) or leader-election to avoid duplicates.
- Add audit log retention policy and immutable append-only logs for AI decisions and executions.

Phase 3 — Permissions & RBAC validation (Week 3)
- Create test users for each role; build automated test matrix to validate endpoint-level permissions.
- Add integration tests asserting backend rejects unauthorized actions.

Phase 4 — Automation & Playwright (Week 4)
- Scaffold Playwright tests for major workflows: register/login, create parcel, assign courier, accept delivery, approvals.
- Integrate Playwright in CI (headless) and tag tests by role.

Phase 5 — Regression & monitoring (Ongoing)
- Run daily regression suites; failing tests open tracked issues. Add Sentry/Crashlytics and API health monitoring.
