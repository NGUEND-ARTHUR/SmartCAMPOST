# SmartCAMPOST — QA Roadmap

## Phase 1: Stabilize Architecture (Weeks 1–2)

### 1.1 Security Fixes (Critical — All)
- [ ] **BE:** Add JWT blocklist (Redis) to support token revocation
- [ ] **BE:** Persist account lockout state in Redis (not JVM memory)
- [ ] **BE:** Add Redis-backed rate limiting to replace in-memory token bucket
- [ ] **BE:** Verify MTN MoMo webhook signature in `MtnController`
- [ ] **BE:** Add live `UserAccount.frozen` check in `JwtAuthFilter` on each request
- [ ] **WEB:** Move JWT from localStorage to httpOnly cookie
- [ ] **WEB:** Add response interceptor: 401 → logout + redirect to `/auth/login`
- [ ] **WEB:** Check JWT expiry on app load (decode `exp` claim)
- [ ] **MOB:** Add 401 interceptor in Dio that triggers GoRouter redirect to `/login`
- [ ] **MOB:** Check JWT expiry in `AuthProvider.checkAuth()` on app start
- [ ] **ALL:** Remove hardcoded Google OAuth client ID defaults; make required env config

### 1.2 API Stability Fixes
- [ ] **BE:** Add `/api/v1/` versioning prefix
- [ ] **BE:** Add idempotency key support on `POST /api/parcels` and `POST /api/payments`
- [ ] **BE:** Validate GPS coordinates within Cameroon bounding box in ScanEvent creation
- [ ] **BE:** Add explicit HikariCP connection pool configuration
- [ ] **WEB:** Fix Axios interceptor: use `useAuthStore.getState().token` directly
- [ ] **WEB:** Remove `/mtn-test` and `/admin/api-coverage` from production router

---

## Phase 2: Fix Inconsistencies (Weeks 3–4)

### 2.1 Frontend/Backend Consistency
- [ ] **WEB:** Implement `InvoicesPage.tsx` — list + `GET /api/invoices/{id}/pdf` download
- [ ] **WEB:** Wire `NotificationsDrawer` mark-as-read to backend endpoint
- [ ] **WEB:** Implement audit log viewer page (`/admin/audit`)
- [ ] **WEB:** Implement AI recommendations review page
- [ ] **WEB:** Wire analytics pages to real backend data (parcel volume, revenue)
- [ ] **WEB:** Complete refund client-side status tracking

### 2.2 Mobile/Backend Consistency
- [ ] **MOB:** Add scan event timeline to `ParcelDetailScreen`
- [ ] **MOB:** Implement `image_picker` for delivery photo proof in `DeliveryConfirmationScreen`
- [ ] **MOB:** Implement pickup creation UI (client can request pickup from mobile)
- [ ] **MOB:** Implement `NotificationsScreen` mark-as-read properly
- [ ] **MOB:** Add route map for courier (`flutter_map` already in pubspec)

### 2.3 Data Consistency
- [ ] **BE:** Admin override should create a ScanEvent (`ADMIN_OVERRIDE`) alongside AuditLog
- [ ] **ALL:** Complete i18n error code mapping (audit all ErrorCode enum values)

---

## Phase 3: Complete Missing Integrations (Weeks 5–6)

### 3.1 Payment Integration
- [ ] **WEB:** Complete MTN MoMo payment flow in `ClientPayments.tsx`
- [ ] **WEB:** Add payment status polling until SUCCESS/FAILED
- [ ] **MOB:** Implement payment screen (PaymentsScreen, currently placeholder)
- [ ] **ALL:** Test full PREPAID + COD + refund cycle end-to-end

### 3.2 Push Notifications
- [ ] **MOB:** Integrate Firebase Cloud Messaging (`firebase_messaging` package)
- [ ] **MOB:** Handle foreground + background notification
- [ ] **MOB:** Add deep-link from notification to parcel/delivery detail
- [ ] **BE:** Add FCM token storage and push notification service

### 3.3 Offline Support (Mobile)
- [ ] **MOB:** Integrate Hive or Drift local database
- [ ] **MOB:** Implement scan event queue (create locally when offline)
- [ ] **MOB:** Implement delivery action queue (OTP verify, complete delivery)
- [ ] **MOB:** Implement background sync using `workmanager`
- [ ] **MOB:** Add offline banner using `connectivity_plus`
- [ ] **BE:** Verify deduplication logic in `POST /api/sync/scan-events`

### 3.4 Token Refresh
- [ ] **BE:** Implement refresh token endpoint (`POST /api/auth/refresh`)
- [ ] **WEB:** Add silent token refresh in Axios response interceptor
- [ ] **MOB:** Add silent token refresh in Dio error interceptor

---

## Phase 4: Verify Permissions (Week 7)

