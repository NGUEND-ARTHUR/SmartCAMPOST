# SmartCAMPOST — Mobile Screens

## Auth Screens

### LoginScreen (`screens/auth/login_screen.dart`)
- Phone + password fields with show/hide toggle
- Validation: phone regex `^\+?[0-9]{8,15}$`, password min 8 + uppercase + digit
- Google Sign-In button (uses `google_sign_in` → idToken → backend)
- OTP login link → `/otp-login`
- Register link → `/register`
- Language toggle EN/FR
- Error display from AuthProvider

### RegisterScreen (`screens/auth/register_screen.dart`)
- Full Name, Phone, Email (optional), Password, Confirm Password
- Same validation rules as login
- Google Sign-Up button (same flow as login via Google)
- On success: success snackbar → pop back to login

### OtpLoginScreen (`screens/auth/otp_login_screen.dart`)
- Step 1: Phone input → "Send OTP" → `POST /auth/login/otp/request`
- Step 2: OTP code input (max 6 chars) → "Verify" → `POST /auth/login/otp/confirm`
- Resend OTP button
- On success: setAuth + navigate to role dashboard

### ForgotPasswordScreen (`screens/auth/forgot_password_screen.dart`)
- Phase 1: Phone field → "Send OTP"
- Phase 2: OTP code, new password (8+ chars, uppercase + digit), confirm password
- Resend OTP
- On success: navigate to `/login`

---

## CLIENT Screens

### ClientDashboardScreen (`screens/client/client_dashboard_screen.dart`)
- Welcome gradient card with user name
- Quick actions: New Parcel, Track, Pickups
- Recent parcels section (top 5, "See All" link)
- Pull-to-refresh
- Bottom nav: Home | Parcels | Track | Support | Profile

### ParcelListScreen (`screens/client/parcel_list_screen.dart`)
- Infinite scroll pagination (loads more 200px before end)
- ParcelCard: tracking ref, status badge, sender→recipient cities, date
- Tap → `/client/parcels/{id}`
- FAB → Create parcel
- Pull-to-refresh, empty state

### ParcelDetailScreen (`screens/client/parcel_detail_screen.dart`)
- Status header + tracking reference
- Route: From city → To city + agency names
- Details: weight, dimensions, declared value, service type, fragile, description, price, created date
- QR section (if `qrStatus` set): shows QR status + lock state
- Pull-to-refresh

### CreateParcelScreen (`screens/client/create_parcel_screen.dart`)
- **Fields:** Weight (kg, required), Dimensions, Declared Value (XAF), Description, Service Type dropdown (STANDARD/EXPRESS/ECONOMY), Delivery Option dropdown (AGENCY_PICKUP/HOME_DELIVERY), Payment Option (PREPAID/CASH_ON_DELIVERY/MOBILE_MONEY), Origin Agency dropdown, Destination Agency dropdown, Sender Address dropdown, Recipient Address dropdown, Fragile toggle
- **On submit:** Requests GPS permission → gets position → `POST /parcels` with coords
- Loads addresses via `AddressService`, agencies via `UserManagementService`
- Success snackbar → pop back

### TrackParcelScreen (`screens/client/track_parcel_screen.dart`)
- Tracking number text field
- Search → `parcelProvider.trackParcel(trackingRef)` → `GET /parcels/tracking/{ref}`
- Result: tracking ref, status badge, route, weight, service type, created date, "View Details" button
- Empty state with hint

---

## COURIER Screens

### CourierDashboardScreen (`screens/courier/courier_dashboard_screen.dart`)
- Welcome + user name
- 4 stat cards: Assigned Pickups, Deliveries Today, Completed, Pending
- Action tiles: Scan QR, My Deliveries, Pickups, Route Map (placeholder)
- Pull-to-refresh, bottom nav

### DeliveryScreen (`screens/courier/delivery_screen.dart`)
- Filters: status `OUT_FOR_DELIVERY` or `ARRIVED_DEST_AGENCY`
- **Start Delivery** (if ARRIVED_DEST_AGENCY): `POST /delivery/start {parcelId}`
- **Confirm Delivery** (if OUT_FOR_DELIVERY): navigate to DeliveryConfirmationScreen
- Pull-to-refresh, empty state

### DeliveryConfirmationScreen (`screens/courier/delivery_confirmation_screen.dart`)
- Receives `Parcel` object as route parameter
- Step 1: Recipient phone number input
- Step 2: "Send OTP" → gets GPS → `POST /delivery/otp/send {parcelId, phone, GPS}`
- Step 3: OTP code input → "Confirm" → `POST /delivery/otp/verify {parcelId, otp, GPS}`
- Success: green snackbar "Delivery confirmed" → pop with `true`
- GPS acquired before each step (with permission request)

### QrScanScreen (`screens/courier/qr_scan_screen.dart`)
- `MobileScanner` camera overlay with 250×250 QR frame
- Torch toggle + flip camera in AppBar
- On QR detect: pause → `QrService().verifyQr(code)` → `GET /qr/verify/{qrData}`
- Success: shows "QR Verified: {parcelId}"
- "Scan Another" resets scanner
- Error view with "Try Again"

