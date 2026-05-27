# Frontend Roles & Role-Based UI

Role model
- Roles mirror backend `UserRole` semantics and are surfaced in the frontend via `authStore.user.role` (values: `CLIENT`, `COURIER`, `AGENT`, `STAFF`, `ADMIN`, `FINANCE`, `RISK`). See types in `src/types` and uses in components.

Role-based navigation & layout
- `RoleLayout.tsx` switches nav items and feature visibility based on `user.role` — used to render different dashboard entry points and sidebars.
- `routeByRole.ts` centralizes role → landing route mapping.

Per-page role checks
- Many pages directly inspect `useAuthStore((s) => s.user?.role)` to conditionally show actions (e.g., `ParcelDetail` shows edit/assign buttons only to STAFF/ADMIN/AGENT).
- Examples:
  - `src/pages/parcels/ParcelManagement.tsx` checks role to toggle management controls.
  - `src/components/ui/languageswitcher.tsx` hides certain language controls for non-client roles.

Permission patterns
- Fine-grained permissions are represented as granted authorities on `user` and sometimes used via `useAuthStore` or in `ProtectedRoute` logic. There are also explicit checks for authorities like `approval:review` in approvals UI which call the approvals API (`src/services/approvals/approvals.api.ts`).

Notes
- Role checks are client-side only: backend must enforce server-side authorization. Frontend role checks are for UX and reducing accidental access.

References
- Role → route mapping: [smartcampost-frontend/src/lib/routeByRole.ts](smartcampost-frontend/src/lib/routeByRole.ts#L1-L20)
- Role layout and nav-by-role: [smartcampost-frontend/src/layouts/RoleLayout.tsx](smartcampost-frontend/src/layouts/RoleLayout.tsx#L1-L40)

