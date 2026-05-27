# Frontend Architecture — SmartCAMPOST (Web)

Summary
- Framework: Vite + React + TypeScript.
- UI primitives: custom component library under `src/components/ui` and Tailwind-based styles.
- State: lightweight global stores using `zustand` in `src/store` (notably `authStore`).
- Routing: React Router v6 configured in `src/App.tsx` with guarded routes via `ProtectedRoute`.
- Internationalization: `src/i18n` with JSON locales (`en.json`, `fr.json`).
- Realtime: SSE hooks for scans and AI events (`src/hooks/useScanSSE.tsx`, `src/hooks/useAiSSE.tsx`).

Key folders
- `src/pages/` — application pages grouped by domain (auth, dashboard, parcels, deliveries, maps, support, scan, users, etc.).
- `src/components/` — shared UI components and feature widgets (chat, maps, qrcode, delivery stepper, notifications).
- `src/services/` — API client wrappers separated by domain (parcels, payments, deliveries, approvals, ai, notifications).
- `src/hooks/` — reusable React hooks (data fetching, SSE, geolocation, offline sync).
- `src/store/` — global state stores (authStore, other domain stores).

References
- Entry + Google provider: [smartcampost-frontend/src/main.tsx](smartcampost-frontend/src/main.tsx#L1-L20)
- Top-level routes and router: [smartcampost-frontend/src/App.tsx](smartcampost-frontend/src/App.tsx#L1-L40)
- SSE hooks: [smartcampost-frontend/src/hooks/useAiSSE.tsx](smartcampost-frontend/src/hooks/useAiSSE.tsx#L22-L35)


Entry points
- `src/main.tsx` — app bootstrap, `GoogleOAuthProvider` is configured here.
- `src/App.tsx` — route definitions, route wrappers, and top-level layout mounting.

Routing & Layouts
- Routes are defined in `src/App.tsx` and use `ProtectedRoute` for authenticated-only paths.
- `RoleLayout.tsx` provides role-specific layout and navigation for different user roles.
- `routeByRole.ts` contains helper logic to map roles to base routes and features.

Auth & persistence
- `authStore.ts` (Zustand) manages `user`, `token`, `isAuthenticated`, login, Google login, and persistence via localStorage (`auth-storage`).
- `apiClient` and `axiosClient` attach the JWT token to requests when present.

Realtime & SSE
- `SseEmitters` on the backend is consumed via `useScanSSE` and `useAiSSE` which attach token from `authStore` to EventSource via `?token=` query param.

Notes on code ownership & conventions
- Files use absolute-imports via `@/` alias. Types are in `src/types`.
- API surfaces are wrapped in `src/services/*` with domain-specific methods returning typed DTOs.
