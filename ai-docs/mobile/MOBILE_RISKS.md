# SmartCAMPOST — Mobile Risks & Issues

## Critical

### MOB-RISK-001 — No Offline Database
**Severity:** Critical  
**Issue:** The app has no local database (SQLite, Hive, Drift). All operations require network connectivity. The `synced` flag on `ScanEvent` and the `POST /offline/sync` endpoint exist on the backend, but the mobile app never queues events locally.  
**Impact for Agents/Couriers:** A single network interruption during scan intake or delivery confirmation causes data loss. Couriers in low-coverage areas cannot function.  
**Fix:** Integrate Hive or Drift for local event storage. Use a background sync worker to flush queued events when connectivity is restored. Leverage `connectivity_plus` (already in pubspec) to trigger sync.

---

### MOB-RISK-002 — 401 Does Not Redirect to Login
**Severity:** Critical  
**Component:** `core/api_client.dart` — `onError` interceptor  
**Issue:** When Dio receives a 401, it calls `AuthStorage.clearAll()` but does not navigate to the login screen. The user remains on the broken screen.  
**Impact:** Expired sessions leave users stuck with empty data and no feedback.  
**Fix:**
```dart
onError: (error, handler) async {
  if (error.response?.statusCode == 401) {
    await AuthStorage.clearAll();
    router.go('/login');  // Force navigation
  }
  handler.next(error);
}
```

---

### MOB-RISK-003 — No Token Expiry Check on App Start
**Severity:** High  
**Component:** `providers/auth_provider.dart` — `checkAuth()`  
**Issue:** `checkAuth()` reads the token from secure storage and sets `_isAuthenticated = true` without decoding the JWT to check the `exp` claim.  
**Impact:** User launches app with expired 8h token, is routed to their dashboard, all API calls immediately fail with 401.  
**Fix:** Decode JWT (using `dart_jsonwebtoken` or manual base64 decode), check `exp < DateTime.now()`, and call `logout()` if expired.

---

## High

### MOB-RISK-004 — GPS Permission Not Gracefully Handled on iOS
**Severity:** High  
**Issue:** iOS requires `NSLocationWhenInUseUsageDescription` in `Info.plist`. If missing, the app crashes when requesting location permission. Android manifest has the permissions, iOS Info.plist not shown in explored files.  
**Impact:** iOS builds crash when agents/couriers try to scan or confirm delivery.  
**Fix:** Verify `Info.plist` has `NSLocationWhenInUseUsageDescription` and `NSCameraUsageDescription`. Handle `LocationPermission.deniedForever` gracefully (open app settings).

---

### MOB-RISK-005 — No Push Notifications (FCM)
**Severity:** High  
**Issue:** No Firebase Cloud Messaging integration. Notifications are pull-based (user must open the Notifications screen).  
**Impact:** Couriers miss assignment notifications. Clients don't know their parcel was delivered without opening the app.  
**Fix:** Integrate `firebase_messaging` package. Handle foreground and background notifications. Add deep-link navigation from notification to relevant parcel/delivery screen.

---

### MOB-RISK-006 — Google OAuth Client ID Hardcoded
**Severity:** Medium  
**Component:** `screens/auth/login_screen.dart`  
**Issue:** `428837425425-hvbdljimv02i2kapehk51haap4160v68.apps.googleusercontent.com` is hardcoded as default in `String.fromEnvironment()` fallback.  
**Impact:** In production builds without `--dart-define=GOOGLE_CLIENT_ID`, the development client ID is used. Google auth may fail or log in to wrong project.  
**Fix:** Remove hardcoded default. Document `--dart-define=GOOGLE_CLIENT_ID=...` as required build parameter.

---

### MOB-RISK-007 — DeliveryConfirmation: GPS Failure Not Handled
**Severity:** Medium  
**Component:** `screens/courier/delivery_confirmation_screen.dart`  
**Issue:** GPS acquisition can fail (denied permission, timeout, device off). If GPS fails, the screen shows an error but the delivery OTP cannot be sent.  
**Impact:** Courier cannot complete delivery if GPS is unavailable, even if recipient is present.  
**Fix:** Allow fallback to manual coordinates (default Yaoundé coords or last known position). Add clear UX indicating location mode being used.

