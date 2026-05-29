# SmartCAMPOST — Frontend Roles & Role-Based UI

## Roles

The frontend recognizes 7 roles, each with a completely separate navigation structure and feature set:

| Role | Self-Register | Dashboard Route | Primary Use |
|---|:---:|---|---|
| `CLIENT` | Yes | `/client` | Ship parcels, track, pay |
| `AGENT` | No (ADMIN creates) | `/agent` | Scan intake, validate parcels |
| `COURIER` | No (ADMIN creates) | `/courier` | Pickup, deliver, OTP confirm |
| `STAFF` | No (ADMIN creates) | `/staff` | Parcel management, analytics |
| `ADMIN` | No (bootstrap) | `/admin` | Full system access |
| `FINANCE` | No (ADMIN creates) | `/finance` | Payments, refunds, reports |
| `RISK` | No (ADMIN creates) | `/risk` | Alerts, compliance, freeze |

---

## Role-Based Navigation (RoleLayout.tsx)

### CLIENT Nav
- Dashboard
- My Parcels
- Map
- Tracking
- Pickups
- Payments
- Support

### AGENT Nav
- Dashboard
- Map
- Scan Console

### COURIER Nav
- Dashboard
- Map
- My Pickups
- My Deliveries
- Scan Console

### STAFF Nav
- Dashboard
- Map
- Parcels
- Tracking
- Pickups
- Scan Console
- Notifications
- Analytics

### ADMIN Nav
- Dashboard
- Map, Parcels, Tracking, Scan Console
- Staff Dashboard
- Notifications, Analytics
- **User Management:** Clients, Agents, Agencies, Staff, Couriers
- **System:** Tariffs, Integrations, Account Management
- **Finance:** Finance Dashboard, Create Finance
- **Risk:** Risk Dashboard, Create Risk
- Self-Healing Dashboard

### FINANCE Nav
- Dashboard
- Map
- Payments
- Refunds
- Analytics
- Notifications

### RISK Nav
- Dashboard
- Map
- Risk Alerts
- Compliance
- Analytics
- Notifications

---

## Role-Based Feature Access Matrix

| Feature | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create parcel | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View own parcels | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all parcels | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Print label / QR | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Scan console | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Validate parcel (agent) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pickup management | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delivery confirm + OTP | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Client payment view | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Full payment management | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Refund management | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage clients | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage agents | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage couriers | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage staff | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage agencies | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tariff management | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Integration config | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Account freeze/unfreeze | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Risk alerts management | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Compliance reports | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Self-healing dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Finance dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Support tickets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Map | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Scan Console Role-Aware Event Types

The `ScanConsole` component shows different event type options based on role:

| Role | Available Event Types |
|---|---|
| AGENT | `AT_ORIGIN_AGENCY`, `ARRIVED_HUB`, `ARRIVED_DESTINATION`, `TAKEN_IN_CHARGE` |
| COURIER | `TAKEN_IN_CHARGE`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED` |
| ADMIN / STAFF | All event types |

---

## Tracking Page Role-Aware Content

| Element | CLIENT / Public | STAFF / ADMIN |
|---|---|---|
| Timeline of scan events | ✅ | ✅ |
| Audit trail section | ❌ | ✅ |
| Internal notes/comments | ❌ | ✅ |
| GPS coordinates | ❌ | ✅ |

---

## Role Creation Rules (Frontend-Visible)

The frontend enforces the business rule that only ADMIN can create internal accounts:

- **Registration page** (`/auth/register`): Only creates CLIENT accounts. No role selector exists.
- **Staff Management** (`/admin/users/staff`): ADMIN-only route. Create form includes role selector: STAFF, ADMIN, FINANCE, RISK, COURIER.
- **Agent Management** (`/admin/users/agents`): ADMIN-only route.
- **Courier Management** (`/admin/users/couriers`): ADMIN-only route.

There is no frontend path for a non-ADMIN to create any internal role.

---

## Risk Dashboard — Freeze User (Frontend Flow)

```
RISK or ADMIN user navigates to /risk/alerts
RiskAlerts.tsx displays risk alerts with user details

User clicks "Freeze Account" on an alert
    → PATCH /api/admin/users/{userId}/freeze
    → Shows success toast
    → Alert status updated to RESOLVED (or ESCALATED)
```

---

## Finance Dashboard — Payment Operations

Finance users can:
- View all payments with date/status filters
- Approve/reject refunds
- Download financial reports (CSV/XLSX/PDF via exportCsv.ts)
- Cannot access parcel management or user management
