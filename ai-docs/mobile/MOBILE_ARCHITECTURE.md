# Mobile Architecture — SmartCAMPOST (Flutter)

Summary
- Framework: Flutter (Dart) using `provider` for state management and `go_router` for navigation.
- HTTP client: `dio` wrapped by `lib/core/api_client.dart` with token injection from `AuthStorage` (secure storage).
- Secure storage: `flutter_secure_storage` used by `AuthStorage` to persist tokens and user info.
- App composition: `main.dart` initializes `LocaleProvider`, `AuthProvider`, and `ParcelProvider` then configures `GoRouter` for role-based dashboards.

Key files
- App entry & router: [smartcampost_mobile/lib/main.dart](smartcampost_mobile/lib/main.dart#L1-L40)
- API client: [smartcampost_mobile/lib/core/api_client.dart](smartcampost_mobile/lib/core/api_client.dart#L1-L40)
- Auth service & storage: [smartcampost_mobile/lib/services/auth_service.dart](smartcampost_mobile/lib/services/auth_service.dart#L1-L40) and [smartcampost_mobile/lib/services/auth_storage.dart](smartcampost_mobile/lib/services/auth_storage.dart#L1-L40)
- Providers (state): [smartcampost_mobile/lib/providers/auth_provider.dart](smartcampost_mobile/lib/providers/auth_provider.dart#L1-L40), [smartcampost_mobile/lib/providers/parcel_provider.dart](smartcampost_mobile/lib/providers/parcel_provider.dart#L1-L40)
- Domain services: `lib/services/*.dart` (parcel_service, delivery_service, pickup_service, payment_service).

Architecture notes
- Role-first routing: `_dashboardForRole()` in `main.dart` maps `UserRole` → route (client, courier, agent, staff, admin, finance, risk).
- Single ApiClient instance: `ApiClient` is a singleton that sets base URL based on build mode and platform and appends `Authorization` header via interceptor.
- Providers handle UI state and call services which call `ApiClient`.
