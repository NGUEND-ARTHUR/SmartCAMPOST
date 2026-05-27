# Permissions Matrix — SmartCAMPOST

Legend: R = Read, C = Create, U = Update, D = Delete, X = Execute (action), A = Approve

Feature / Role | CLIENT | COURIER | AGENT | STAFF | FINANCE | RISK | ADMIN
---|---:|---:|---:|---:|---:|---:|---:
View own parcels | R | R | R | R | R | R | R
Create parcel | C | - | - | U* | - | - | U
Assign courier | - | X (accept assignment) | X (suggest) | X | - | - | X / A
Confirm delivery | - | C/X | - | U | - | - | U
User management | - | - | - | - | - | - | C/R/U/D
Approvals (AI) | - | - | - | R | R | R | A
Payments/refunds | R | - | - | - | C/A | - | A
View analytics | R | R | R | R | R | R | R

Notes
- `U*` for staff on `Create parcel` indicates staff may create parcels on behalf of clients (agency intake).
- Approvals require `approval:review` authority mapped to ADMIN/STAFF roles in backend; frontend shows approvals only to those roles.
- Backend enforces all permission checks; frontend checks are UX-only.

Reference implementations
- Approvals controller & role guard: [backend/src/main/java/com/smartcampost/backend/approval/ApprovalController.java](backend/src/main/java/com/smartcampost/backend/approval/ApprovalController.java)
- Protected route checks (frontend): [smartcampost-frontend/src/components/auth/ProtectedRoute.tsx](smartcampost-frontend/src/components/auth/ProtectedRoute.tsx#L1-L30)
- Mobile router redirect enforced by `AuthProvider` state: [smartcampost_mobile/lib/main.dart](smartcampost_mobile/lib/main.dart#L20-L60)
