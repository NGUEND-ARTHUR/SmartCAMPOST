# SmartCAMPOST — Playwright E2E Test Suite

## Quick Start

```bash
# 1. Start the Vite dev server
cd smartcampost-frontend
npm run dev

# 2. Make sure backend is running on http://localhost:8080
#    with NOTIFICATION_GATEWAY=mock and PAYMENT_GATEWAY=mock

# 3. Install Playwright browsers (first time only)
npx playwright install

# 4. Run all tests
npx playwright test

# 5. Run a specific suite
npx playwright test e2e/auth/
npx playwright test e2e/admin/
npx playwright test e2e/permissions/

# 6. Debug mode (headed + step-by-step)
npx playwright test --debug

# 7. View HTML report
npx playwright show-report
```

## Test Architecture

```
e2e/
├── fixtures/
│   ├── global.setup.ts     # Creates test users + saves auth state files
│   ├── index.ts            # Per-role authenticated Page fixtures
│   └── users.ts            # Test user credentials + constants
├── helpers/
│   ├── auth.helpers.ts     # loginViaUI, logoutViaStorage, getStoredToken
│   └── api.helpers.ts      # Direct API calls for test setup/teardown
├── auth/
│   ├── login.spec.ts       # All roles login, error states, redirects
│   ├── register.spec.ts    # CLIENT self-registration with OTP
│   ├── otp-login.spec.ts   # Two-step OTP login
│   └── password-reset.spec.ts  # Three-step password reset
├── admin/
│   ├── dashboard.spec.ts   # Admin dashboard, navigation, SSE feed
│   ├── user-management.spec.ts  # Create staff/agent/courier/finance/risk
│   ├── tariff-management.spec.ts  # Tariff CRUD
│   └── account-freeze.spec.ts   # Freeze/unfreeze user accounts
├── client/
│   ├── dashboard.spec.ts   # Client dashboard, role isolation
│   ├── create-parcel.spec.ts  # 4-step parcel creation form
│   └── tracking.spec.ts    # Public + authenticated tracking
├── agent/
│   ├── dashboard.spec.ts   # Agent dashboard, role isolation
│   └── scan-intake.spec.ts # QR scan, validate-and-lock
├── courier/
│   ├── dashboard.spec.ts   # Courier dashboard, role isolation
│   └── delivery-otp.spec.ts  # OTP delivery flow
├── staff/
│   └── dashboard.spec.ts   # Staff dashboard, permissions
├── finance/
│   ├── dashboard.spec.ts   # Finance dashboard, role isolation
│   └── refund-management.spec.ts  # Approve/reject refunds
├── risk/
│   ├── dashboard.spec.ts   # Risk dashboard, role isolation
│   └── alerts.spec.ts      # Alert CRUD, freeze user
├── permissions/
│   └── role-boundaries.spec.ts  # Cross-role access matrix, API boundaries
└── security/
    └── session.spec.ts     # JWT storage, expiry, logout, rate limiting
```

## Business Rules Being Tested

1. **CLIENT** can self-register via `/auth/register` (no admin required)
2. **AGENT, COURIER, STAFF, FINANCE, RISK** — created only by **ADMIN**
3. **ADMIN** bootstrapped from env vars on backend startup
4. JWT: 8-hour TTL, stored in localStorage (known security gap GR-04)
5. Account lockout: 5 failed logins → 15-min lockout
6. Parcel lock: only AGENT/STAFF/ADMIN can validate-and-lock
7. Only ADMIN can admin-override locked parcels
8. Only ADMIN/RISK can freeze user accounts

## Test Users (Created by global.setup.ts)

| Role | Phone | Password |
|---|---|---|
| ADMIN | admin@smartcampost.cm | Admin@SmartCAMPOST2026 |
| CLIENT | +237699000001 | Test123!Client |
| STAFF | +237699000002 | Test123!Staff |
| AGENT | +237699000003 | Test123!Agent |
| COURIER | +237699000004 | Test123!Courier |
| FINANCE | +237699000005 | Test123!Finance |
| RISK | +237699000006 | Test123!Risk |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:5173` | Frontend URL |
| `API_URL` | `http://localhost:8080` | Backend API URL |
| `CI` | — | Set in CI to enable stricter retries/workers |

## Known Test Gaps (Documented Security Risks)

- **GR-04**: JWT in localStorage — documented in `security/session.spec.ts`
- **GR-07**: No JWT expiry check on app start — documented test in `security/session.spec.ts`
- **GR-05**: MTN webhook not authenticated — no E2E test (backend-only fix needed)
- **GR-03**: No offline DB on mobile — not testable in web E2E suite