---

### MOB-RISK-008 — No Confirmation Dialog on Critical Actions
**Severity:** Medium  
**Issue:** Actions like "Validate & Lock" parcel, "Confirm Delivery", and "Confirm Pickup" execute immediately on tap with no confirmation dialog.  
**Impact:** Accidental taps create irreversible state changes (locked parcels, false deliveries).  
**Fix:** Add confirmation dialogs for: validate-and-lock, complete delivery, confirm pickup.

---

## Medium

### MOB-RISK-009 — Paginated Data Not Refreshed After Mutation
**Severity:** Medium  
**Component:** `providers/parcel_provider.dart`  
**Issue:** After `updateParcelStatus()` or `validateAndLock()`, the provider calls `notifyListeners()` but the parcel list cache may still show the old status for items not at the top of the current page.  
**Impact:** Agent validates a parcel but the list still shows it as CREATED until manual refresh.  
**Fix:** After mutation, call `loadMyParcels(refresh: true)` or equivalent to reload from server.

---

### MOB-RISK-010 — Image Picker Imported But Unused
**Severity:** Low  
**Issue:** `image_picker: ^1.1.2` is in `pubspec.yaml` but no screen uses photo capture.  
**Impact:** Backend `DeliveryProof` supports `PHOTO` type. Couriers cannot capture delivery photo evidence via mobile.  
**Fix:** Integrate `image_picker` in `DeliveryConfirmationScreen` for optional photo proof capture, upload to storage, and send `proofUrl` in the proof API call.

---

### MOB-RISK-011 — PlaceholderScreen for Critical Role Features
**Severity:** Medium  
**Issue:** Several important screens for ADMIN, STAFF, FINANCE, RISK roles resolve to `PlaceholderScreen` ("Coming Soon").  
**Impact:** App is significantly less functional for internal staff roles.  

**Screens that are placeholder:**
- All analytics screens
- User management (admin)
- Tariff management
- Compliance alerts
- Payments (finance)
- Refunds (finance)
- Invoices (finance)
- Audit logs
- Support chat
- Route map (courier)

---

### MOB-RISK-012 — No Network Connectivity Indicator
**Severity:** Low  
**Issue:** `connectivity_plus` is imported but not used to show a banner/snackbar when offline.  
**Impact:** User gets cryptic timeout errors instead of a clear "No network connection" message.  
**Fix:** Add a connectivity listener that shows an offline banner and disables submit buttons when offline.

---

### MOB-RISK-013 — Maps Imported But Not Used
**Severity:** Low  
**Issue:** `flutter_map: ^7.0.2` and `latlong2` are in pubspec but no map screen is implemented.  
**Impact:** Courier route map, parcel tracking map, and pickup location map are all missing.

---

## Summary Table

| ID | Severity | Component | Issue |
|---|---|---|---|
| MOB-RISK-001 | Critical | No local DB | Offline data loss for agents/couriers |
| MOB-RISK-002 | Critical | api_client | 401 doesn't redirect to login |
| MOB-RISK-003 | High | auth_provider | No JWT expiry check on start |
| MOB-RISK-004 | High | iOS | GPS/Camera permissions missing in Info.plist |
| MOB-RISK-005 | High | Notifications | No FCM push notifications |
| MOB-RISK-006 | Medium | login_screen | Google client ID hardcoded |
| MOB-RISK-007 | Medium | delivery_confirmation | GPS failure blocks delivery |
| MOB-RISK-008 | Medium | Multiple screens | No confirmation on critical actions |
| MOB-RISK-009 | Medium | parcel_provider | Stale list after mutation |
| MOB-RISK-010 | Low | image_picker | Delivery photo proof not implemented |
| MOB-RISK-011 | Medium | Many screens | Critical role features are placeholders |
| MOB-RISK-012 | Low | connectivity_plus | No offline indicator UI |
| MOB-RISK-013 | Low | flutter_map | Maps not implemented |
