# SmartCAMPOST — Complete Workflows Documentation

## Roles

| Role    | Code    | Description                                          |
| ------- | ------- | ---------------------------------------------------- |
| Client  | CLIENT  | Sends/receives parcels, pays, tracks                 |
| Courier | COURIER | Picks up and delivers parcels                        |
| Agent   | AGENT   | Agency operator, validates parcels, manages intake   |
| Staff   | STAFF   | Operational support, manages parcels across agencies |
| Admin   | ADMIN   | Full system access, manages users/tariffs/agencies   |
| Finance | FINANCE | Revenue, payments, refunds, invoices                 |
| Risk    | RISK    | Fraud detection, compliance, risk alerts             |

---

## WORKFLOW 1 — Parcel Lifecycle

CLIENT creates, AGENT validates, PAYMENT confirmed, COURIER picks up, IN TRANSIT, DELIVERED.

### Steps

1. CLIENT creates parcel — POST /api/parcels
2. AGENT validates and accepts — PATCH /api/parcels/:id/validate
3. Payment required (PREPAID: before pickup / COD: at delivery)
4. COURIER picks up — scan QR — status: TAKEN_IN_CHARGE
5. In transit — GPS tracking — status: IN_TRANSIT
6. Arrives at hub — scan — status: ARRIVED_HUB
7. Arrives at destination — scan — status: ARRIVED_DEST_AGENCY
8. Out for delivery — courier assigned — status: OUT_FOR_DELIVERY
9. Delivered — OTP/signature/photo proof — status: DELIVERED

---

## WORKFLOW 2 — Payment Flow

### Mobile Money (MTN/Orange via Fapshi)

1. CLIENT clicks Pay with MoMo — POST /api/payments/init
2. Backend calls Fapshi — sends prompt to phone
3. CLIENT confirms on phone
4. Frontend polls — POST /api/payments/confirm
5. Invoice auto-generated

### Cash at Agency

1. CLIENT pays cash to AGENT
2. AGENT clicks Confirm Cash Received — POST /api/payments/cash-confirm/:parcelId
3. Invoice auto-generated

### Cash on Delivery (COD)

1. Parcel delivered first
2. COURIER collects cash — Mark COD Paid — POST /api/payments/cod/:parcelId/mark-paid
3. Invoice auto-generated

### Payment Gate

PREPAID parcels CANNOT be picked up until payment equals SUCCESS.
COD parcels proceed without pre-payment.

---

## WORKFLOW 3 — Authentication

1. User visits landing page — clicks Login
2. Login with phone plus password — POST /api/auth/login
3. Or login with OTP — POST /api/auth/otp/send then /api/auth/otp/verify
4. Or register new account — POST /api/auth/register
5. JWT token stored — redirected to role-specific dashboard
6. Token refresh — POST /api/auth/refresh
7. Logout — POST /api/auth/logout

---

## WORKFLOW 4 — Pickup Scheduling

1. CLIENT requests pickup — POST /api/pickups
2. AGENT/STAFF assigns courier — PATCH /api/pickups/:id/assign
3. COURIER sees assignment — picks up parcel
4. COURIER confirms pickup — PATCH /api/pickups/:id/complete

---

## WORKFLOW 5 — Delivery Verification

### Standard (recipient is the owner)

1. COURIER sends OTP to recipient — POST /api/deliveries/send-otp
2. Recipient provides OTP — COURIER verifies — POST /api/deliveries/verify-otp
3. COURIER confirms delivery with proof — POST /api/deliveries/confirm

### Delegate Pickup (third party collects)

1. CLIENT authorizes delegate — POST /api/parcels/:id/delegates
2. System sends PIN to delegate via SMS
3. Delegate provides PIN — COURIER verifies — POST /api/parcels/:id/delegates/verify

---

## WORKFLOW 6 — Support Tickets

1. CLIENT creates ticket — POST /api/support/tickets
2. STAFF/ADMIN views inbox — /staff/support
3. STAFF replies — POST /api/support/tickets/:id/reply
4. STAFF updates status — PATCH /api/support/tickets/:id/status

---

## WORKFLOW 7 — User Management (Admin)

1. ADMIN creates staff/courier/agent — POST /api/staff, /api/couriers, /api/agents
2. ADMIN manages agencies — CRUD /api/agencies
3. ADMIN configures tariffs — CRUD /api/tariffs
4. ADMIN freezes accounts — POST /api/compliance/accounts/:id/freeze

---

## WORKFLOW 8 — Finance Operations

1. FINANCE views dashboard — /finance
2. FINANCE manages payments — /finance/payments
3. FINANCE processes refunds — /finance/refunds
4. FINANCE downloads invoices — /finance/invoices

---

## WORKFLOW 9 — Risk and Compliance

1. RISK views alerts — /risk/alerts
2. RISK investigates and resolves alerts
3. RISK manages compliance — /risk/compliance

---

## WORKFLOW 10 — Real-Time Tracking and GPS

1. COURIER GPS sent every 20s — POST /api/logistics/gps/mobile
2. Parcel location auto-updated
3. CLIENT views live tracking map
4. IoT GPS trackers — POST /api/logistics/gps/iot
5. Courier duty toggle — POST /api/couriers/me/duty

---

## Cross-Workflow Interactions

| Trigger             | From             | To                   | Roles           |
| ------------------- | ---------------- | -------------------- | --------------- |
| Parcel created      | Parcel Lifecycle | Payment pricing      | CLIENT, system  |
| Parcel accepted     | Parcel Lifecycle | Auto-assignment      | AGENT, COURIER  |
| Payment confirmed   | Payment          | Pickup unblocked     | CLIENT, COURIER |
| Status changes      | Parcel Lifecycle | Notifications        | system, all     |
| Delivery confirmed  | Delivery         | COD settlement       | COURIER, CLIENT |
| Delivery confirmed  | Delivery         | Invoice generated    | system, CLIENT  |
| GPS stops           | Tracking         | Courier unavailable  | system, ADMIN   |
| Parcel overdue      | Tracking         | Delayed alert        | system, ADMIN   |
| Fraud detected      | Parcel Lifecycle | Risk alerts          | system, RISK    |

---

## Pages Per Role

### Client (12 pages)

Dashboard, Create Parcel, My Parcels, Parcel Detail,
Tracking, Pickups, Payments, Invoices,
Addresses, Support, Notifications, Profile.

### Courier (10 pages)

Dashboard, Pickups, Deliveries, Delivery Detail,
Confirm Delivery, Map, Route Optimization,
Scan Console, Notifications, Profile.

### Agent (11 pages)

Dashboard, Create Parcel, Parcels, Parcel Detail,
Pickups, Map, Live Logistics, GPS,
Route Optimization, Scan Console, Profile.

### Staff (25+ pages)

Dashboard, Parcels, Pickups, Deliveries,
Payments, Support, Tracking, Map,
GPS Trackers, Route Optimization, Analytics,
Scan Console, Notifications, Profile.

### Admin (35+ pages)

Everything Staff has, plus:
User Management (Staff, Agents, Couriers, Clients, Agencies),
Tariff Management, Integrations, USSD,
Self-Healing, Approvals, RBAC Permissions,
Finance Dashboard, Risk Dashboard,
AI Discovery, Advanced Analytics.

### Finance (9 pages)

Dashboard, Payments, Refunds, Invoices,
Exceptions, Map, Analytics, Notifications, Profile.

### Risk (9 pages)

Dashboard, Alerts, Compliance, Cases,
Integrations, Map, Analytics, Notifications, Profile.
