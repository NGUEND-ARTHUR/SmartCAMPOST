# System Workflows — End-to-end

This document summarizes workflows spanning backend, frontend, and mobile.

1) Client self-registration & onboarding
- Trigger: user visits web `/auth/register` or mobile `RegisterScreen`.
- Flow: client provides phone/email/password, requests OTP → backend verifies OTP → account created → token returned → client persists token (`localStorage` or secure storage) → redirect to `routeByRole` / dashboard.
  - Frontend: [smartcampost-frontend/src/pages/auth/Register.tsx](smartcampost-frontend/src/pages/auth/Register.tsx#L1-L40)
  - Mobile: [smartcampost_mobile/lib/screens/auth/register_screen.dart](smartcampost_mobile/lib/screens/auth/register_screen.dart)

2) Authenticated session & role routing
- After login (password/OTP/Google), frontend and mobile call role mapping to redirect to role-specific dashboard.
  - Frontend: `routeByRole()` ([smartcampost-frontend/src/lib/routeByRole.ts](smartcampost-frontend/src/lib/routeByRole.ts#L1-L20))
  - Mobile: `_dashboardForRole()` in `main.dart` ([smartcampost_mobile/lib/main.dart](smartcampost_mobile/lib/main.dart#L400-L420))

3) Parcel creation → assignment → delivery
- Client creates parcel (web/mobile) → backend persists `Parcel` and returns tracking → staff/agent can accept/validate parcel → dispatcher/staff assigns courier (admin/staff through UI or AI `assignCourierTool`) → courier receives assignment → pickup → delivery confirmation (proof capture) → backend updates delivery states.
  - Web parcel flows: [smartcampost-frontend/src/pages/parcels](smartcampost-frontend/src/pages/parcels)
  - Mobile parcel flows: [smartcampost_mobile/lib/screens/client/create_parcel_screen.dart](smartcampost_mobile/lib/screens/client/create_parcel_screen.dart)

4) AI-assisted actions and approval queue
- AI runtime generates `AiDecision`. If decision requires approval, backend persists `ApprovalRequest`. Approvers (admin/staff with `approval:review`) view approvals in UI and approve/deny. ApprovalProcessor replays approved actions via `AiRuntimeService.executeTool(..., approvalGranted=true)`.
  - Backend approval controller: [backend/src/main/java/com/smartcampost/backend/approval/ApprovalController.java](backend/src/main/java/com/smartcampost/backend/approval/ApprovalController.java)
  - Frontend approvals UI: [smartcampost-frontend/src/pages/admin/ApprovalsPage.tsx](smartcampost-frontend/src/pages/admin/ApprovalsPage.tsx#L1-L80)

5) Real-time events and SSE
- Backend emits SSE events for AI decisions/executions and scan events. Web consumes via `EventSource` (token appended as `?token=`). Mobile should use SSE client or polling.
  - Web SSE hook: [smartcampost-frontend/src/hooks/useAiSSE.tsx](smartcampost-frontend/src/hooks/useAiSSE.tsx#L1-L40)

6) Admin user & role management
- Admin UIs present user management pages (web/mobile). Admins create internal roles and manage permissions. Clients cannot self-create internal roles.
  - Frontend admin routes: [smartcampost-frontend/src/App.tsx](smartcampost-frontend/src/App.tsx#L190-L220)

Business rule enforcement
- All workflows must validate caller authorities in backend before performing state-changing operations. Clients may self-register; creation of other roles is admin-only.
