# SmartCAMPOST — Mobile Workflows

## 1. Login (Phone + Password)

```
LoginScreen
1. Enter phone + password → validate (regex, min 8)
2. "Login" → authProvider.login(phone, password)
      → authService.login()
      → POST /auth/login { phone, password }
3. On success: save token + user → GoRouter redirects to /[role]
4. On error: display translated error message
```

---

## 2. Login (Google OAuth)

```
LoginScreen → "Sign in with Google"
1. GoogleSignIn.signIn() → shows Google account picker
2. Get account.authentication.idToken
3. authProvider.loginWithGoogle(idToken)
      → POST /auth/google { idToken }
4. Save token + user → GoRouter redirects to /[role]
```

---

## 3. Client: Create Parcel

```
/client → ClientDashboardScreen → "New Parcel"
     → /client/parcels/create → CreateParcelScreen

1. Fill form:
   - Weight, Dimensions, Declared Value, Description
   - Service Type, Delivery Option, Payment Option
   - Select Origin + Destination Agency (loads from /agencies)
   - Select Sender + Recipient Address (loads from /addresses/me)
   - Toggle Fragile

2. Submit:
   a. Request GPS location (LocationPermission)
   b. await Geolocator.getCurrentPosition()
   c. parcelProvider.createParcel({
        weight, dimensions, declaredValue, fragile,
        serviceType, deliveryOption, paymentOption,
        senderAddressId, recipientAddressId,
        originAgencyId, destinationAgencyId,
        creationLatitude, creationLongitude
      })
   d. → POST /parcels
   e. Show success snackbar → pop back to parcel list
```

---

## 4. Client: Track Parcel

```
/client/track → TrackParcelScreen

1. Enter tracking number → "Search"
2. parcelProvider.trackParcel(trackingRef)
      → GET /parcels/tracking/{ref}
3. Show: status badge, route (from/to), agencies, weight, service type, created date
4. "View Details" → /client/parcels/{id} → ParcelDetailScreen
```

---

## 5. Agent: Scan Intake

```
/agent/scan → ScanIntakeScreen

1. Camera opens with QR overlay
2. User points at parcel's QR code
3. QR detected:
   a. Pause scanner
   b. Get GPS location (request permission if needed)
   c. QrService().verifyQr(qrCode) → GET /qr/verify/{qrData}
   d. Extract parcelId from response
   e. ScanService().createScanEvent({
        parcelId: parcelId,
        eventType: 'INTAKE',
        latitude: lat,
        longitude: lng,
        locationSource: 'GPS' (or 'MANUAL' if GPS fails)
      })
      → POST /scan-events
   f. Add to scanned items list, show success snackbar
   g. Resume scanning
4. Repeat for each parcel in session
5. "Clear" button resets counter + list
```

---

## 6. Agent: Validate & Lock Parcel

```
/agent/validate → ParcelValidationScreen

1. Screen loads parcels with status CREATED
      → GET /parcels?status=CREATED (or similar)

2. Agent reviews ValidationCard (tracking ref, weight, declared value)

3a. "Accept":
    → PATCH /parcels/{id}/status { status: "ACCEPTED" }
    → Reload list

3b. "Validate & Lock":
    → POST /parcels/{id}/validate-and-lock
    → Backend: locks parcel, generates finalQrCode
    → Reload list
```

---

## 7. Courier: Home Delivery

```
/courier/deliveries → DeliveryScreen

1. Screen shows parcels: status OUT_FOR_DELIVERY or ARRIVED_DEST_AGENCY

2a. If ARRIVED_DEST_AGENCY → "Start Delivery":
    → POST /delivery/start { parcelId }
    → Status becomes OUT_FOR_DELIVERY

2b. If OUT_FOR_DELIVERY → "Confirm Delivery":
    → Navigate to /courier/delivery-confirm (passes Parcel object)

3. DeliveryConfirmationScreen:
   Step A: Enter recipient phone number
   Step B: "Send OTP":
     a. Get GPS → Geolocator.getCurrentPosition()
     b. deliveryService.sendDeliveryOtp({ parcelId, phoneNumber, lat, lng })
          → POST /delivery/otp/send
     c. SMS sent to recipient phone
   
   Step C: Recipient tells courier 6-digit OTP
   Step D: Enter OTP → "Confirm":
     a. Get GPS again
     b. deliveryService.verifyDeliveryOtp({ parcelId, otpCode, lat, lng })
          → POST /delivery/otp/verify
   
   Step E: Success → green snackbar "Delivery confirmed"
     → pop(true) → DeliveryScreen marks parcel as completed locally
```

---

## 8. Courier: QR Scan

```
/courier/scan → QrScanScreen

1. Camera opens with 250×250 QR overlay
2. QR detected:
   a. Pause scanner
   b. QrService().verifyQr(qrCode) → GET /qr/verify/{qrData}
   c. Show success: "QR Verified: {parcelId}"
3. "Scan Another" → resume scanner
4. On error: show red error card → "Try Again"
```

---

## 9. Courier: Pickup Assignment

```
/courier/pickups → PickupAssignmentsScreen

1. Loads assigned pickups → GET /pickups/me
2. Shows PickupCard: state, address, date, time window

3. "Confirm Pickup" (state = ASSIGNED or PENDING):
   → pickupService.confirmPickup(pickupId)
      → POST /pickups/confirm { pickupId }
   → State becomes COMPLETED
   → Backend creates ScanEvent at origin
   → Reload list
```

---

## 10. Profile & Language Switch

```
/profile → ProfileScreen

1. Shows user info (name, role, email, phone, agency, language, joined date)
2. Language toggle (EN ↔ FR):
   → localeProvider.toggleLocale()
   → Saves to SharedPreferences
   → App rebuilds with new locale
3. Logout → confirmation dialog → authProvider.logout()
   → Clears secure storage → GoRouter redirects to /login
```

---

## 11. Offline Sync (Partial)

**Current state:** The model supports it, the endpoint exists, but no automatic queue in the app.

```
When online: All scan events go directly to POST /scan-events

When offline (theoretically):
  - Events would be stored locally (NOT YET IMPLEMENTED — no local DB)
  - On reconnect: POST /offline/sync with [events array]
    (ScanService.syncOfflineEvents() exists but not called by any screen)
```

---

## 12. Notifications (Pull-Based)

```
/notifications → NotificationsScreen

1. Loads notifications → GET /notifications
2. Shows list: icon, title, message, timestamp
3. Tap or swipe → mark read (stub — PUT /notifications/{id}/read)
4. "Mark All Read" → stub call
5. Pull-to-refresh
```

Note: No push notifications (FCM) — notifications are only visible when user opens the screen.
