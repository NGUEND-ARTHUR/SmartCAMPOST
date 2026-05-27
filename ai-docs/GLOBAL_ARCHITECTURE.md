# Global Architecture — SmartCAMPOST

Scope
- Consolidated view of backend (Spring Boot), frontend (React + Vite), and mobile (Flutter) components and how they interoperate.

High-level components
- Backend: Spring Boot services exposing REST APIs and SSE streams. Key subsystems: Auth (JWT), AI runtime (+approval queue), Deliveries/Parcels, Approvals, AssignmentService.
  - Example files: [backend/src/main/java/com/smartcampost/backend/approval/ApprovalController.java](backend/src/main/java/com/smartcampost/backend/approval/ApprovalController.java)
  - AI runtime: [backend/src/main/java/com/smartcampost/backend/ai/runtime/DefaultAiRuntimeService.java](backend/src/main/java/com/smartcampost/backend/ai/runtime/DefaultAiRuntimeService.java)

- Frontend (Web): React SPA with role-based routes, Zustand `authStore`, SSE hooks for AI and scans, axios client with JWT interceptor.
  - Entry: [smartcampost-frontend/src/main.tsx](smartcampost-frontend/src/main.tsx#L1-L20)
  - Routes & guards: [smartcampost-frontend/src/App.tsx](smartcampost-frontend/src/App.tsx#L96-L120)
  - Auth store: [smartcampost-frontend/src/store/authStore.ts](smartcampost-frontend/src/store/authStore.ts#L14-L22)
  - SSE: [smartcampost-frontend/src/hooks/useAiSSE.tsx](smartcampost-frontend/src/hooks/useAiSSE.tsx#L22-L35)

- Mobile: Flutter app using `provider` + `go_router`, `ApiClient` (Dio) with secure storage for tokens.
  - Entry & router: [smartcampost_mobile/lib/main.dart](smartcampost_mobile/lib/main.dart#L1-L40)
  - ApiClient: [smartcampost_mobile/lib/core/api_client.dart](smartcampost_mobile/lib/core/api_client.dart#L1-L40)
  - Auth storage/service: [smartcampost_mobile/lib/services/auth_storage.dart](smartcampost_mobile/lib/services/auth_storage.dart#L1-L40)

Integration points
- Authentication: Backend issues JWTs; frontend stores in `localStorage` while mobile stores in secure storage. Both clients attach `Authorization` header on API calls (axios interceptor / Dio interceptor).
- Realtime: Backend SSE endpoints (`/api/stream/ai`, `/api/stream/scan`) consumed by web EventSource (token via `?token=`) and mobile should consume via native SSE clients or polling.
- AI & approvals: AI runtime can enqueue `ApprovalRequest` entities. Approver UIs exist in web (`ApprovalsPage`) and admin mobile screens. ApprovalProcessor replays approved tool requests.

Design constraints and assumptions
- Human-in-the-loop: high-impact AI tools require approval; approvals are persisted and replayed when approved.
- Role creation rule: Admins create internal roles (staff, courier, agent, finance, risk); clients self-register.
