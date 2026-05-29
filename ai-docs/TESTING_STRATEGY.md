# SmartCAMPOST — Testing Strategy

## Test Pyramid

```
                  ┌─────────────┐
                  │   E2E /     │   Playwright (Web)
                  │  Integration │   integration_test (Mobile)
                  │   Tests      │   Spring Boot @SpringBootTest
                  └──────┬──────┘
              ┌───────────┴───────────┐
              │     Component /       │   React Testing Library
              │   Widget Tests        │   Flutter widget_test
              └───────────┬───────────┘
          ┌────────────────┴────────────────┐
          │           Unit Tests             │   JUnit 5 (BE)
          │                                  │   Vitest (Web)
          │                                  │   dart:test (Mobile)
          └──────────────────────────────────┘
```

---

## Backend Testing Strategy

### Unit Tests (JUnit 5 + Mockito)

**Target:** Service layer only. Repository and Controller layers are tested via integration tests.

```
AuthServiceImplTest
  ✓ login_success_returns_jwt
  ✓ login_wrong_password_increments_failure_count
  ✓ login_5th_failure_locks_account
  ✓ login_locked_account_returns_423
  ✓ login_google_new_user_creates_client_account
  ✓ login_google_existing_user_returns_jwt
  ✓ otp_verify_valid_marks_used_and_returns_jwt
  ✓ otp_verify_expired_throws_OTP_EXPIRED
  ✓ otp_verify_already_used_throws_OTP_ALREADY_USED
  ✓ register_valid_creates_client_and_user_account

ParcelServiceImplTest
  ✓ createParcel_success_generates_tracking_ref
  ✓ createParcel_generates_partial_qr
  ✓ validateAndLock_sets_locked_true
  ✓ validateAndLock_already_locked_throws_PARCEL_ALREADY_LOCKED
  ✓ adminOverride_unlocks_parcel_and_creates_audit_log
  ✓ canCorrect_returns_false_when_locked

DeliveryServiceImplTest
  ✓ sendDeliveryOtp_creates_otp_and_sends_sms
  ✓ verifyDeliveryOtp_valid_marks_used
  ✓ verifyDeliveryOtp_expired_throws
  ✓ completeDelivery_sets_DELIVERED_status
```

### Integration Tests (@SpringBootTest + TestContainers)

Use a real MySQL instance (TestContainers) — not H2.

```
AuthControllerIntegrationTest
  ✓ POST /auth/login → 200 + JWT
  ✓ POST /auth/login wrong password → 401
  ✓ POST /auth/register → 201 (with valid OTP)
  ✓ POST /auth/google → 200 (mock GoogleTokenVerifier)

ParcelControllerIntegrationTest
  ✓ POST /parcels as CLIENT → 201
  ✓ POST /parcels as AGENT → 403
  ✓ GET /parcels/me as CLIENT → only own parcels
  ✓ GET /parcels as ADMIN → all parcels
  ✓ POST /parcels/{id}/validate-and-lock as AGENT → 200
  ✓ POST /parcels/{id}/validate-and-lock as CLIENT → 403
  ✓ PATCH /parcels/{id}/admin-override as ADMIN → 200
  ✓ PATCH /parcels/{id}/admin-override as STAFF → 403

ScanEventControllerIntegrationTest
  ✓ POST /scan-events with GPS → 201
  ✓ POST /scan-events without GPS → 400
  ✓ GET /scan-events/{parcelId} → returns ordered history

RiskControllerIntegrationTest
  ✓ GET /risk/alerts as RISK → 200
  ✓ GET /risk/alerts as CLIENT → 403
  ✓ PATCH /risk/alerts/{id}/status as RISK → 200
```

### Security Tests
```
SecurityIntegrationTest
  ✓ No token → 401 on all protected routes
  ✓ Expired token → 401
  ✓ CLIENT token on /api/admin/** → 403
  ✓ FINANCE token on /api/admin/** → 403
  ✓ RISK token on /api/finance/** → 403
  ✓ Frozen account → 403 on all routes
  ✓ Rate limit: 11th auth request within 1 minute → 429
```

---

## Frontend Web Testing Strategy

### Unit Tests (Vitest)

```
authStore.test.ts
  ✓ login() stores user and token
  ✓ logout() clears state and localStorage
  ✓ setAuth() sets isAuthenticated=true

routeByRole.test.ts
  ✓ CLIENT → /client
  ✓ ADMIN → /admin
  ✓ Unknown role → /

api.test.ts (with MSW)
  ✓ login() calls POST /auth/login
  ✓ login() maps INVALID_CREDENTIALS to i18n key
  ✓ login() maps ACCOUNT_LOCKED to i18n key
```

### Component Tests (React Testing Library)

