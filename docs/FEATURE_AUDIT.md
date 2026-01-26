# Feature Audit — SmartCAMPOST

This file maps backend controller base paths to frontend pages / services and notes fixes applied.

Summary of fixes applied
- Centralized API client in `smartcampost-frontend/src/services/apiClient.ts` (axios)
- Fixed request payload mapping in `smartcampost-frontend/src/lib/api.ts` so JSON-string `body` -> object and `identifier` → `phone` for OTP/reset flows.
- Added `smartcampost-frontend/.env.development` and `.env.production` to set `VITE_API_URL`.

Audit (selected controllers)

- `/api/auth` — USED
  - Frontend: `src/lib/api.ts`, `src/store/authStore.ts`, pages under `src/pages/auth/*`.
  - Notes: Login, OTP, Register, Password Reset flows call `/auth/*`. Fixed payload keys and JSON body handling.

- `/api/parcels` — USED
  - Frontend: `src/services/parcels/*.api.ts`, pages under `src/pages/parcels/*`.

- `/api/pickups` — USED
  - Frontend: `src/services/pickups/*`, pages `src/pages/pickups/*`.

- `/api/delivery` & `/api/receipts` — USED
  - Frontend: `src/services/deliveries/*`, `src/services/payments/receipts.api.ts`, pages under `src/pages/deliveries` and `src/pages/payments`.

- `/api/notifications` — USED
  - Frontend: `src/services/notifications/*`, `src/pages/notifications/*`.

- `/api/staff`, `/api/couriers`, `/api/users` — USED
  - Frontend: `src/services/users/*`, pages under `src/pages/users/*`.

- `/api/tariffs`, `/api/pricing-details` — USED
  - Frontend: `src/services/dashboard/tariffs.api.ts`, `src/services/parcels/pricingdetails.api.ts`.

- `/api/payments`, `/api/payments/mtn` — USED
  - Frontend: `src/services/payments/*`, `src/pages/payments/*`.

- Misc controllers (geo, risk, scan-events, integrations, support, refunds, qr, ussd, finance):
  - Most have corresponding services under `src/services/*` except where functionality is purely server-side (e.g., some admin-only endpoints).

Missing / Not used endpoints
- If an endpoint is not referenced, it's either internal (webhooks, integrations) or not yet integrated in the UI. See code under `backend/src/main/java/.../controller` for the full list.

How to extend this audit
- Use `grep -R "/api/<path>" smartcampost-frontend/src` to find frontend usage for each backend path.

If you want, I can expand this into a full per-endpoint table (method + route + frontend file + status). 
