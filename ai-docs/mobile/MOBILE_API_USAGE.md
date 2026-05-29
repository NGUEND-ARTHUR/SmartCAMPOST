# SmartCAMPOST — Mobile API Usage

## HTTP Client Configuration

**Singleton:** `ApiClient()` factory returns one Dio instance.

```dart
BaseOptions(
  baseUrl: ApiClient.baseUrl,  // Environment-based
  connectTimeout: Duration(seconds: 30),
  receiveTimeout: Duration(seconds: 30),
  headers: {'Content-Type': 'application/json'},
)
```

**Base URLs:**
| Environment | URL |
|---|---|
| Release | `https://smartcampost-backend.onrender.com/api` |
| Android emulator (debug) | `http://10.0.2.2:8082/api` |
| iOS simulator (debug) | `http://localhost:8082/api` |

**Interceptors:**
1. **Request:** Adds `Authorization: Bearer {token}` from FlutterSecureStorage
2. **Error (401):** Clears secure storage (no automatic navigation)
3. **Debug Logger:** Logs full request/response body in debug mode

---

## HTTP Helper Methods (`ApiClient`)

```dart
Future<T> get<T>(String path, {Map<String, dynamic>? queryParams, T Function(dynamic)? fromJson})
Future<T> post<T>(String path, {dynamic data, T Function(dynamic)? fromJson})
Future<T> put<T>(String path, {dynamic data, T Function(dynamic)? fromJson})
Future<T> patch<T>(String path, {dynamic data, T Function(dynamic)? fromJson})
Future<void> delete(String path)
```

---

## Auth Service (`services/auth_service.dart`)

| Method | Endpoint | Body |
|---|---|---|
| `login(phone, password)` | `POST /auth/login` | `{phone, password}` |
| `register(RegisterRequest)` | `POST /auth/register` | `{fullName, phone, email?, password, preferredLanguage?}` |
| `requestOtp(phone)` | `POST /auth/login/otp/request` | `{phone}` |
| `confirmOtp(phone, otp)` | `POST /auth/login/otp/confirm` | `{phone, otp}` |
| `loginWithGoogle(idToken)` | `POST /auth/google` | `{idToken}` |
| `requestPasswordReset(phone)` | `POST /auth/password/reset/request` | `{phone}` |
| `confirmPasswordReset(phone, otp, newPassword)` | `POST /auth/password/reset/confirm` | `{phone, otp, newPassword}` |

---

## Parcel Service (`services/parcel_service.dart`)

| Method | Endpoint | Notes |
|---|---|---|
| `getMyParcels(page, size)` | `GET /parcels/me?page=&size=` | Client's own parcels |
| `getAllParcels(page, size)` | `GET /parcels?page=&size=` | Admin/staff all parcels |
| `getParcelById(id)` | `GET /parcels/{id}` | — |
| `trackParcel(trackingRef)` | `GET /parcels/tracking/{ref}` | Public |
| `createParcel(request)` | `POST /parcels` | Includes GPS coords |
| `updateParcelStatus(id, status, GPS?)` | `PATCH /parcels/{id}/status` | — |
| `validateAndLock(id, ...)` | `POST /parcels/{id}/validate-and-lock` | Agent only |

---

## Delivery Service (`services/delivery_service.dart`)

| Method | Endpoint | Notes |
|---|---|---|
| `startDelivery(parcelId)` | `POST /delivery/start` | `{parcelId}` |
| `sendDeliveryOtp(parcelId, phone, GPS)` | `POST /delivery/otp/send` | `{parcelId, phoneNumber, lat, lng}` |
| `verifyDeliveryOtp(parcelId, otp, GPS)` | `POST /delivery/otp/verify` | `{parcelId, otpCode, lat, lng}` |
| `completeDelivery(...)` | `POST /delivery/complete` | — |
| `getDeliveryStatus(parcelId)` | `GET /delivery/{parcelId}/status` | — |
| `markDeliveryFailed(parcelId, reason, GPS)` | `POST /delivery/{parcelId}/failed` | `{reason, lat, lng, notes?}` |

---

## Pickup Service (`services/pickup_service.dart`)

| Method | Endpoint | Notes |
|---|---|---|
| `getMyPickups(page, size)` | `GET /pickups/me?page=&size=` | Courier's pickups |
| `getAllPickups(page, size)` | `GET /pickups?page=&size=` | All pickups |
| `getPickupById(id)` | `GET /pickups/{id}` | — |
| `createPickup(request)` | `POST /pickups` | `{parcelId, address, date, timeWindow, courierId?, comment?}` |
| `assignCourier(pickupId, courierId)` | `POST /pickups/{id}/assign-courier` | `{courierId}` |
| `confirmPickup(pickupId)` | `POST /pickups/confirm` | `{pickupId}` |

