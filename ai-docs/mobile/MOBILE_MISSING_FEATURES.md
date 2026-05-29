# SmartCAMPOST — Mobile Missing Features

## Fully Missing

### 1. Offline Mode / Local Database
The backend has full offline sync support (`ScanEvent.synced`, `POST /offline/sync`), but the mobile app has no local database. Agents and couriers in areas with poor coverage cannot work offline.

**Required:**
- Hive or Drift local database
- Event queue for scan events and delivery actions
- Background sync service (using `workmanager` package)
- Conflict resolution strategy
- Offline indicator in UI

---

### 2. Push Notifications (FCM)
No Firebase Cloud Messaging integration. Notifications are pull-only (manual refresh).

**Required:**
- `firebase_messaging` package integration
- `AndroidManifest.xml` + iOS `Info.plist` FCM config
- Foreground notification handler (show snackbar/banner)
- Background notification → deep-link to relevant screen
- Notification permission request flow

---

### 3. Delivery Photo Proof
`image_picker` is imported but never used. The backend supports `DeliveryProof` with `proofType: PHOTO`.

**Required:**
- Camera capture button in `DeliveryConfirmationScreen`
- Upload photo to storage → get URL
- Send `POST /delivery/proof { parcelId, proofType: "PHOTO", proofUrl, GPS }`

---

### 4. Map / Route View
`flutter_map` and `latlong2` packages are imported but no map screen exists.

**Required:**
- `CourierNavigationMap` for delivery route optimization
- `TrackingMap` showing parcel's GPS history (ScanEvents)
- `PickupMap` for pickup location visualization

---

### 5. Full Payment Flow
`PaymentService` exists but `PaymentsScreen` is a `PlaceholderScreen`.

**Required:**
- Client payment screen: see pending amount, pay via mobile money
- MTN MoMo integration (equivalent to web `MoMoPaymentPage`)
- Payment status polling
- Invoice display after successful payment

---

### 6. Parcel Detail: Scan History Timeline
`ParcelDetailScreen` shows basic parcel info but no timeline of scan events.

**Required:**
- Timeline widget showing each `ScanEvent` in chronological order
- Event type icons, location notes, timestamps
- GPS location on mini-map (optional)

---

### 7. Refunds (Client)
No refund request flow in the mobile app.

**Required:**
- "Request Refund" button on paid parcel detail
- Reason input + submit
- Refund status tracking

---

### 8. Support Ticket Chat
`SupportService` exists, `SupportTicket` model exists, but only `PlaceholderScreen` for support.

**Required:**
- Create ticket form (subject, description, category)
- Ticket list with status
- In-ticket conversation thread (messages)

---

### 9. Analytics / Reporting
All analytics screens resolve to `PlaceholderScreen`.

**Required:**
- Staff/Admin: parcel volume chart (FL Chart — already in pubspec)
- Finance: revenue trend
- Risk: alert breakdown

---

### 10. Geocoding / Reverse Geocoding
`geocoding: ^3.0.0` is imported but never used.

**Required:**
- Convert GPS coordinates to human-readable address in scan events
- Auto-fill address field when creating parcels from GPS location
- Show location name in scan history (instead of raw lat/lng)

---

## Placeholder Screens by Role

| Route | Role | Screen | Status |
|---|---|---|---|
| `/admin/users` | ADMIN | UserManagementScreen | Placeholder |
| `/admin/tariffs` | ADMIN | TariffManagementScreen | Placeholder |
| `/staff/parcels` | STAFF | ParcelManagementScreen | Placeholder |
| `/staff/analytics` | STAFF | AnalyticsScreen | Placeholder |
| `/courier/map` | COURIER | Route map | Placeholder |
| `/finance/payments` | FINANCE | PaymentsScreen | Placeholder |
| `/finance/refunds` | FINANCE | Refunds | Placeholder |
| `/finance/invoices` | FINANCE | Invoices | Placeholder |
| `/risk/compliance` | RISK | ComplianceAlertsScreen | Placeholder |
| `/[role]/support` | ALL | Support chat | Placeholder |
| `/[role]/audit` | ADMIN/RISK | Audit logs | Placeholder |
| `/[role]/analytics` | STAFF/ADMIN/FINANCE/RISK | Analytics | Placeholder |

---

## Packages Imported but Unused

| Package | Version | Intended Use | Status |
|---|---|---|---|
| `image_picker` | ^1.1.2 | Delivery photo proof | Unused |
| `flutter_map` | ^7.0.2 | Maps / tracking / routing | Unused |
| `latlong2` | ^0.9.1 | Map coordinates | Unused |
| `geocoding` | ^3.0.0 | Reverse geocoding | Unused |
| `connectivity_plus` | ^6.1.1 | Offline indicator | Unused |

---

## UX Gaps

| Issue | Impact |
|---|---|
| No loading state during login | Button not disabled during API call |
| No retry button on failed parcel list load | User stuck with error, must force-close |
| No parcel search/filter on list screens | Finding a specific parcel requires scrolling |
| No date picker for pickup requests | No pickup creation UI at all |
| Some hardcoded English validation strings | French users see English error messages |
| No dark mode support | System dark mode ignored |
| No haptic feedback on QR scan success | Less intuitive for high-volume scanning |
