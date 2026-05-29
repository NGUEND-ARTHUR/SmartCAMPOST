# QA Logs

## 2026-05-29
- Brought the backend up locally on port `8082` using the local profile and confirmed Tomcat started successfully.
- Applied the missing `ai_agent_recommendation.execution_result` schema change directly to the live MySQL database.
- Re-ran the Agent UI spec against the live frontend/backend pair; the suite passed overall with one webkit retry flake.
- Re-ran the broader admin/agent/courier/staff/finance/risk suites and captured the remaining selector and load-wait issues for follow-up.
- Updated the Playwright fixtures to provision finance and risk roles through the shared admin path instead of falling back to anonymous auth.
- Tightened dashboard assertions to target the top-level headings and reduced full-load waits in the shared login helper.

## 2026-05-28
- Ran `playwright-tests/tests/ui/agent-ui.spec.ts` repeatedly under the controlled QA loop.
- Confirmed frontend readiness with `playwright-tests/wait-frontend.js`.
- Fixed auth fixture persistence to use Zustand's wrapped storage shape.
- Fixed auth hydration fallback in the route guard.
- Fixed scan-console accessibility labels and aligned the E2E spec with the actual scan flow.
- Final validation: `6 passed` for the agent UI spec run.