### 4.1 Backend Permission Audit
- [ ] Audit every `@PreAuthorize` annotation matches the permissions matrix in `PERMISSIONS_MATRIX.md`
- [ ] Verify client data isolation: `parcel.client_id = current_user.entityId` enforced on every parcel read
- [ ] Verify agent agency scope: only parcels at their agency are returned
- [ ] Verify courier scope: only assigned pickups/deliveries returned
- [ ] Confirm `POST /api/auth/register` hardcodes `role = CLIENT` (no role injection possible)
- [ ] Verify all ADMIN-only creation endpoints reject non-ADMIN tokens

### 4.2 Frontend Permission Audit
- [ ] Verify all 7 role route trees have correct `allowedRoles` in `ProtectedWrapper`
- [ ] Verify no CLIENT-role user can access `/admin/*`, `/finance/*`, or `/risk/*`
- [ ] Verify FINANCE cannot access parcel management routes
- [ ] Test role escalation attempt: CLIENT token calling ADMIN endpoint → must get 403

---

## Phase 5: Implement QA Automation (Week 8)

### 5.1 Backend Tests
- [ ] Auth service unit tests (login, lockout, OTP, Google OAuth)
- [ ] Parcel service unit tests (create, validate, lock, override)
- [ ] Delivery service unit tests (OTP, proof, complete)
- [ ] Permission tests: verify role restrictions return 403
- [ ] Integration tests with real MySQL (not mocked) for critical flows

### 5.2 Frontend Tests
- [ ] Unit tests for `authStore` (login, logout, token handling)
- [ ] Unit tests for `routeByRole`
- [ ] Component tests for `ProtectedWrapper` (redirect behavior)
- [ ] React Query hook tests with `msw` (mock service worker)

### 5.3 Mobile Tests
- [ ] Unit tests for `AuthProvider` (login, logout, checkAuth)
- [ ] Unit tests for `ParcelProvider` (pagination, tracking)
- [ ] Widget tests for `LoginScreen`, `CreateParcelScreen`
- [ ] Integration test for GoRouter auth redirect

---

## Phase 6: Generate Playwright Tests (Week 9)

See `TESTING_STRATEGY.md` for full Playwright test specifications.

### Priority 1: Auth Flows
- [ ] CLIENT registration with OTP
- [ ] Login: phone + password (success + wrong password + lockout)
- [ ] Login: Google OAuth (mock)
- [ ] OTP login
- [ ] Password reset
- [ ] Protected route redirect on logout

### Priority 2: Core Parcel Workflows
- [ ] CLIENT creates parcel (multi-step form, GPS capture)
- [ ] Agent validates and locks parcel
- [ ] Courier delivers parcel (OTP flow)
- [ ] Public tracking by reference

### Priority 3: Admin Workflows
- [ ] Admin creates staff account
- [ ] Admin freezes user account
- [ ] Admin unlocks parcel (override)
- [ ] Tariff management CRUD

### Priority 4: Payment Workflows
- [ ] PREPAID payment init + status poll
- [ ] Refund request + finance approval

---

## Phase 7: Test All Workflows (Week 10)

Manual + automated workflow validation:

- [ ] WF-01: Client Registration → Login → Create Parcel → Track
- [ ] WF-02: Admin creates Agent → Agent logs in → Scans parcel intake
- [ ] WF-03: Agent validates parcel → locks → generates final QR
- [ ] WF-04: Courier assigned → picks up → delivers with OTP + photo
- [ ] WF-05: Client pays → MTN confirms → Invoice generated
- [ ] WF-06: Finance approves refund → Client notified
- [ ] WF-07: Risk alert raised → RISK officer freezes user account
- [ ] WF-08: Admin detects congestion → executes self-healing action
- [ ] WF-09: Offline scan on mobile → sync on reconnect

---

## Phase 8: Test All Roles (Week 11)

For each role, verify full happy path + permission boundaries:

| Role | Happy Path | Permission Denial |
|---|---|---|
| CLIENT | Register → Create Parcel → Pay → Track | Cannot access /admin, /finance |
| AGENT | Login → Scan intake → Validate → Lock | Cannot access /finance, cannot freeze users |
| COURIER | Login → Accept pickup → Deliver + OTP | Cannot see financial data |
| STAFF | Login → View all parcels → Analytics | Cannot create accounts |
| ADMIN | Create accounts → Freeze user → Override parcel | — |
| FINANCE | Login → View payments → Approve refund | Cannot modify parcels |
| RISK | Login → View alerts → Freeze user | Cannot approve AI actions |

---

## Phase 9: Automate Regression Testing (Week 12)

### CI/CD Pipeline
- [ ] Backend: Maven Surefire + Failsafe on every PR
- [ ] Frontend: Vitest + Playwright on every PR
- [ ] Mobile: Flutter test + integration_test on every PR
- [ ] All gates required to pass before merge to main

### Regression Suites
- [ ] Auth regression: all login methods for all roles
- [ ] Parcel lifecycle regression: create → track → deliver
- [ ] Permission regression: role boundary tests
- [ ] API contract regression: validate response shapes haven't changed

### Monitoring
- [ ] Backend: Actuator + Grafana health dashboard
- [ ] Frontend: Error boundary + Sentry or equivalent
- [ ] Mobile: Crashlytics
