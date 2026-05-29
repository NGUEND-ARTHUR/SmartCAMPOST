# SmartCAMPOST — Frontend API Usage

## HTTP Client Configuration

**Axios instance (`services/apiClient.ts` / `lib/axiosClient.ts`):**
```typescript
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});
```

**Auth Interceptor:**
```typescript
axiosInstance.interceptors.request.use((config) => {
  const stored = localStorage.getItem("auth-storage");
  const token = JSON.parse(stored)?.state?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Base URLs:**
| Environment | URL |
|---|---|
| Development | `http://localhost:8082/api` |
| Production | `https://smartcampost-backend.onrender.com/api` |

---

## Service Layer Map

Each domain has a dedicated service file under `services/<domain>/`:

| Service File | API Paths Covered |
|---|---|
| `auth` (`lib/api.ts`) | `/auth/*` |
| `parcels.api.ts` | `/parcels/*` |
| `scanEvents.api.ts` | `/scan-events/*` |
| `pickups.api.ts` | `/pickups/*` |
| `deliveries.api.ts` | `/delivery/*` |
| `couriers.api.ts` | `/couriers/*` |
| `payments.api.ts` | `/payments/*` |
| `finance.api.ts` | `/finance/*` |
| `refunds.api.ts` | `/refunds/*` |
| `invoices.api.ts` | `/invoices/*` |
| `receipts.api.ts` | `/receipts/*` |
| `clients.api.ts` | `/clients/*` |
| `staff.api.ts` | `/staff/*` |
| `agents.api.ts` | `/agents/*` |
| `agencies.api.ts` | `/agencies/*` |
| `admin.api.ts` | `/admin/*` |
| `dashboard.api.ts` | `/dashboard/*` |
| `tariffs.api.ts` | `/tariffs/*` |
| `notifications.api.ts` | `/notifications/*` |
| `support.api.ts` | `/support/*` |
| `risk.api.ts` | `/risk/*` |
| `compliance.api.ts` | `/compliance/*` |
| `analytics.api.ts` | `/analytics/*` |
| `audit.api.ts` | `/audit/*` |
| `map.api.ts` | `/maps/*`, `/geo/*` |
| `geolocation.api.ts` | `/geolocation/*` |
| `integrations.api.ts` | `/integrations/*` |
| `selfHealing.api.ts` | `/self-healing/*` |
| `ai.api.ts` | `/ai/*` |
| `mtn.api.ts` | `/payments/mtn/*` |
| `qrVerification.api.ts` | `/qr/*` |
| `pricingQuote.api.ts` | `/pricing/calculate` |
| `pricingDetails.api.ts` | `/pricing/*` |
| `addressService.ts` | `/addresses/*` |
| `coverage.api.ts` | Debug API coverage |

---

## React Query Hooks Map

| Hook | Query Key | Service |
|---|---|---|
| `useParcels` | `["parcels"]` | `parcels.api.ts` |
| `useMyParcels` | `["my-parcels"]` | `parcels.api.ts` |
| `useParcelDetail` | `["parcel", id]` | `parcels.api.ts` |
| `useScanEvents` | `["scan-events", parcelId]` | `scanEvents.api.ts` |
| `usePickups` | `["pickups"]` | `pickups.api.ts` |
| `useMyPickups` | `["my-pickups"]` | `pickups.api.ts` |
| `useDelivery` | `["delivery", parcelId]` | `deliveries.api.ts` |
| `useCouriers` | `["couriers"]` | `couriers.api.ts` |
| `usePayments` | `["payments"]` | `payments.api.ts` |
| `useFinance` | `["finance"]` | `finance.api.ts` |
| `useRefunds` | `["refunds"]` | `refunds.api.ts` |
| `useClients` | `["clients"]` | `clients.api.ts` |
| `useAgents` | `["agents"]` | `agents.api.ts` |
| `useAgencies` | `["agencies"]` | `agencies.api.ts` |
| `useStaff` | `["staff"]` | `staff.api.ts` |
| `useAdmin` | `["admin"]` | `admin.api.ts` |
| `useDashboard` | `["dashboard"]` | `dashboard.api.ts` |
| `useTariffs` | `["tariffs"]` | `tariffs.api.ts` |
| `useNotifications` | `["notifications"]` | `notifications.api.ts` |
| `useSupportTickets` | `["tickets"]` | `support.api.ts` |
| `useCompliance` | `["compliance"]` | `compliance.api.ts` |
| `useRisk` | `["risk-alerts"]` | `risk.api.ts` |
| `useMyAddresses` | `["addresses"]` | `addressService.ts` |
| `useAI` | `["ai"]` | `ai.api.ts` |
| `useGeolocation` | `["geolocation"]` | `geolocation.api.ts` |
| `useIntegrations` | `["integrations"]` | `integrations.api.ts` |
| `usePricingQuote` | `["pricing-quote"]` | `pricingQuote.api.ts` |
| `usePricingDetails` | `["pricing-details"]` | `pricingDetails.api.ts` |

