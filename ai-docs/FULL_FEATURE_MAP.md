# Full Feature Map — SmartCAMPOST

This maps features to UI surfaces (web/mobile) and backend services.

Core features
- Authentication & Identity
  - Web: `src/pages/auth/*` (Login/Register/OTP) — [smartcampost-frontend/src/pages/auth](smartcampost-frontend/src/pages/auth)
  - Mobile: `lib/screens/auth/*` — [smartcampost_mobile/lib/screens/auth](smartcampost_mobile/lib/screens/auth)
  - Backend: `/api/auth/*`

- Parcel lifecycle (create → validate → assign → deliver)
  - Web: `src/pages/parcels/*`, `src/pages/pickups/*`
  - Mobile: `lib/screens/client/*`, `lib/screens/courier/*`, `lib/screens/agent/*`
  - Backend: ParcelService, DeliveryService

- Assignments & Dispatch
  - Web: staff/admin parcel management, AI-assisted assign via `assignCourierTool` (requires approval if policy triggers)
  - Mobile: staff and courier assignment views
  - Backend: `AssignmentService`, `DeliveryService`

- Payments
  - Web: payments pages + MTN wrappers in `src/services/payments`
  - Mobile: `lib/screens/finance/payments_screen.dart`, `payment_service.dart`
  - Backend: Payment integration controllers (MTN/Orange adapters)

- AI & Chatbot
  - Web: `AIChatbot` component, SSE subscription via `useAiSSE`
  - Mobile: mobile AI SSE integration (see `lib/ai/AI_SSE_INTEGRATION.md`)
  - Backend: `AiRuntimeService`, `AiPolicyService`, decision logs

- Approvals & Human-in-the-loop
  - Web: `ApprovalsPage` for reviewers
  - Mobile: admin approvals screens (user management area)
  - Backend: `ApprovalRequest` entity, `ApprovalProcessor`

- Admin & Management
  - Web: `/admin/*` routes (user, tariffs, integrations, self-healing)
  - Mobile: admin screens under `lib/screens/admin`
  - Backend: user management endpoints, RBAC

Feature relationships
- Parcel creation → (optional) payment flow → staff validation → assignment → courier delivery → confirmation → analytics.
- AI may inject suggestions between assignment and courier selection; approvals gate high-impact AI changes.
