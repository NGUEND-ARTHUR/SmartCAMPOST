# Mobile Security & Operational Risks

1) Google Sign-In client id
- `AuthService` embeds a default `GOOGLE_CLIENT_ID` fallback. Ensure production `GOOGLE_CLIENT_ID` is provided at build time. See: [smartcampost_mobile/lib/services/auth_service.dart](smartcampost_mobile/lib/services/auth_service.dart#L1-L40)

2) Token lifecycle
- No refresh token flow is implemented. Access tokens stored in `flutter_secure_storage` may expire; implement refresh tokens or re-auth flow to avoid silent failures.

3) Network environment
- `ApiClient` selects base URL by platform and build mode; ensure `AppConstants` values are correct for emulator/device (iOS local vs Android). See: [smartcampost_mobile/lib/core/api_client.dart](smartcampost_mobile/lib/core/api_client.dart#L1-L40)

4) Camera & permissions
- QR/scan screens use device camera; runtime permission handling must be validated on Android/iOS and tested for denial flows (graceful fallback). See `qr_scan_screen.dart` and `scan_intake_screen.dart`.

5) Offline resiliency
- There is no global offline queue pictured; network failures may surface to users. Consider local queuing with retries and idempotency for critical writes (parcel creation, delivery confirmation).

6) Sensitive storage
- `flutter_secure_storage` is used (good). Confirm Android keystore/iOS keychain configuration for release builds.