```
ProtectedWrapper.test.tsx
  ✓ Unauthenticated → renders Navigate to /auth/login
  ✓ Wrong role → renders Navigate to /
  ✓ Correct role → renders children

Login.test.tsx
  ✓ Empty phone → shows required validation
  ✓ Empty password → shows required validation
  ✓ Successful login → navigates to role dashboard
  ✓ Wrong credentials → shows error message
  ✓ Account locked → shows lockout message

CreateParcel.test.tsx
  ✓ All tabs render
  ✓ Weight required validation
  ✓ Service type defaults to STANDARD
  ✓ Submit calls POST /api/parcels
```

### E2E Tests (Playwright)

See full test specs below.

---

## Mobile Testing Strategy

### Unit Tests (dart:test)

```
auth_provider_test.dart
  ✓ login() calls authService.login()
  ✓ login() sets isAuthenticated=true on success
  ✓ login() sets _error on failure
  ✓ logout() calls AuthStorage.clearAll()
  ✓ checkAuth() loads user from secure storage
  ✓ checkAuth() sets isAuthenticated=false if no stored token

parcel_provider_test.dart
  ✓ loadMyParcels() populates _parcels list
  ✓ loadMyParcels(refresh: true) resets page to 0
  ✓ trackParcel() sets _selectedParcel
  ✓ trackParcel() sets error on 404
```

### Widget Tests

```
login_screen_test.dart
  ✓ Renders phone and password fields
  ✓ Shows error on empty submit
  ✓ Shows Google sign-in button
  ✓ Language toggle switches locale

create_parcel_screen_test.dart
  ✓ Weight field is required
  ✓ Service type dropdown shows STANDARD/EXPRESS
  ✓ Fragile toggle changes state

scan_intake_screen_test.dart
  ✓ Counter starts at 0
  ✓ Clear button resets list
  ✓ Error shown when GPS permission denied
```

### Integration Tests (`integration_test`)

```
auth_flow_test.dart
  ✓ Full login flow: enter credentials → submit → navigate to dashboard
  ✓ Wrong credentials: shows error message
  ✓ Logout: returns to login screen

parcel_flow_test.dart
  ✓ Create parcel form: fill all fields → submit → success snackbar
  ✓ Track parcel: enter ref → see result

delivery_flow_test.dart
  ✓ Open delivery screen → start delivery → enter phone → send OTP → enter OTP → confirm
```

---

## Playwright E2E Test Specifications

### Test Setup

```typescript
// playwright.config.ts
export default defineConfig({
  baseURL: 'http://localhost:5173',
  testDir: './e2e',
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

### Test Fixtures

```typescript
// fixtures/auth.fixture.ts
export const clientUser = { phone: '+237699TEST01', password: 'Test123!', role: 'CLIENT' };
export const adminUser  = { phone: '+237699TEST02', password: 'Admin123!', role: 'ADMIN' };
export const agentUser  = { phone: '+237699TEST03', password: 'Agent123!', role: 'AGENT' };
export const financeUser = { phone: '+237699TEST04', password: 'Finance123!', role: 'FINANCE' };
export const riskUser   = { phone: '+237699TEST05', password: 'Risk123!', role: 'RISK' };
```

---

### Playwright Test Files

#### `e2e/auth/login.spec.ts`
```typescript
test('CLIENT: login with phone + password', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name="phoneOrEmail"]', clientUser.phone);
  await page.fill('[name="password"]', clientUser.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/client');
});

test('Wrong password shows error', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[name="phoneOrEmail"]', clientUser.phone);
  await page.fill('[name="password"]', 'wrong');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error-message')).toBeVisible();
});

test('Unauthenticated redirect to login', async ({ page }) => {
  await page.goto('/client/parcels');
  await expect(page).toHaveURL('/auth/login');
});

