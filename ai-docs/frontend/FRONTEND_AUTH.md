# Frontend Authentication

State & store
  - `isAuthenticated`: boolean
  - `user`: `User` object including `role` and `entityId`
  - `token`: JWT string
  - `login(credentials)`, `loginWithGoogle(idToken)`, `setAuth(user, token)`, and logout behavior
  - Persists to `localStorage` under key `auth-storage`.

References
- Auth store (Zustand + persistence): [smartcampost-frontend/src/store/authStore.ts](smartcampost-frontend/src/store/authStore.ts#L14-L22)
- Persistence key and partialize config: [smartcampost-frontend/src/store/authStore.ts](smartcampost-frontend/src/store/authStore.ts#L78-L86)
- Google provider bootstrap: [smartcampost-frontend/src/main.tsx](smartcampost-frontend/src/main.tsx#L1-L20)
- Google login usage (register & login pages): [smartcampost-frontend/src/pages/auth/Register.tsx](smartcampost-frontend/src/pages/auth/Register.tsx#L288-L304)

Auth flow (client-side)
1. User submits credentials on `Login` page. The page calls `useAuthStore().login(credentials)`.
2. `authStore.login` calls `apiClient.login(credentials)` (see `src/lib/api.ts` / `src/services/apiClient.ts`) and stores `user` + `token` in store and localStorage on success.
3. `ProtectedRoute` inspects `useAuthStore().isAuthenticated` and redirects to `/auth/login` if not authenticated.
4. For protected SSE (EventSource), hooks (`useScanSSE`, `useAiSSE`) read the token from `localStorage` and append it to the SSE URL as `?token=<jwt>`.

Google Sign-In
- `src/main.tsx` registers `GoogleOAuthProvider` with `GOOGLE_CLIENT_ID` environment value.
- `src/pages/auth/Register.tsx` and other auth pages use `@react-oauth/google` `GoogleLogin` component. On success they call `loginWithGoogle(credential)` on `authStore` which forwards the credential (ID token) to backend via `apiClient.loginWithGoogle(...)`.
- Status: Google front-end integration is present and wired (`GoogleOAuthProvider` + `GoogleLogin`), but backend must accept and verify the token for end-to-end login to succeed.

Protected components & role checks
- `ProtectedRoute.tsx` performs authentication checks and redirects unauthenticated users to `/auth/login`.
- Many pages also check `user.role` via `useAuthStore` to show/hide controls (e.g., language switcher hides client-only controls, pages use conditional render for admin controls).

Token usage
- `apiClient`/`axiosClient` automatically includes `Authorization: Bearer <token>` on API calls when `token` is present in `authStore` or `localStorage`.

Validation & UX
- Login/Register forms present inline validation and display toasts on success/error. OTP flows use `pages/auth/Register.tsx` and `ResetPassword.tsx` with explicit send/confirm steps.

Recommendations
- If adding refresh tokens, implement secure HTTP-only cookie flow; currently token persists in `localStorage` (acceptable but sensitive to XSS).