### PickupAssignmentsScreen (`screens/courier/pickup_assignments_screen.dart`)
- Loads `pickupService.getMyPickups()` → `GET /pickups/me`
- PickupCard: ID, state badge, address, date, time window
- **Confirm Pickup** (if ASSIGNED/PENDING) → `POST /pickups/confirm {pickupId}`
- Pull-to-refresh, empty state, error retry

---

## AGENT Screens

### AgentDashboardScreen (`screens/agent/agent_dashboard_screen.dart`)
- Welcome + agency name (if set)
- 4 stat cards: Parcels Today, Scanned, Pending Validation, Pickups Today
- Action tiles: Scan Parcel, Receive Parcel, Validate Parcels, All Parcels, Assign Courier
- Bottom nav: Home | Scan | Parcels | Validate

### ParcelValidationScreen (`screens/agent/parcel_validation_screen.dart`)
- Loads parcels with status `CREATED`
- ValidationCard per parcel: tracking ref, client name, weight, declared value, service type
- **Accept**: `PATCH /parcels/{id}/status {status: "ACCEPTED"}`
- **Validate & Lock**: `POST /parcels/{id}/validate-and-lock`
- Pull-to-refresh, empty state, error retry

### ScanIntakeScreen (`screens/agent/scan_intake_screen.dart`)
- Top: `MobileScanner` with 220×220 QR overlay, torch/flip controls
- Error display area
- Counter bar: "Scanned: N" with Clear button
- Bottom: scrollable list of scanned items
- **On each scan:**
  1. Acquire GPS (with permission fallback)
  2. `QrService().verifyQr(code)` → get parcelId
  3. `ScanService().createScanEvent({parcelId, eventType: "INTAKE", GPS, locationSource})`
  4. Add to list, show success snackbar
  5. Resume scanning
- Continuous scanning (multiple parcels per session)

---

## STAFF Screens

### StaffDashboardScreen (`screens/staff/staff_dashboard_screen.dart`)
- 4 stat cards: Total Parcels, In Transit, Delivered, Pending Pickups
- Action tiles: All Parcels, Pickups, Track Parcel, Analytics, Congestion Alerts
- Logout button, bottom nav

### ParcelManagementScreen (`screens/staff/parcel_management_screen.dart`)
- Route exists in GoRouter but resolves to PlaceholderScreen in `main.dart`
- Not fully implemented

### AnalyticsScreen (`screens/staff/analytics_screen.dart`)
- Route exists but resolves to PlaceholderScreen in `main.dart`

---

## ADMIN Screens

### AdminDashboardScreen (`screens/admin/admin_dashboard_screen.dart`)
- 4 stat cards: Users, Agencies, Total Parcels, Revenue
- Action tiles: User Management, Tariffs, All Parcels, Analytics, Audit Logs, Risk Alerts
- Logout button, bottom nav

### UserManagementScreen / TariffManagementScreen
- Routes exist, resolve to PlaceholderScreen

---

## FINANCE Screens

### FinanceDashboardScreen (`screens/finance/finance_dashboard_screen.dart`)
- Large revenue card (blue gradient) with total XAF, "Period: This Month"
- 4 stat cards: Payments, Pending, Refunds, Invoices
- Action tiles: Payments, Refunds, Invoices, Analytics
- Logout button, bottom nav

### PaymentsScreen
- Route exists, resolves to PlaceholderScreen

---

## RISK Screens

### RiskDashboardScreen (`screens/risk/risk_dashboard_screen.dart`)
- 4 stat cards: Active Alerts, High Risk, Compliance Score (%), Fraud Attempts
- Action tiles: Compliance Alerts, Risk Alerts, Audit Logs
- Recent Alerts section (top 5): message, created date, severity chip
  - Icons: ERROR (red), WARNING (orange), INFO (blue)
- Loads alerts via `ComplianceService().getRiskAlerts()`
- Logout button, bottom nav

### ComplianceAlertsScreen
- Route exists, resolves to PlaceholderScreen

---

## Shared Screens

### ProfileScreen (`screens/shared/profile_screen.dart`)
- Avatar with user initials (first letter of name)
- User name + role badge
- Info card: Email, Phone, Agency, Language, Member Since
- Settings: Language toggle (EN/FR), Notifications link, Support link
- Logout with confirmation dialog

### NotificationsScreen (`screens/shared/notifications_screen.dart`)
- Loads `NotificationService().getNotifications()` → `GET /notifications`
- "Mark All Read" button (if any unread)
- Per notification: icon (type-based), title, message, timestamp, unread dot
- Tap/swipe to mark read → `PUT /notifications/{id}/read` (stub)
- Empty state, pull-to-refresh

### PlaceholderScreen (`screens/shared/placeholder_screen.dart`)
- Icon + "Coming Soon" + "This feature is under development"
- Used for: most admin/staff/finance/risk sub-screens, analytics, support, maps, audit logs

---

## Screens Using GPS

| Screen | GPS Usage |
|---|---|
| CreateParcelScreen | `creationLatitude`, `creationLongitude` at parcel creation |
| ScanIntakeScreen | Sends GPS with every scan event |
| DeliveryConfirmationScreen | Sends GPS with OTP send and verify calls |
| QrScanScreen | Does not send GPS explicitly (QR verify only) |
