# SmartCAMPOST — Mobile Architecture (Flutter)

## Stack

| Property | Value |
|---|---|
| Framework | Flutter |
| Language | Dart SDK ^3.11.1 |
| App Version | 1.0.2+2 |
| State Management | Provider 6.1.2 (ChangeNotifier) |
| HTTP Client | Dio 5.7.0 |
| Navigation | GoRouter 14.6.2 |
| Token Storage | Flutter Secure Storage 9.2.3 |
| Preferences | Shared Preferences 2.3.3 |
| QR (generate) | QR Flutter 4.1.0 |
| QR (scan) | Mobile Scanner 6.0.2 |
| Location | Geolocator 13.0.2 + Geocoding 3.0.0 |
| Maps | Flutter Map 7.0.2 + Latlong2 0.9.1 |
| Google Auth | Google Sign-In 6.2.2 |
| Charts | FL Chart 0.69.2 |
| i18n | Intl 0.20.2 + custom JSON-based i18n (EN/FR) |
| Push Notifications | Not implemented |
| Offline Support | Partial (model has `synced` flag, no local DB) |

---

## Directory Structure

```
smartcampost_mobile/
├── lib/
│   ├── main.dart                    # App entry, GoRouter, MultiProvider
│   ├── core/
│   │   ├── api_client.dart          # Dio singleton, interceptors, base URL
│   │   ├── constants.dart           # API URLs, roles, parcel statuses, defaults
│   │   └── theme.dart               # Material design theme, status badge colors
│   ├── models/
│   │   ├── user.dart                # User, AuthResponse, RegisterRequest, LoginRequest
│   │   ├── parcel.dart              # Parcel, CreateParcelRequest
│   │   ├── scan_event.dart          # ScanEvent (with synced, offlineCreatedAt)
│   │   ├── address.dart             # Address
│   │   ├── payment.dart             # Payment, PaymentRequest
│   │   ├── common.dart              # PickupRequest, SupportTicket, AuditRecord,
│   │   │                            # CongestionAlert, AppNotification
│   │   ├── paginated_response.dart  # PaginatedResponse<T>
│   │   └── models.dart              # Barrel export
│   ├── providers/
│   │   ├── auth_provider.dart       # Auth state: user, token, isAuthenticated
│   │   ├── parcel_provider.dart     # Parcel list, pagination, detail, tracking
│   │   └── locale_provider.dart    # i18n language switching (EN/FR)
│   ├── services/
│   │   ├── auth_service.dart        # Auth endpoints (login, register, OTP, Google)
│   │   ├── auth_storage.dart        # Secure token/user persistence
│   │   ├── parcel_service.dart      # Parcel CRUD + validate-and-lock
│   │   ├── pickup_service.dart      # Pickup request endpoints
│   │   ├── delivery_service.dart    # Delivery OTP + complete + proof
│   │   ├── payment_service.dart     # Payment init + confirm
│   │   └── services.dart            # ScanService, QrService, NotificationService,
│   │                                # AddressService, SupportService, DashboardService,
│   │                                # TariffService, AiService, ComplianceService,
│   │                                # UserManagementService
│   ├── screens/
│   │   ├── auth/                    # Login, Register, OtpLogin, ForgotPassword
│   │   ├── client/                  # Dashboard, ParcelList, ParcelDetail, Create, Track
│   │   ├── courier/                 # Dashboard, Delivery, DeliveryConfirmation, QrScan, Pickups
│   │   ├── agent/                   # Dashboard, ParcelValidation, ScanIntake
│   │   ├── staff/                   # Dashboard, ParcelManagement, Analytics
│   │   ├── admin/                   # Dashboard, UserManagement, TariffManagement
│   │   ├── finance/                 # Dashboard, Payments
│   │   ├── risk/                    # Dashboard, ComplianceAlerts
│   │   └── shared/                  # Profile, Notifications, PlaceholderScreen
│   └── widgets/
│       └── common_widgets.dart      # StatusBadge, ParcelCard, LoadingIndicator,
│                                    # EmptyStateWidget, ErrorRetryWidget, InfoRow
├── android/
│   └── app/src/main/AndroidManifest.xml  # INTERNET, CAMERA, FINE/COARSE_LOCATION
├── ios/
│   └── Runner/
├── assets/
│   ├── i18n/
│   │   ├── en.json                  # 270+ English translation keys
│   │   └── fr.json                  # French translations
│   └── images/
└── pubspec.yaml
```

---

## Architecture Layers

```
GoRouter (navigation + auth guard)
  │
  ▼
Screens (UI widgets)
  │ context.watch<Provider>()
  ▼
Providers (ChangeNotifier — auth, parcel, locale)
  │ calls
  ▼
Services (typed API wrappers)
  │ uses
  ▼
ApiClient (Dio singleton with interceptors)
  │
  ▼
Backend API (https://smartcampost-backend.onrender.com/api)
```

---

## Provider Setup (main.dart)

```dart
MultiProvider(
  providers: [
    ChangeNotifierProvider.value(value: authProvider),   // Auth state
    ChangeNotifierProvider.value(value: localeProvider), // i18n
    ChangeNotifierProvider(create: (_) => ParcelProvider()), // Parcel data
  ],
  child: SmartCampostApp(router: router),
)
```

---

## API Client (`core/api_client.dart`)

```dart
// Base URL selection
static String get baseUrl {
  if (kReleaseMode) return 'https://smartcampost-backend.onrender.com/api';
  if (Platform.isAndroid) return 'http://10.0.2.2:8082/api'; // emulator
  return 'http://localhost:8082/api'; // iOS simulator
}

// Interceptors:
// 1. Request: adds Authorization: Bearer {token}
// 2. Response error (401): clears secure storage
// 3. Debug: LogInterceptor (request/response body) in debug mode
// Timeout: 30 seconds
```

---

## Default Location Constants (`core/constants.dart`)

```dart
static const double defaultLatitude = 3.8480;   // Yaoundé
static const double defaultLongitude = 11.5021; // Yaoundé
```

GPS fallback when device location is unavailable.

---

## Android Permissions

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

---

## i18n System

- Custom JSON-based i18n (NOT flutter_localizations)
- `LocaleProvider.tr(key)` translates a key
- Default language: **French (FR)**
- Language selection persisted via SharedPreferences
- Toggle available in ProfileScreen

---

## Key Architectural Decisions

1. **Provider over BLoC/Riverpod:** Simpler for team, but ChangeNotifier rebuild scope can be broad.
2. **GoRouter with auth redirect:** Navigation guards at router level, not per-screen.
3. **Singleton ApiClient:** One Dio instance with shared interceptors.
4. **Secure Storage for JWT:** Token encrypted at rest (not SharedPreferences).
5. **No local database:** No SQLite/Hive — all data requires network (offline gap).
6. **Service layer per domain:** Auth, Parcel, Delivery, Pickup, Payment each have dedicated service classes.
