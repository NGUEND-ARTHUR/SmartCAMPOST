# Frontend Routes & Pages

Primary routing file
- `src/App.tsx` — registers public auth routes and internal app routes. Uses `ProtectedWrapper` / `ProtectedRoute` for guarded sections.

Public (unauthenticated) routes
- `/` — Landing page (`src/pages/common/Landing.tsx`) with links to login/register.
- `/auth/login` — password login page (`src/pages/auth/Login.tsx`).
- `/auth/login-otp` — login by OTP (`src/pages/auth/LoginOtp.tsx`).
- `/auth/register` — registration page with OTP and Google option (`src/pages/auth/Register.tsx`).
- `/auth/reset-password` — password reset flow (`src/pages/auth/ResetPassword.tsx`).

Protected (authenticated) routes (examples)
- `/dashboard/*` — dashboards per role: `StaffDashboard`, `CourierDashboard`, `FinanceDashboard`, `RiskDashboard` under `src/pages/dashboard/`.
- `/parcels/*` — parcel listing, create, detail, tracking pages (`src/pages/parcels/*`).
- `/deliveries/*` — delivery lists and details (`src/pages/deliveries/*`).
- `/scan/*` — scanning console and related pages (`src/pages/scan/*`).
- `/maps/*` — mapping pages and role-specific map dashboards (`src/pages/maps/*`).
- `/support/*` — support tickets and pages (`src/pages/support/*`).
- `/users/*` — management pages for `ClientManagement`, `CourierManagement`, `StaffManagement`, `AgentManagement`, `AgencyManagement` (`src/pages/users/*`).

Admin & role-specific routes
- Admin/Finance/Risk role pages live in dashboard and users management areas and are protected via `ProtectedRoute` checks and `useAuthStore` role checks in page components.

Route guards & layouts
- `src/components/auth/ProtectedRoute.tsx` — redirects unauthenticated users to `/auth/login` and optionally enforces role-based access by comparing `user.role`.
- `src/layouts/RoleLayout.tsx` — per-role navigational shell; pages import/use it for consistent UI.

References
- Route registry and guarded routes: [smartcampost-frontend/src/App.tsx](smartcampost-frontend/src/App.tsx#L96-L120)
- Multiple role-protected route examples: [smartcampost-frontend/src/App.tsx](smartcampost-frontend/src/App.tsx#L136-L160)
- Protected route implementation: [smartcampost-frontend/src/components/auth/ProtectedRoute.tsx](smartcampost-frontend/src/components/auth/ProtectedRoute.tsx#L10-L22)


Notes
- Many pages perform inline role checks (e.g., `useAuthStore(s => s.user?.role)`) to conditionally show controls.
- Routes are organized by feature directory under `src/pages` for discoverability.
