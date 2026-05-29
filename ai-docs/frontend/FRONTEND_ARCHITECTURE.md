# SmartCAMPOST — Frontend Architecture

## Stack

| Property | Value |
|---|---|
| Framework | React 19.2 + TypeScript 5.9 |
| Build Tool | Vite 7.2.4 |
| Routing | React Router DOM 7.10.1 |
| UI Library | Radix UI + shadcn-style custom components |
| CSS | Tailwind CSS 4.1.17 |
| State (auth) | Zustand 5.0.9 (localStorage-persisted) |
| State (server) | TanStack React Query 5.90.16 |
| HTTP Client | Axios 1.13.2 |
| Forms | React Hook Form 7.70.0 |
| Auth | `@react-oauth/google` 0.13.4 |
| Maps | React Map GL + MapLibre GL 4.7.1 |
| Charts | Recharts 3.6.0 |
| QR | qrcode.react, html5-qrcode |
| i18n | i18next 25.7.4, react-i18next |
| Export | jsPDF, jspdf-autotable, XLSX |
| Notifications | Sonner 2.0.7 |
| Icons | Lucide React 0.562.0 |

---

## Directory Structure

```
smartcampost-frontend/
├── src/
│   ├── ai/                       # AI agent utilities + fuzzy matching
│   ├── components/
│   │   ├── auth/                 # ProtectedRoute.tsx
│   │   ├── chat/                 # AIChatbot.tsx + knowledgeBase.ts
│   │   ├── delivery/             # DeliveryWorkflowStepper, AuditTrail
│   │   ├── maps/                 # CameroonMap, TrackingMap, LocationPicker, etc.
│   │   ├── qrcode/               # QRCodeDisplay, QRCodeScanner, DeliveryConfirmation
│   │   ├── transitions/          # ActionButton (animated)
│   │   ├── ui/                   # Shadcn-style primitives (button, card, dialog, etc.)
│   │   ├── EmptyState.tsx
│   │   ├── NotificationsDrawer.tsx
│   │   ├── StatusBadge.tsx
│   │   └── ThemedToaster.tsx
│   ├── hooks/                    # React Query custom hooks (organized by domain)
│   │   ├── ai/, compliance/, dashboard/, deliveries/, notifications/
│   │   ├── parcels/, payments/, pickups/, support/, users/
│   │   ├── useGeolocation.tsx, useGpsLocation.ts
│   │   ├── useOfflineSync.ts, useQrVerification.ts, useScanSSE.tsx
│   ├── i18n/                     # EN + FR JSON translation files
│   ├── layouts/
│   │   └── RoleLayout.tsx        # Sidebar nav + main area, role-aware
│   ├── lib/
│   │   ├── api.ts                # Auth API calls + error code mapping
│   │   ├── axiosClient.ts        # Axios instance + auth interceptor
│   │   ├── routeByRole.ts        # Role → route mapping
│   │   ├── exportCsv.ts          # CSV/JSON/XLSX/PDF export
│   │   └── utils.ts
│   ├── pages/                    # Page components organized by role/feature
│   │   ├── admin/                # UserAccountManagement, TariffManagement, etc.
│   │   ├── analytics/, auth/, common/, compliance/, dashboard/
│   │   ├── debug/                # ApiCoverage page
│   │   ├── deliveries/, maps/, notifications/, parcels/
│   │   ├── payments/, pickups/, scan/, support/, users/
│   ├── services/                 # API service wrappers (organized by domain)
│   │   ├── ai/, analytics/, common/, compliance/, coverage/
│   │   ├── dashboard/, deliveries/, maps/, mtn/, notifications/
│   │   ├── parcels/, payments/, pickups/, scan/, support/, users/
│   ├── store/
│   │   └── authStore.ts          # Zustand auth store
│   ├── theme/
│   │   └── ThemeProvider.tsx     # Dark/light/system theme
│   ├── types/
│   │   └── index.ts              # All shared TypeScript types
│   ├── App.tsx                   # Router root
│   └── main.tsx                  # Entry point + GoogleOAuthProvider
├── e2e/                          # Playwright end-to-end tests
├── tests/                        # Unit/integration tests
├── .env.development
├── .env.production
└── playwright.config.ts
```

---

## Application Architecture Layers

```
Browser
  │
  ▼
┌──────────────────────────────────────────────────────┐
│                     App.tsx (Router)                  │
│  ProtectedWrapper (route guards)                      │
└──────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────┐
│                 RoleLayout.tsx                        │
│  Sidebar nav + Header + Theme + i18n + Notifications │
└──────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────┐
│                    Pages (lazy-loaded)                │
│  Read server state via React Query hooks             │
│  Mutate via React Query mutations                    │
└──────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────┐
│          Custom Hooks (hooks/<domain>/use*.ts)        │
│  Wrap React Query queries/mutations                  │
└──────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────┐
│         Service Layer (services/<domain>/*.api.ts)    │
│  Typed API calls via httpClient                      │
└──────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────┐
│          axiosClient.ts (Axios + Interceptor)         │
│  Injects Authorization: Bearer <token>               │
└──────────────────────────────────────────────────────┘
  │
  ▼
  Backend API (https://smartcampost-backend.onrender.com/api)
```

---

## State Management Strategy

### Authentication State — Zustand (`authStore.ts`)
```typescript
interface AuthState {
  user: User | null          // Logged-in user object
  token: string | null       // JWT string
  isAuthenticated: boolean
  isLoading: boolean
}
```
- Persisted to **localStorage** under key `auth-storage`
- Read on app startup to restore session
- Cleared on logout

### Server State — React Query
- All API data (parcels, users, payments, etc.) managed by React Query
- Default stale time: 5 minutes
- Automatic refetch on window focus: disabled
- Cache invalidation triggered after mutations
- DevTools panel available in development

### Theme State — Context
- `ThemeProvider` wraps the app
- System/light/dark mode
- Persisted to localStorage

### i18n State — i18next
- EN/FR translations in `i18n/locales/`
- Language toggle in `RoleLayout` sidebar
- Persisted to localStorage

---

## Key Design Decisions

### Code Splitting
Heavy pages (map-based) are lazy-loaded:
```typescript
const RoleMapDashboard = React.lazy(() => import("./pages/maps/RoleMapDashboard"));
```

### API Error Handling
`lib/api.ts` maps backend error codes to i18n keys:
```typescript
const API_ERROR_CODES = {
  INVALID_CREDENTIALS: "errors.invalidCredentials",
  ACCOUNT_LOCKED: "errors.accountLocked",
  OTP_INVALID: "errors.invalidOtp",
  ...
};
```

### Role-Based Routing
All role-specific prefixes (`/client/`, `/admin/`, etc.) are wrapped with `ProtectedWrapper`:
```typescript
<ProtectedWrapper allowedRoles={["CLIENT"]}>
  <RoleLayout role="CLIENT" />
</ProtectedWrapper>
```

### Export Capabilities
`lib/exportCsv.ts` provides CSV, JSON, XLSX, PDF export for all data tables.

---

## Environment Configuration

**Development (`.env.development`):**
```
VITE_API_BASE_URL=http://localhost:8082/api
VITE_GOOGLE_CLIENT_ID=428837425425-hvbdljimv02i2kapehk51haap4160v68.apps.googleusercontent.com
```

**Production (`.env.production`):**
```
VITE_API_BASE_URL=https://smartcampost-backend.onrender.com/api
VITE_GOOGLE_CLIENT_ID=<production client id>
```