---

## Scan / QR Services (`services/services.dart`)

| Method | Endpoint | Notes |
|---|---|---|
| `ScanService.createScanEvent(event)` | `POST /scan-events` | GPS required |
| `ScanService.getParcelEvents(parcelId)` | `GET /scan-events/parcel/{parcelId}` | — |
| `ScanService.syncOfflineEvents(events)` | `POST /offline/sync` | Batch sync |
| `QrService.verifyQr(qrData)` | `GET /qr/verify/{qrData}` | Returns `{parcelId}` |
| `QrService.getSecureQr(parcelId)` | `POST /qr/secure/{parcelId}` | — |
| `QrService.revokeQr(token)` | `DELETE /qr/revoke/{token}` | — |

---

## Notification Service (`services/services.dart`)

| Method | Endpoint | Notes |
|---|---|---|
| `getNotifications()` | `GET /notifications` | — |
| `markAsRead(id)` | `PUT /notifications/{id}/read` | Stub — may not work |
| `markAllRead()` | `PUT /notifications/read-all` | Stub |
| `getUnreadCount()` | `GET /notifications/me/unread-count` | → `int` |

---

## Address Service (`services/services.dart`)

| Method | Endpoint |
|---|---|
| `getMyAddresses()` | `GET /addresses/me` |
| `createAddress(address)` | `POST /addresses` |
| `updateAddress(id, address)` | `PUT /addresses/{id}` |
| `deleteAddress(id)` | `DELETE /addresses/{id}` |

---

## Payment Service (`services/payment_service.dart`)

| Method | Endpoint |
|---|---|
| `initPayment(request)` | `POST /payments/init` |
| `confirmPayment(request)` | `POST /payments/confirm` |
| `getPayment(id)` | `GET /payments/{id}` |
| `getParcelPayments(parcelId)` | `GET /payments/parcel/{parcelId}` |

---

## Dashboard Service (`services/services.dart`)

| Method | Endpoint | Returns |
|---|---|---|
| `getDashboardSummary()` | `GET /dashboard/summary` | Metrics for role-specific dashboard |

Summary fields used:
```dart
totalParcels, totalUsers, totalAgencies, totalRevenue,
assignedPickups, deliveriesToday, completedDeliveries, pendingDeliveries,
pendingValidations, parcelsToday, scannedToday, pickupsToday,
activeAlerts, highRiskCount, complianceScore, fraudAttempts,
totalRevenue, totalPayments, pendingPayments, totalRefunds, totalInvoices
```

---

## Compliance & AI Services (`services/services.dart`)

| Method | Endpoint |
|---|---|
| `ComplianceService.getRiskAlerts()` | `GET /risk/alerts` |
| `ComplianceService.getCompliance()` | `GET /compliance/alerts` |
| `AiService.chat(message)` | `POST /ai/chat { message }` |
| `AiService.getSentimentAnalysis()` | `GET /analytics/sentiment` |
| `AiService.getSmartNotifications()` | `GET /analytics/smart-notifications` |

---

## User Management Service (`services/services.dart`)

| Method | Endpoint |
|---|---|
| `getAgencies()` | `GET /agencies` |
| `getAgents()` | `GET /agents` |
| `getCouriers()` | `GET /couriers` |
| `getClients()` | `GET /clients` |
| `getStaff()` | `GET /staff` |

---

## Support & Tariff Services

| Method | Endpoint |
|---|---|
| `SupportService.getMyTickets()` | `GET /support/tickets/me` |
| `SupportService.createTicket(data)` | `POST /support/tickets` |
| `SupportService.getTicket(id)` | `GET /support/tickets/{id}` |
| `TariffService.getTariffs()` | `GET /tariffs` |
| `TariffService.getQuote(weight, dims)` | `POST /tariffs/quote` |

---

## Known API Gaps (Mobile)

| Feature | Issue |
|---|---|
| Notification mark-read | `PUT /notifications/{id}/read` stub — endpoint may not exist on backend |
| Offline sync | `POST /offline/sync` exists but never called from any screen |
| Delivery proof upload | No photo upload in DeliveryConfirmationScreen (mobile only does OTP) |
| Payment UI | PaymentService exists but no payment screen implemented |
| Analytics | DashboardService.getSentimentAnalysis() exists but unused in UI |
| Image picker | `image_picker` package in pubspec.yaml but not used in any screen |
| Push notifications | FCM not integrated; notifications are pull-only |
| Maps/routing | `flutter_map` in pubspec.yaml but no map screen implemented |
