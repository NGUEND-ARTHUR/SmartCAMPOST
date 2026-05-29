# SmartCAMPOST — Frontend Routes

## Public Routes (No Auth Required)

| Path | Component | Description |
|---|---|---|
| `/` | `Landing.tsx` | Public landing page with parcel tracking search |
| `/tracking` | `TrackingPage.tsx` | Public parcel tracking by number or QR |
| `/auth/login` | `Login.tsx` | Phone/email + password login, Google OAuth |
| `/auth/login-otp` | `LoginOtp.tsx` | OTP-based login flow |
| `/auth/register` | `Register.tsx` | Client self-registration with OTP |
| `/auth/reset-password` | `ResetPassword.tsx` | Forgot password — OTP → new password |
| `/mtn-test` | `MtnTest.tsx` | MTN MoMo payment test page (dev only) |

---

## CLIENT Routes (`/client/*`)
**Guard:** `ProtectedWrapper allowedRoles={["CLIENT"]}`

| Path | Component | Description |
|---|---|---|
| `/client` | `ClientDashboard` | Stats: parcels in transit/delivered/pending |
| `/client/parcels` | `ParcelList` | My parcels with search, filter, export |
| `/client/parcels/create` | `CreateParcel` | Multi-step parcel creation form |
| `/client/parcels/:id` | `ParcelDetail` | Full parcel details + history |
| `/client/parcels/:id/print-label` | `PrintLabelPage` | Print shipping label |
| `/client/parcels/:id/qr` | `QRCodePage` | View/download parcel QR code |
| `/client/pickups` | `Pickups` | Pickup request management |
| `/client/payments` | `ClientPayments` | My payment history |
| `/client/map` | `RoleMapDashboard` | Map with client-relevant locations |
| `/client/tracking` | `TrackingPage` | Search by tracking number |
| `/client/support` | `Support` | Create/view support tickets |
| `/client/notifications` | `Notifications` | Notification feed |

---

## COURIER Routes (`/courier/*`)
**Guard:** `ProtectedWrapper allowedRoles={["COURIER"]}`

| Path | Component | Description |
|---|---|---|
| `/courier` | `CourierDashboard` | Delivery/pickup stats |
| `/courier/pickups` | `CourierPickups` | Assigned pickup requests |
| `/courier/pickups/:id` | `PickupDetail` | Pickup request details |
| `/courier/deliveries` | `CourierDeliveries` | Active deliveries (list/map) |
| `/courier/deliveries/:id` | `DeliveryDetail` | Delivery details + proof |
| `/courier/deliveries/confirm` | `ConfirmDelivery` | OTP verification + proof upload |
| `/courier/map` | `RoleMapDashboard` | Live delivery map |
| `/courier/scan` | `ScanConsole` | QR scanner for delivery events |
| `/courier/notifications` | `Notifications` | Notification feed |

---

## AGENT Routes (`/agent/*`)
**Guard:** `ProtectedWrapper allowedRoles={["AGENT"]}`

| Path | Component | Description |
|---|---|---|
| `/agent` | `AgentDashboard` | Agency-level parcel metrics |
| `/agent/map` | `RoleMapDashboard` | Agency map view |
| `/agent/scan` | `ScanConsole` | QR scanner for intake/transit events |
| `/agent/notifications` | `Notifications` | Notification feed |

---

## STAFF Routes (`/staff/*`)
**Guard:** `ProtectedWrapper allowedRoles={["STAFF"]}`

| Path | Component | Description |
|---|---|---|
| `/staff` | `StaffDashboard` | Staff-level overview |
| `/staff/pickups` | `PickupsManagement` | Manage all pickup requests |
| `/staff/parcels` | `ParcelManagement` | View/manage all parcels |
| `/staff/parcels/:id` | `ParcelDetail` | Parcel detail view |
| `/staff/parcels/:id/qr` | `QRCodePage` | QR code viewer |
| `/staff/tracking` | `TrackingPage` | Track any parcel |
| `/staff/map` | `RoleMapDashboard` | Map with all locations |
| `/staff/scan` | `ScanConsole` | QR scanner |
| `/staff/notifications` | `Notifications` | Notification feed |
| `/staff/analytics` | `Analytics` | Analytics dashboard |

---

