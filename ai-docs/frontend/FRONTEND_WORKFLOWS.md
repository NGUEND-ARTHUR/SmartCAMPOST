# Frontend Workflows

1) Login (password)
- Page: `src/pages/auth/Login.tsx`
- Flow: user submits credentials → `authStore.login()` → `apiClient.login()` → store `user` + `token` persisted → navigate to role landing.

2) Login with OTP
- Pages: `src/pages/auth/LoginOtp.tsx` and `src/pages/auth/ResetPassword.tsx`.
- Flow: request OTP via API → receive confirmation (OTP not displayed in production) → submit OTP → `authStore` stores token on success.

3) Google Sign-In
- `GoogleOAuthProvider` in `src/main.tsx`, `GoogleLogin` component used in `Register.tsx` and auth pages → on success call `authStore.loginWithGoogle(idToken)` → backend verification required.

4) Protected SSE (scans & AI)
- Hooks: `useScanSSE.tsx`, `useAiSSE.tsx` read token from localStorage and open `EventSource('/api/stream/ai?token=...')` or `/api/stream/scan?token=...`.
- UI components subscribe to these hooks for live updates (scan console, AI chat, dashboards).

5) Approvals (human-in-loop)
- Approvals UI consumes `src/services/approvals/approvals.api.ts` and lists pending approvals. Approvers call approve/deny endpoints and UI shows toast + updates list.

6) Parcel creation & delivery assignment
- Parcel creation via `CreateParcel.tsx` calls parcels API; assignment flows use `deliveries`/`assignments` APIs with UI prompts and confirmation dialogs.

7) Offline sync
- `useOfflineSync` hook exists to queue operations when offline and flush when online (see `src/hooks/useOfflineSync.ts`).

Notes
- Forms use client-side validation and `react-toast` for feedback. Many pages use domain hooks (`useParcels`, `usePickups`, `useDeliveries`) which encapsulate API calls and error handling.

References
- Register (OTP + password + Google): [smartcampost-frontend/src/pages/auth/Register.tsx](smartcampost-frontend/src/pages/auth/Register.tsx#L1-L120)
- Register Google sign-in & role redirection: [smartcampost-frontend/src/pages/auth/Register.tsx](smartcampost-frontend/src/pages/auth/Register.tsx#L288-L304)
- Login flows (password/OTP) and role redirect usage: [smartcampost-frontend/src/pages/auth/Login.tsx](smartcampost-frontend/src/pages/auth/Login.tsx#L1-L80)

