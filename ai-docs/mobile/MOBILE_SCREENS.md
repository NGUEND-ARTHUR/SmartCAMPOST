# Mobile Screens — Overview & Mapping

Entry & navigation
- Router and routes defined in `main.dart` using `go_router`. Top-level routes per role: `/client`, `/courier`, `/agent`, `/staff`, `/admin`, `/finance`, `/risk`.
  - See full route tree: [smartcampost_mobile/lib/main.dart](smartcampost_mobile/lib/main.dart#L40-L160)

Client screens
- `ClientDashboardScreen`: [smartcampost_mobile/lib/screens/client/client_dashboard_screen.dart](smartcampost_mobile/lib/screens/client/client_dashboard_screen.dart)
- `ParcelListScreen` / `ParcelDetailScreen` / `CreateParcelScreen` / `TrackParcelScreen`: [smartcampost_mobile/lib/screens/client](smartcampost_mobile/lib/screens/client)

Courier screens
- `CourierDashboardScreen`, `PickupAssignmentsScreen`, `DeliveryScreen`, `QrScanScreen`, `DeliveryConfirmationScreen`: [smartcampost_mobile/lib/screens/courier](smartcampost_mobile/lib/screens/courier)

Agent screens
- `AgentDashboardScreen`, `ParcelValidationScreen`, `ScanIntakeScreen`: [smartcampost_mobile/lib/screens/agent](smartcampost_mobile/lib/screens/agent)

Staff & Admin screens
- Staff: `StaffDashboardScreen`, `ParcelManagementScreen`, `AnalyticsScreen` — [smartcampost_mobile/lib/screens/staff](smartcampost_mobile/lib/screens/staff)
- Admin: `AdminDashboardScreen`, `UserManagementScreen`, `TariffManagementScreen` — [smartcampost_mobile/lib/screens/admin](smartcampost_mobile/lib/screens/admin)

Finance & Risk screens
- Finance: `FinanceDashboardScreen`, `PaymentsScreen` — [smartcampost_mobile/lib/screens/finance](smartcampost_mobile/lib/screens/finance)
- Risk: `RiskDashboardScreen`, `ComplianceAlertsScreen` — [smartcampost_mobile/lib/screens/risk](smartcampost_mobile/lib/screens/risk)

Shared screens & widgets
- `NotificationsScreen`, `ProfileScreen`, `PlaceholderScreen`, and common widgets in `lib/widgets/common_widgets.dart`.

Screen responsibilities
- Dashboards aggregate domain widgets and call providers for data (ParcelProvider, etc.).
- Scan/QR screens use camera plugins and validate scanned payloads before calling scan endpoints (see `qr_scan_screen.dart`).
