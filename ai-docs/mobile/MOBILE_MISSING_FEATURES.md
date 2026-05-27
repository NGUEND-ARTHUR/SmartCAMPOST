# Mobile Missing Features & Action Items

Immediate fixes & checks
- Provide production `GOOGLE_CLIENT_ID` at build time; remove or replace embedded fallback in `AuthService`. See: [smartcampost_mobile/lib/services/auth_service.dart](smartcampost_mobile/lib/services/auth_service.dart#L1-L40)
- Validate camera permission handling and denial UX in `qr_scan_screen.dart` and `scan_intake_screen.dart`.

Security & reliability improvements
- Add refresh token support and automatic token refresh in `ApiClient`.
- Implement offline queue and idempotency keys for operations like `createParcel` and delivery confirmations.

Developer ergonomics
- Generate API DTO models from OpenAPI or keep `models/*.dart` in sync with backend DTOs.
- Add integration tests for navigation and role-based redirects (simulate `AuthProvider` states).

Observability
- Add Sentry/Crashlytics integration for mobile crash reporting and network failure tracking.
