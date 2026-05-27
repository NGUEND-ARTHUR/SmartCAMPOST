# Mobile API Usage

HTTP client
- Singleton `ApiClient` wraps `Dio` and sets `baseUrl` based on `kReleaseMode` and platform. It injects `Authorization` header from `AuthStorage` on every request. See: [smartcampost_mobile/lib/core/api_client.dart](smartcampost_mobile/lib/core/api_client.dart#L1-L40)

Domain services
- `lib/services/*.dart` provide domain methods:
  - `parcel_service.dart` — parcel CRUD and listing
  - `delivery_service.dart` — start/complete deliveries, update status
  - `pickup_service.dart` — request pickups, list assignments
  - `payment_service.dart` — MTN/Orange integration wrappers
  - `auth_service.dart` — auth endpoints (login, otp, google)
  - `services.dart` re-exports the services.

Error handling
- `ApiClient` interceptor clears storage on 401 responses. Services surface exceptions to providers which set `_error` messages.

Endpoints (examples)
- Auth: `POST /auth/login`, `POST /auth/login/otp/request`, `POST /auth/login/otp/confirm`, `POST /auth/google` — see `AuthService`.
- Parcels: `GET /parcels`, `POST /parcels`, `GET /parcels/:id` — see `ParcelService`.
- AI / Scan: scan endpoints are used by scan screens to send events; search for scan usage in `lib/screens/*/qr_scan_screen.dart` and `lib/services/*`.

Notes
- Logging: in debug mode `ApiClient` enables `LogInterceptor` for request/response bodies.
- Base URLs: `AppConstants` defines `prodBaseUrl`, `localBaseUrl`, `localIosBaseUrl` — confirm environment values when testing on device.
