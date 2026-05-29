# SmartCAMPOST — Role Hierarchy

## Creation Hierarchy

```
                    ┌──────────────────────┐
                    │  SYSTEM BOOTSTRAP    │
                    │  (startup, env vars) │
                    └──────────┬───────────┘
                               │ creates
                    ┌──────────▼───────────┐
                    │        ADMIN         │
                    │  Full system access  │
                    └──────────┬───────────┘
              ┌────────────────┼─────────────────┐
              │                │                 │
    ┌─────────▼──────┐ ┌───────▼──────┐ ┌────────▼───────┐
    │     STAFF      │ │   FINANCE    │ │      RISK      │
    │                │ │              │ │                │
    └────────┬───────┘ └──────────────┘ └────────────────┘
        ┌────┴─────┐
   ┌────▼────┐ ┌───▼────┐
   │  AGENT  │ │COURIER │
   └─────────┘ └────────┘

                    ┌──────────────────────┐
                    │  PUBLIC REGISTRATION │
                    └──────────┬───────────┘
                               │ self-registers
                    ┌──────────▼───────────┐
                    │       CLIENT         │
                    │  No admin required   │
                    └──────────────────────┘
```

---

## Role Definitions

### ADMIN
- **Created by:** Bootstrap on startup or another ADMIN
- **Entity link:** `Staff`
- **Scope:** Full system access
- **Unique capabilities:**
  - Create all internal accounts (Staff, Agent, Courier)
  - Freeze/unfreeze any user account
  - Override locked parcels
  - Approve/reject AI recommendations
  - Access actuator + debug endpoints
  - Manage tariffs, integrations, agencies
  - View all data across all agencies

### STAFF
- **Created by:** ADMIN only
- **Entity link:** `Staff`
- **Scope:** Operational management
- **Capabilities:** View all parcels, manage pickups, update support tickets, view analytics
- **Cannot:** Create accounts, freeze users, access finance/risk modules

### AGENT
- **Created by:** ADMIN only
- **Entity link:** `Agent` (linked to `Staff`)
- **Scope:** Agency counter operations
- **Capabilities:** Scan parcel intake, validate & lock parcels, generate final QR, create scan events
- **Cannot:** Access financial data, risk modules, or other agencies' data

### COURIER
- **Created by:** ADMIN only
- **Entity link:** `Courier`
- **Scope:** Field delivery operations
- **Capabilities:** View assigned pickups/deliveries, update GPS location, send/verify delivery OTP, capture delivery proof, mark parcel delivered
- **Cannot:** See financial data, other couriers' data, or any admin functions

### FINANCE
- **Created by:** ADMIN only
- **Entity link:** `Staff`
- **Scope:** Financial oversight
- **Capabilities:** View all payments, approve/reject refunds, view financial analytics, export reports
- **Cannot:** Modify parcels, freeze users, access risk module

### RISK
- **Created by:** ADMIN only
- **Entity link:** `Staff`
- **Scope:** Fraud & compliance
- **Capabilities:** View/manage risk alerts, view compliance reports, can freeze users (via RiskAlerts UI in frontend)
- **Cannot:** Approve AI actions, access financial details, create accounts

### CLIENT
- **Created by:** Self-registration via `POST /api/auth/register`
- **Entity link:** `Client`
- **Scope:** End-user shipping
- **Capabilities:** Create parcels, track parcels, request pickups, make payments, request refunds, create support tickets
- **Cannot:** Access any internal module

---

## Role-to-Entity Mapping

```
UserAccount.role    UserAccount.entityId points to
─────────────────────────────────────────────────
CLIENT          →   Client.id
AGENT           →   Agent.id
COURIER         →   Courier.id
STAFF           →   Staff.id
ADMIN           →   Staff.id
FINANCE         →   Staff.id
RISK            →   Staff.id
```

---

## Data Isolation by Role

### CLIENT
```sql
-- Can only read own parcels:
SELECT * FROM parcel WHERE client_id = :entityId

-- Can only read own payments:
SELECT * FROM payment WHERE parcel_id IN (SELECT id FROM parcel WHERE client_id = :entityId)
```

### AGENT
```sql
-- Can read parcels at their agency:
SELECT * FROM parcel
WHERE origin_agency_id = :agentAgencyId
   OR destination_agency_id = :agentAgencyId
```

### COURIER
```sql
-- Can only see assigned pickups:
SELECT * FROM pickup_request WHERE courier_id = :entityId
```

### ADMIN / STAFF
```sql
-- No filter — full visibility
SELECT * FROM parcel
```

---

## Business Rules for Role Enforcement

1. **Self-registration** (`POST /api/auth/register`) creates ONLY CLIENT accounts. The backend hardcodes `role = CLIENT` regardless of any role field in the request body.

2. **Admin account creation** endpoints (`POST /api/admin/staff`, `/api/admin/agents`, `/api/admin/couriers`) are protected by `@PreAuthorize("hasRole('ADMIN')")`. They are the **only way** to create internal roles.

3. **No role escalation via API.** A user cannot PATCH their own `UserAccount.role`. The field is only writable by ADMIN via dedicated management endpoints.

4. **FINANCE and RISK are sub-roles of STAFF** in terms of entity linking (both use `Staff.id` as entityId) but have completely separate API authorization.

5. **Agent must be linked to a Staff.** The `Agent.staff_id` foreign key is NOT NULL and UNIQUE, creating a mandatory 1:1 relationship.

---

## Frontend Role Enforcement

| Platform | Enforcement Point |
|---|---|
| Web | `ProtectedWrapper allowedRoles={[...]}` on every role route tree |
| Mobile | `GoRouter.redirect()` checks `authProvider.userRole` |
| Backend | `SecurityConfig` URL-level + `@PreAuthorize` method-level |

Triple-layer enforcement: even if a frontend check is bypassed, the backend independently validates the JWT role claim on every request.
