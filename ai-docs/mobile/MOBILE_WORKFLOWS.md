# Mobile Workflows

1) App startup
- `main()` initializes `LocaleProvider` and `AuthProvider` (calls `checkAuth()`), then wires `ParcelProvider` and launches `MaterialApp.router` with `GoRouter`. See: [smartcampost_mobile/lib/main.dart](smartcampost_mobile/lib/main.dart#L1-L30)

2) Login & redirect
- On login success provider sets user and `isAuthenticated`. `GoRouter`'s `redirect` sends user to role dashboard via `_dashboardForRole(userRole)`.

3) Create parcel (client)
- `CreateParcelScreen` collects multi-step form (addresses, parcel details, payment), validates locally, then calls `ParcelService.createParcel()` which uses `ApiClient.post('/parcels')`.

4) Courier pickup & delivery
- Courier views `PickupAssignmentsScreen` (calls `PickupService.listAssigned()`), accepts or starts delivery, uses `DeliveryService` to update status and navigates to `DeliveryConfirmationScreen` for proof capture.

5) Scan & intake (agent)
- `ScanIntakeScreen` and `ParcelValidationScreen` handle scanning (QR/barcode), verify parcel state, and call backend scan endpoints via `ApiClient`.

6) Approvals & admin actions
- Admin UI pages call management APIs (users, tariffs). Approvals (if present) are consumed via backend endpoints; mobile admin views map to `AdminDashboard` and `UserManagementScreen`.

Offline & retry
- `ApiClient` has network timeouts and logs in debug; some providers may queue actions locally (inspect `providers/*` for offline logic). Consider adding network reachability and retry with idempotency keys.
