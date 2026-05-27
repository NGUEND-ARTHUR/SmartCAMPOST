# Frontend API Usage

API client layers
- `src/lib/axiosClient.ts` — low-level axios instance and interceptors.
- `src/lib/api.ts` — higher-level wrappers for calls used across the app.
- Domain clients: `src/services/*` (e.g., `parcels.api.ts`, `deliveries.api.ts`, `approvals.api.ts`, `ai.api.ts`, `payments/mtn.api.ts`).

References
- Axios client and interceptor (adds Authorization header from localStorage): [smartcampost-frontend/src/lib/axiosClient.ts](smartcampost-frontend/src/lib/axiosClient.ts#L1-L30)
- Approvals domain client (pending/approve/deny): [smartcampost-frontend/src/services/approvals/approvals.api.ts](smartcampost-frontend/src/services/approvals/approvals.api.ts#L1-L40)
- AI service endpoints (route optimize, chat): [smartcampost-frontend/src/services/ai/ai.api.ts](smartcampost-frontend/src/services/ai/ai.api.ts#L1-L40)


Auth headers
- `axiosClient` attaches `Authorization: Bearer <token>` when token is available. SSE endpoints cannot set headers; hooks append `?token=` to the EventSource URL.

Key APIs consumed by frontend
- Auth: `/api/auth/login`, `/api/auth/google`, `/api/auth/refresh` (if present).
- Parcels: `/api/parcels/*` — create, list, detail, update.
- Deliveries/Assignment: `/api/deliveries/*`, `/api/assignments/*`.
- Payments: `/api/payments/mtn/*` and `payments/` wrappers.
- Approvals: `/api/approvals/*` — fetch pending approvals, approve/deny endpoints.
- AI: `/api/stream/ai` (SSE), `/api/ai/execute` (tool requests), `/api/ai/logs`.

Error handling
- Domain clients return typed error objects; UI shows error toasts. Critical operations show confirmation dialogs before calling write APIs.

Retries and idempotency
- Long-running operations like `createParcel` or `assignCourier` implement client-side confirmation and retry UI; server must provide idempotency keys for safe retries. The frontend currently re-sends requests when retrying.

Notes
- Check `src/services/ai/ai.api.ts` and `src/services/approvals/approvals.api.ts` for exact endpoints and DTO shapes.