---

## Key API Calls by Feature

### Auth
```typescript
POST /api/auth/login                   → { phoneOrEmail, password }
POST /api/auth/register                → { fullName, phone, otp, password, ... }
POST /api/auth/google                  → { idToken }
POST /api/auth/send-otp               → { phone, purpose }
POST /api/auth/login/otp/request      → { phone }
POST /api/auth/login/otp/confirm      → { phone, otp }
POST /api/auth/password/reset/request → { phone }
POST /api/auth/password/reset/confirm → { phone, otp, newPassword }
```

### Parcels
```typescript
POST   /api/parcels                              → Create parcel
GET    /api/parcels/me?page=0&size=20            → My parcels (CLIENT)
GET    /api/parcels?page=0&size=20               → All parcels (ADMIN/STAFF)
GET    /api/parcels/{id}                         → Parcel detail
GET    /api/parcels/tracking/{ref}               → Public tracking
PATCH  /api/parcels/{id}/status                  → Update status
POST   /api/parcels/{id}/validate-and-lock        → Agent lock
PATCH  /api/parcels/{id}/admin-override           → Admin unlock
```

### Scan Events
```typescript
POST /api/scan-events                           → Create scan event
GET  /api/scan-events/{parcelId}                → Full history
GET  /api/scan-events/{parcelId}/latest         → Last event
POST /api/sync/scan-events                      → Offline bulk sync
```

### Delivery
```typescript
POST /api/delivery/start                        → Start delivery
POST /api/delivery/otp/send                     → Send OTP to recipient
POST /api/delivery/otp/verify                   → Verify OTP
POST /api/delivery/proof                        → Upload proof
POST /api/delivery/complete                     → Complete delivery
POST /api/delivery/{parcelId}/failed            → Mark failed
```

### Pickup
```typescript
POST   /api/pickups                             → Request pickup
GET    /api/pickups/me?page=0&size=20           → My pickups (COURIER)
GET    /api/pickups?page=0&size=20              → All pickups
GET    /api/pickups/{id}                        → Pickup detail
POST   /api/pickups/{id}/assign-courier         → Assign courier
POST   /api/pickups/confirm                     → Complete pickup
```

### QR
```typescript
POST /api/qr/validate                           → Validate QR code
GET  /api/qr/verify/{qrData}                    → Verify QR (alt)
POST /api/qr/secure/{parcelId}                  → Get secure QR
```

### Payment
```typescript
POST /api/payments                              → Init payment
GET  /api/payments/{id}                         → Payment status
GET  /api/payments/parcel/{parcelId}            → Payments for parcel
POST /api/payments/init                         → Alt init
POST /api/payments/confirm                      → Confirm payment
POST /api/payments/{id}/refund                  → Request refund
```

### Admin
```typescript
POST  /api/admin/staff                           → Create staff
POST  /api/admin/agents                          → Create agent
POST  /api/admin/couriers                        → Create courier
GET   /api/admin/users                           → All user accounts
PATCH /api/admin/users/{id}/freeze              → Freeze account
PATCH /api/admin/users/{id}/unfreeze            → Unfreeze account
GET   /api/admin/dashboard                      → Admin metrics
```

### Self-Healing
```typescript
GET  /api/self-healing/congestion               → Congestion alerts
POST /api/self-healing/execute                  → Execute action
```

### AI
```typescript
POST /api/ai/chat                               → AI chat message
GET  /api/ai/recommendations                    → AI recommendations
PATCH /api/ai/recommendations/{id}/approve     → Approve recommendation
```

### SSE (Real-time)
```typescript
EventSource /api/sse/scan-events?token={jwt}    → Live scan feed
```

---

## React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});
```

---

## Error Handling Pattern

```typescript
// lib/api.ts
function parseApiError(error: unknown): string {
  const axiosError = error as AxiosError<{ code: string; message: string }>;
  const backendCode = axiosError.response?.data?.code;
  const i18nKey = API_ERROR_CODES[backendCode];
  if (i18nKey) return t(i18nKey);
  return axiosError.response?.data?.message || t("errors.generic");
}
```

Components catch errors from React Query and display:
- Form inline error for auth forms
- Toast (`sonner`) for mutations
- Error state UI for failed data loads

---

## Missing API Integrations (Frontend Gaps)

| Feature | Status | Notes |
|---|---|---|
| `PUT /notifications/{id}/read` | Stub in mobile, not verified in web | Notification mark-read may not be wired |
| Refund approval/rejection | Service exists, UI in Refunds.tsx | Needs verification |
| Invoice download (PDF) | InvoicesPage.tsx is partial | Not fully implemented |
| AI recommendations UI | `ai.api.ts` exists | No dedicated review UI page |
| Analytics page | Generic stub | No actual chart data from API |
| Compliance reports | Stub | Minimal implementation |
| Audit log page | Not implemented in web frontend | Only in admin dashboard links |
