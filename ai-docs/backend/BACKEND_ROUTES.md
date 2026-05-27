# Backend Routes & Controllers

This document lists the primary HTTP controllers, their base routes and quick notes about who can call them.

- Authentication: [AuthController](backend/src/main/java/com/smartcampost/backend/controller/AuthController.java)
  - Base: `/api/auth`
  - Key endpoints: `/register`, `/login`, `/google`, `/login/otp/request`, `/login/otp/confirm`, `/send-otp`, `/verify-otp`, `/password/reset/*`

- AI / Recommendations: [AIController](backend/src/main/java/com/smartcampost/backend/controller/AIController.java) and [AiRecommendationController](backend/src/main/java/com/smartcampost/backend/controller/AiRecommendationController.java)
  - Base: `/api/ai` (various tool endpoints)

- Approvals: [ApprovalController](backend/src/main/java/com/smartcampost/backend/controller/ApprovalController.java)
  - Base: `/api/approvals`
  - Key endpoints: `GET /api/approvals/pending`, `POST /api/approvals/{id}/approve`, `POST /api/approvals/{id}/deny`

- Streaming / SSE: [StreamController](backend/src/main/java/com/smartcampost/backend/controller/StreamController.java)
  - Base: `/api/stream/ai`
  - Notes: supports EventSource; JWT may be passed as `?token=` query param for SSE connections.

- Parcels / Pickup / Delivery: [ParcelController](backend/src/main/java/com/smartcampost/backend/controller/ParcelController.java), [PickupRequestController](backend/src/main/java/com/smartcampost/backend/controller/PickupRequestController.java), [DeliveryController](backend/src/main/java/com/smartcampost/backend/controller/DeliveryController.java)
  - Base: `/api/parcels`, `/api/pickups`, `/api/delivery`

- Payments: [PaymentController](backend/src/main/java/com/smartcampost/backend/controller/PaymentController.java) and mobile provider webhook [MtnController](backend/src/main/java/com/smartcampost/backend/controller/MtnController.java)
  - Base: `/api/payments`, `/api/payments/mtn/**`

- Admin & Finance: [AdminController](backend/src/main/java/com/smartcampost/backend/controller/AdminController.java), [FinanceController](backend/src/main/java/com/smartcampost/backend/controller/FinanceController.java)
  - Base: `/api/admin`, `/api/finance`

- Notifications, Tracking, Scans, Risk, Compliance, Support: controllers under `/api/notifications`, `/api/track`, `/api/scan-events`, `/api/risk`, `/api/compliance`, `/api/support`

Notes on authorization
- See [SecurityConfig](backend/src/main/java/com/smartcampost/backend/security/SecurityConfig.java) for route-to-role mappings and which endpoints are public.
