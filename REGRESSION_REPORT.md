# Regression Report

## Backend and role-suite status
- Verified the backend can start locally again after the schema fix and local-profile launch.
- Verified the Agent UI suite still passes end-to-end against the live app.
- Identified remaining follow-up areas in the broader role suites: heading strictness, Courier empty-state handling, and admin helper reload timing.

## Verified
- Admin-to-agent auto-provision flow still works.
- Unauthorized client access to the agent dashboard still fails as expected.
- Agent dashboard remains reachable after auth hydration.
- Scan console remains accessible and the manual scan fields render correctly.

## Notes
- The suite was rerun after each change to keep the feedback loop tight.
- No security bypasses were added; auth still depends on the persisted authenticated state.
- No role hierarchy changes were introduced.