## ADMIN Routes (`/admin/*`)
**Guard:** `ProtectedWrapper allowedRoles={["ADMIN"]}`

| Path | Component | Description |
|---|---|---|
| `/admin` | `AdminDashboard` | System-wide metrics + live SSE scan feed |
| `/admin/api-coverage` | `ApiCoverage` | Debug: API endpoint coverage report |
| `/admin/parcels` | `ParcelManagement` | All parcels |
| `/admin/parcels/:id` | `ParcelDetail` | Parcel detail |
| `/admin/parcels/:id/qr` | `QRCodePage` | QR code |
| `/admin/tracking` | `TrackingPage` | Public-style tracking |
| `/admin/map` | `RoleMapDashboard` | Full map view |
| `/admin/scan` | `ScanConsole` | QR scanner |
| `/admin/staff` | `StaffDashboard` | Staff view |
| `/admin/notifications` | `Notifications` | Notification feed |
| `/admin/analytics` | `Analytics` | Analytics |
| `/admin/users/clients` | `ClientManagement` | Manage clients |
| `/admin/users/agents` | `AgentManagement` | Manage agents |
| `/admin/users/agencies` | `AgencyManagement` | Manage agencies |
| `/admin/users/staff` | `StaffManagement` | Manage staff + couriers |
| `/admin/users/couriers` | `CourierManagement` | Manage couriers |
| `/admin/tariffs` | `TariffManagement` | Create/edit tariffs |
| `/admin/integrations` | `IntegrationManagement` | 3rd-party integrations |
| `/admin/accounts` | `UserAccountManagement` | Freeze/unfreeze accounts |
| `/admin/finance` | `FinanceDashboard` (admin view) | Finance dashboard |
| `/admin/finance/create` | `CreateFinancePage` | Create finance record |
| `/admin/risk` | `RiskDashboard` (admin view) | Risk dashboard |
| `/admin/risk/create` | `CreateRiskPage` | Create risk record |
| `/admin/self-healing` | `SelfHealingDashboard` | Congestion detection + actions |

---

## FINANCE Routes (`/finance/*`)
**Guard:** `ProtectedWrapper allowedRoles={["FINANCE"]}`

| Path | Component | Description |
|---|---|---|
| `/finance` | `FinanceDashboard` | Revenue + payment metrics |
| `/finance/payments` | `Payments` | All payments with filters |
| `/finance/refunds` | `Refunds` | Refund management |
| `/finance/map` | `RoleMapDashboard` | Map |
| `/finance/analytics` | `Analytics` | Finance analytics |
| `/finance/notifications` | `Notifications` | Notification feed |

---

## RISK Routes (`/risk/*`)
**Guard:** `ProtectedWrapper allowedRoles={["RISK"]}`

| Path | Component | Description |
|---|---|---|
| `/risk` | `RiskDashboard` | Risk metrics + recent alerts |
| `/risk/alerts` | `RiskAlerts` | All risk alerts + user freeze |
| `/risk/map` | `RoleMapDashboard` | Map |
| `/risk/compliance` | `Compliance` | Compliance information |
| `/risk/analytics` | `Analytics` | Analytics |
| `/risk/notifications` | `Notifications` | Notification feed |

---

## Standalone Map Routes (Lazy-Loaded)

| Path | Component | Description |
|---|---|---|
| `/maps/viewer` | `MapViewer` | Detailed map viewer |
| `/maps/pickups` | `PickupMap` | Map of pickup locations |
| `/maps/tracking` | `TrackingMap` | Live tracking map |

---

## Route Protection Logic

```typescript
// ProtectedRoute.tsx
function ProtectedWrapper({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuthStore();

  // Not logged in → login page
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  // Wrong role → home
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

## Post-Login Redirect (`routeByRole.ts`)

```typescript
export function routeByRole(role: string): string {
  switch (role) {
    case "CLIENT":  return "/client";
    case "COURIER": return "/courier";
    case "AGENT":   return "/agent";
    case "STAFF":   return "/staff";
    case "ADMIN":   return "/admin";
    case "FINANCE": return "/finance";
    case "RISK":    return "/risk";
    default:        return "/";
  }
}
```

---

## 404 Catch-All

```typescript
<Route path="*" element={<Navigate to="/" replace />} />
```

All unknown routes redirect to `/` (landing page).
