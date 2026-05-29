# SmartCAMPOST — Backend Roles & Permissions

## Role Hierarchy

```
                          ┌─────────┐
                          │  ADMIN  │  ← Full system access + creates all internal roles
                          └────┬────┘
               ┌───────────────┼───────────────┐
          ┌────▼────┐    ┌─────▼────┐    ┌─────▼────┐
          │  STAFF  │    │ FINANCE  │    │   RISK   │
          └────┬────┘    └──────────┘    └──────────┘
          ┌────▼────┐    ┌─────────┐
          │  AGENT  │    │ COURIER │
          └─────────┘    └─────────┘
                     ┌────────┐
                     │ CLIENT │  ← Self-registers
                     └────────┘
```

## Role Definitions

### `ADMIN`
System administrator with full access. Only role allowed to:
- Create Staff, Agent, Courier accounts
- Freeze and unfreeze any user account
- Override locked parcels
- Approve/reject AI recommendations
- Access actuator endpoints
- View all users, all parcels, all compliance data

**Entity link:** `UserAccount.entityId` → `Staff.id`  
**Creation:** Bootstrap on startup or via another ADMIN

---

### `STAFF`
Internal employee (typically agency manager or support staff).
- View all clients, agents, couriers
- View and update parcels within their scope
- Update support ticket status
- View analytics
- Cannot create other accounts (only ADMIN can)

**Entity link:** `UserAccount.entityId` → `Staff.id`  
**Creation:** ADMIN only via `POST /api/admin/staff`

---

### `AGENT`
Counter agent at a delivery agency/hub.
- Accept parcels physically delivered to the agency
- Validate parcel weight, dimensions, and description
- Generate final locked QR code
- Record scan events with mandatory GPS
- View parcels assigned to their agency
- Cannot access admin, finance, or risk modules

**Entity link:** `UserAccount.entityId` → `Agent.id`  
**Creation:** ADMIN only via `POST /api/admin/agents`

---

### `COURIER`
Home delivery courier (motorcycle/car).
- View assigned pickup requests
- Update own GPS location in real time
- Request and verify delivery OTP from recipient
- Submit proof of delivery (photo/signature)
- Mark parcels as delivered
- Cannot access admin or financial data

**Entity link:** `UserAccount.entityId` → `Courier.id`  
**Creation:** ADMIN only via `POST /api/admin/couriers`

---

### `FINANCE`
Financial auditor / accountant.
- Access payment ledger and financial reports
- Access revenue analytics
- Approve or reject refunds
- View refund adjustments
- Cannot modify parcels, users, or system config

**Entity link:** `UserAccount.entityId` → `Staff.id`  
**Creation:** ADMIN only

---

### `RISK`
Compliance / anti-fraud officer.
- View and manage risk alerts
- Update alert status (acknowledge, resolve, escalate)
- View compliance reports
- Cannot approve AI actions or freeze accounts (ADMIN-only)

**Entity link:** `UserAccount.entityId` → `Staff.id`  
**Creation:** ADMIN only

---

### `CLIENT`
End-user / shipper.
- Self-register via `POST /api/auth/register`
- Create and manage own parcels
- Request home pickup
- Initiate and track payments
- Request refunds
- View own tracking history
- Cannot access any internal modules

**Entity link:** `UserAccount.entityId` → `Client.id`  
**Creation:** Self-registration

---

## Permissions Matrix

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Self-register | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create parcel | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View own parcels | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all parcels | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Accept parcel | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Validate & lock QR | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Record scan event | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deliver parcel (OTP/proof) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Request pickup | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update pickup state | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Initiate payment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Request refund | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve/reject refund | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View financial reports | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| View risk alerts | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage risk alerts | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View compliance reports | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create staff account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create agent account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create courier account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Freeze/unfreeze user | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Override locked parcel | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Approve AI recommendations | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Update own GPS location | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create support ticket | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update ticket status | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## UserAccount Model

```java
class UserAccount {
    UUID id;
    String phone;           // unique login identifier
    String email;           // optional, unique
    String passwordHash;    // BCrypt (null for Google-only accounts)
    AuthProvider authProvider; // LOCAL | GOOGLE
    String googleId;        // null for LOCAL accounts
    UserRole role;          // CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK
    UUID entityId;          // FK to Client / Staff / Agent / Courier
    Boolean frozen;         // admin-controlled compliance flag
    Instant createdAt;
}
```

**entityId resolution by role:**
| Role | entityId Points To |
|---|---|
| CLIENT | `Client.id` |
| AGENT | `Agent.id` |
| COURIER | `Courier.id` |
| STAFF | `Staff.id` |
| ADMIN | `Staff.id` |
| FINANCE | `Staff.id` |
| RISK | `Staff.id` |

---

## Role-Based Data Isolation

### CLIENT
- Can only see their own parcels (`parcel.client_id = current_user.entityId`)
- Can only see their own payments, invoices, notifications
- Cannot enumerate other clients or any internal entities

### AGENT
- Sees parcels at their assigned agency (`parcel.origin_agency_id = agent.agency_id` OR `destination_agency_id`)
- Scan events scoped to their agency

### COURIER
- Sees pickup requests assigned to them (`pickup_request.courier_id = courier.id`)
- Can only deliver parcels assigned to their route

### STAFF / ADMIN
- Full cross-agency visibility
- ADMIN additionally sees all user accounts

---

## Role Assignment Rules (Critical Business Rules)

1. **CLIENT** — the only role that can self-assign at registration
2. **AGENT, COURIER, STAFF, FINANCE, RISK** — must be created exclusively by ADMIN
3. **ADMIN** — created either by bootstrap at startup or by another ADMIN
4. No role escalation is possible through the API: a CLIENT cannot upgrade themselves
5. The `role` field on `UserAccount` is immutable after creation (except by ADMIN)
