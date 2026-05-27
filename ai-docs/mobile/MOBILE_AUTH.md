# Mobile Authentication

Auth stack
- `AuthProvider` (provider) manages authentication state and exposes `login`, `register`, `requestOtp`, `confirmOtp`, `loginWithGoogle`, `logout`, and convenience getters (`isAuthenticated`, `userRole`). See: [smartcampost_mobile/lib/providers/auth_provider.dart](smartcampost_mobile/lib/providers/auth_provider.dart#L1-L40)
- `AuthService` performs network calls and persists tokens/user via `AuthStorage`. See: [smartcampost_mobile/lib/services/auth_service.dart](smartcampost_mobile/lib/services/auth_service.dart#L1-L60)
- `AuthStorage` uses `flutter_secure_storage` to store `accessToken` and `user` safely. See: [smartcampost_mobile/lib/services/auth_storage.dart](smartcampost_mobile/lib/services/auth_storage.dart#L1-L40)

Flows
- Password login: `AuthProvider.login()` → `AuthService.login()` → store token + user → provider notifies UI.
- OTP login: `AuthProvider.requestOtp()` then `AuthProvider.confirmOtp()` calls `AuthService.confirmOtp()` and persists token.
- Google Sign-In: `AuthService.loginWithGoogle()` uses `google_sign_in` plugin and sends `idToken` to backend `/auth/google`. Note: default `GOOGLE_CLIENT_ID` is embedded as fallback in `AuthService` — confirm production client ID is provided at build time.

Routing & protection
- `GoRouter` `redirect` in `main.dart` forces unauthenticated users to `/login` and redirects authenticated users on auth-pages to role dashboards. See: [smartcampost_mobile/lib/main.dart](smartcampost_mobile/lib/main.dart#L20-L60)

Token handling
- Secure: tokens are stored in `flutter_secure_storage` via `AuthStorage` and read by `ApiClient` interceptor to set `Authorization` header. See: [smartcampost_mobile/lib/core/api_client.dart](smartcampost_mobile/lib/core/api_client.dart#L1-L40)

Recommendations
- Verify `GOOGLE_CLIENT_ID` at CI/build time and remove the embedded default client ID for production builds.
- Consider token refresh flow if backend supports refresh tokens; currently `AuthStorage` stores only access token and there's no refresh mechanism.
