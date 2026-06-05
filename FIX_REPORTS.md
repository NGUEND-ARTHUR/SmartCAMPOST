# Fix Reports

## Backend startup and DB schema alignment
- Root cause: the backend could not complete startup against the live MySQL schema because `ai_agent_recommendation.execution_result` was missing.
- Fixes applied:
  - Added `database/migrations/0001_add_execution_result.sql`.
  - Applied the column directly with `mysqlsh` to unblock local startup validation.
  - Started Spring Boot locally on port `8082` with the local profile and verified Tomcat reached a running state.
- Validation: backend logs confirmed `Tomcat started on port 8082 (http)` and the default admin bootstrap executed.

## Agent UI auth and scan flow
- Root cause: Playwright fixture was writing a flat `auth-storage` payload, while the frontend Zustand persist layer expects `{ state, version }`.
- Secondary issue: the scan console test expected the wrong heading and skipped the manual-mode step required to reveal the tracked-number input.
- Fixes applied:
  - Persisted auth in the Zustand wrapper format.
  - Kept route guards tolerant of wrapped or flat persisted auth.
  - Updated the agent scan test to open manual mode and assert the real accessible labels.
  - Added proper `htmlFor` / `id` wiring to the scan status control.
- Validation: `npx playwright test tests/ui/agent-ui.spec.ts --reporter=list --workers=1 --retries=1` passed with `6/6` tests green.

## Role-suite follow-up
- Root cause: finance, risk, and staff tests were matching nested headings instead of the page's top-level dashboard title, and the admin helper was using full-load waits that were too strict for the dev server.
- Fixes applied:
  - Switched the dashboard title checks to the top-level heading target.
  - Relaxed Courier empty-state fallback handling to match the actual page behavior.
  - Replaced several `reload()` and `goto()` calls with `domcontentloaded` waits in the shared auth helper and admin workflow.
- Validation: the patched files are syntax-clean; the role-suite rerun was still in progress at the time of this update.