test('Wrong role redirect to home', async ({ page }) => {
  // login as CLIENT, try to visit /admin
  await loginAs(page, clientUser);
  await page.goto('/admin');
  await expect(page).toHaveURL('/');
});
```

#### `e2e/auth/register.spec.ts`
```typescript
test('CLIENT: full registration with OTP', async ({ page }) => {
  await page.goto('/auth/register');
  await page.fill('[name="fullName"]', 'Test Client');
  await page.fill('[name="phone"]', '+237699NEW001');
  await page.fill('[name="password"]', 'Test123!');
  await page.fill('[name="confirmPassword"]', 'Test123!');
  await page.click('button[data-testid="send-otp"]');
  // Intercept OTP via test API or seed
  await page.fill('[name="otp"]', '000000'); // Test OTP
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/client');
});
```

#### `e2e/parcels/create-parcel.spec.ts`
```typescript
test('CLIENT: create parcel end-to-end', async ({ page }) => {
  await loginAs(page, clientUser);
  await page.goto('/client/parcels/create');
  
  // Tab 1: Addresses
  await page.selectOption('[name="senderAddressId"]', { index: 1 });
  await page.selectOption('[name="recipientAddressId"]', { index: 2 });
  await page.click('button[data-testid="next-tab"]');
  
  // Tab 2: Parcel Details
  await page.fill('[name="weight"]', '2.5');
  await page.fill('[name="dimensions"]', '30x20x15');
  await page.fill('[name="declaredValue"]', '15000');
  await page.click('button[data-testid="next-tab"]');
  
  // Tab 3: Service
  await page.selectOption('[name="serviceType"]', 'STANDARD');
  await page.selectOption('[name="deliveryOption"]', 'AGENCY');
  await page.click('button[data-testid="next-tab"]');
  
  // Tab 4: Payment
  await page.selectOption('[name="paymentOption"]', 'PREPAID');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/\/client\/parcels\/.+/);
  await expect(page.locator('[data-testid="tracking-ref"]')).toBeVisible();
});
```

#### `e2e/parcels/tracking.spec.ts`
```typescript
test('Public tracking: find parcel by ref', async ({ page }) => {
  await page.goto('/tracking');
  await page.fill('[name="trackingRef"]', 'SCP-TEST-0001');
  await page.click('button[data-testid="search"]');
  await expect(page.locator('[data-testid="status-badge"]')).toBeVisible();
  await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
});
```

#### `e2e/admin/user-management.spec.ts`
```typescript
test('ADMIN: create staff account', async ({ page }) => {
  await loginAs(page, adminUser);
  await page.goto('/admin/users/staff');
  await page.click('button[data-testid="create-staff"]');
  await page.fill('[name="fullName"]', 'New Staff Member');
  await page.fill('[name="phone"]', '+237699STAFF1');
  await page.fill('[name="email"]', 'staff@test.cm');
  await page.fill('[name="password"]', 'Staff123!');
  await page.selectOption('[name="role"]', 'STAFF');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success-toast')).toBeVisible();
});

test('ADMIN: freeze user account', async ({ page }) => {
  await loginAs(page, adminUser);
  await page.goto('/admin/accounts');
  await page.click('button[data-testid="freeze-user"]');
  await page.fill('[name="reason"]', 'Suspicious activity');
  await page.click('button[data-testid="confirm-freeze"]');
  await expect(page.locator('[data-testid="frozen-badge"]')).toBeVisible();
});
```

#### `e2e/delivery/otp-delivery.spec.ts`
```typescript
test('COURIER: complete delivery with OTP', async ({ page }) => {
  await loginAs(page, courierUser);
  await page.goto('/courier/deliveries');
  await page.click('button[data-testid="confirm-delivery"]');
  await page.fill('[name="recipientPhone"]', '+237699RECIP1');
  await page.click('button[data-testid="send-otp"]');
  // Seed OTP via backend test API
  await page.fill('[name="otp"]', '999999');
  await page.click('button[data-testid="verify-otp"]');
  await expect(page.locator('.success-message')).toContainText('Delivery confirmed');
});
```

#### `e2e/roles/permission-boundaries.spec.ts`
```typescript
test('CLIENT cannot access admin routes', async ({ page }) => {
  await loginAs(page, clientUser);
  await page.goto('/admin');
  await expect(page).toHaveURL('/');
});

test('FINANCE cannot access parcel management', async ({ page }) => {
  await loginAs(page, financeUser);
  await page.goto('/admin/parcels');
  await expect(page).toHaveURL('/');
});

test('CLIENT cannot call admin API directly', async ({ request }) => {
  const token = await getTokenFor(clientUser);
  const res = await request.post('/api/admin/staff', {
    headers: { Authorization: `Bearer ${token}` },
    data: { fullName: 'Hack', phone: '+237HACK', password: 'Hack123!' }
  });
  expect(res.status()).toBe(403);
});
```

---

## Regression Test Suite (CI)

```yaml
# .github/workflows/ci.yml

Backend Regression:
  - mvn test -Dgroups=unit
  - mvn verify -Dgroups=integration  # requires MySQL TestContainer

Frontend Regression:
  - npm run test:unit       # Vitest
  - npm run test:e2e        # Playwright (headless)
    Suites: auth, parcels/create, parcels/tracking, admin/management, roles/permissions

Mobile Regression:
  - flutter test            # unit + widget tests
  - flutter test integration_test  # requires emulator

Gate: All suites must pass before merge to main.
```

---

## Test Data Strategy

**Test accounts:** Seeded at startup (controlled by `TEST_SEED_DATA=true` env var)
- 1 CLIENT with 3 parcels (various statuses)
- 1 AGENT with linked staff at agency
- 1 COURIER with 2 assigned deliveries
- 1 STAFF
- 1 ADMIN
- 1 FINANCE
- 1 RISK

**Test OTP:** When `NOTIFICATION_GATEWAY=mock`, OTP is always `000000`

**Test MTN:** When `PAYMENT_GATEWAY=mock`, any payment immediately succeeds

**Cleanup:** Each E2E test run cleans up test-seeded data to avoid state pollution
