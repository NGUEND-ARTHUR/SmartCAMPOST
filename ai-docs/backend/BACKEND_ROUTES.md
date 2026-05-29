# SmartCAMPOST — Backend Routes

All routes are prefixed with `/api`. Security annotations are enforced by `SecurityConfig.java` + `@PreAuthorize` on individual controller methods.

## Access Levels Legend

| Symbol | Meaning |
|---|---|
| 🌐 PUBLIC | No authentication required |
| 🔑 AUTH | Any authenticated user |
| 👤 CLIENT | Role: CLIENT |
| 🧑 AGENT | Role: AGENT |
| 🚚 COURIER | Role: COURIER |
| 🏢 STAFF | Role: STAFF |
| 👑 ADMIN | Role: ADMIN |
| 💰 FINANCE | Role: FINANCE |
| ⚠️ RISK | Role: RISK |

---

## Authentication — `/api/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | 🌐 PUBLIC | Register new client account (with OTP) |
| POST | `/api/auth/login` | 🌐 PUBLIC | Login with phone + password → JWT |
| POST | `/api/auth/google` | 🌐 PUBLIC | Google OAuth2 login/register → JWT |
| POST | `/api/auth/send-otp` | 🌐 PUBLIC | Send OTP to phone number |
| POST | `/api/auth/verify-otp` | 🌐 PUBLIC | Verify OTP code |
| POST | `/api/auth/login/otp/request` | 🌐 PUBLIC | Request OTP for OTP-based login |
| POST | `/api/auth/login/otp/confirm` | 🌐 PUBLIC | Confirm OTP → JWT |
| POST | `/api/auth/password/reset/request` | 🌐 PUBLIC | Request password reset OTP |
| POST | `/api/auth/password/reset/confirm` | 🌐 PUBLIC | Confirm OTP + set new password |

---

## Parcels — `/api/parcels`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/parcels` | 👤 CLIENT | Create parcel (generates partial QR) |
| GET | `/api/parcels/me` | 👤 CLIENT | List own parcels (paginated) |
| GET | `/api/parcels/{parcelId}` | 🔑 AUTH | Get parcel details |
| GET | `/api/parcels/tracking/{trackingRef}` | 🌐 PUBLIC | Public tracking by reference |
| GET | `/api/parcels` | 👑 ADMIN 🏢 STAFF | List all parcels (paginated) |
| PATCH | `/api/parcels/{parcelId}/status` | 🏢 STAFF 🧑 AGENT | Update parcel status |
| PATCH | `/api/parcels/{parcelId}/accept` | 🧑 AGENT | Accept parcel at origin agency |
| PATCH | `/api/parcels/{parcelId}/validate` | 🧑 AGENT | Accept parcel with physical validation |
| PATCH | `/api/parcels/{parcelId}/delivery-option` | 👤 CLIENT | Switch AGENCY ↔ HOME delivery |
| PATCH | `/api/parcels/{parcelId}/metadata` | 👤 CLIENT | Update photo + description comment |
| PATCH | `/api/parcels/{parcelId}/correct` | 👤 CLIENT | Correct parcel before agent validation |
| POST | `/api/parcels/{parcelId}/validate-and-lock` | 🧑 AGENT | Validate + lock + generate final QR |
| GET | `/api/parcels/{parcelId}/can-correct` | 👤 CLIENT | Check if parcel is still correctable |
| PATCH | `/api/parcels/{parcelId}/admin-override` | 👑 ADMIN | Exceptional unlock of locked parcel |

---

## QR Codes — `/api/qr`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/qr/generate-partial` | 👤 CLIENT | Generate partial QR at creation |
| POST | `/api/qr/validate` | 🧑 AGENT | Validate a QR code |
| POST | `/api/qr/generate-final` | 🧑 AGENT | Generate final locked QR |

---

## Scan Events — `/api/scan-events`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/scan-events` | 🔑 AUTH | Record a scan event (with GPS) |
| GET | `/api/scan-events/{parcelId}` | 🔑 AUTH | Full scan history for a parcel |
| GET | `/api/scan-events/{parcelId}/latest` | 🔑 AUTH | Most recent scan event |

---

## Tracking — `/api/track`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/track/{trackingRef}` | 🌐 PUBLIC | Public parcel tracking page data |

---

## Pickup Requests — `/api/pickups`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/pickups` | 👤 CLIENT | Request a home pickup |
| GET | `/api/pickups/{pickupId}` | 🔑 AUTH | Get pickup request details |
| PATCH | `/api/pickups/{pickupId}/state` | 🚚 COURIER 🧑 AGENT | Update pickup state |

---

## Delivery — `/api/delivery`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/delivery/otp/request` | 🚚 COURIER | Generate delivery OTP for recipient |
| POST | `/api/delivery/otp/verify` | 🚚 COURIER | Verify recipient's OTP |
| POST | `/api/delivery/proof` | 🚚 COURIER | Submit proof (photo/signature) |
| POST | `/api/delivery/complete` | 🚚 COURIER | Mark parcel as delivered |

---

## Payments — `/api/payments`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/payments` | 👤 CLIENT | Initiate payment |
| GET | `/api/payments/{paymentId}` | 🔑 AUTH | Get payment status |
| POST | `/api/payments/{paymentId}/verify` | 🔑 AUTH | Verify payment (poll gateway) |
| POST | `/api/payments/{paymentId}/refund` | 👤 CLIENT | Request refund |
| POST | `/api/payments/mtn/**` | 🌐 PUBLIC | MTN MoMo webhook callbacks |

---

## Invoices — `/api/invoices`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/invoices/{invoiceId}` | 🔑 AUTH | Get invoice details |
| GET | `/api/invoices/{invoiceId}/pdf` | 🔑 AUTH | Download invoice PDF |

---

## Clients — `/api/clients`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/clients/me` | 👤 CLIENT | Get own profile |
| PUT | `/api/clients/me` | 👤 CLIENT | Update own profile |
| GET | `/api/clients/{clientId}` | 👑 ADMIN 🏢 STAFF | Get client by ID |
| GET | `/api/clients` | 👑 ADMIN 🏢 STAFF | List all clients |

---

## Staff — `/api/staff`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/staff/me` | 🏢 STAFF | Get own profile |
| GET | `/api/staff` | 👑 ADMIN | List all staff |
| GET | `/api/staff/{staffId}` | 👑 ADMIN | Get staff member |

---

## Agents — `/api/agents`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/agents/me` | 🧑 AGENT | Get own profile |
| GET | `/api/agents` | 👑 ADMIN 🏢 STAFF | List all agents |
| GET | `/api/agents/{agentId}` | 👑 ADMIN 🏢 STAFF | Get agent details |

---

## Couriers — `/api/couriers`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/couriers/me` | 🚚 COURIER | Get own profile |
| PATCH | `/api/couriers/me/location` | 🚚 COURIER | Update GPS location |
| GET | `/api/couriers` | 👑 ADMIN 🏢 STAFF | List all couriers |
| GET | `/api/couriers/{courierId}` | 👑 ADMIN 🏢 STAFF | Get courier details |

---

## Agencies — `/api/agencies`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/agencies` | 🔑 AUTH | List all agencies |
| GET | `/api/agencies/{agencyId}` | 🔑 AUTH | Get agency details |
| POST | `/api/agencies` | 👑 ADMIN | Create agency |
| PUT | `/api/agencies/{agencyId}` | 👑 ADMIN | Update agency |

---

## Addresses — `/api/addresses`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/addresses` | 👤 CLIENT | Create address |
| GET | `/api/addresses` | 👤 CLIENT | List own addresses |
| GET | `/api/addresses/{addressId}` | 🔑 AUTH | Get address |
| DELETE | `/api/addresses/{addressId}` | 👤 CLIENT | Delete address |

---

## Tariffs & Pricing — `/api/tariffs`, `/api/pricing`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/tariffs` | 🔑 AUTH | List active tariffs |
| GET | `/api/tariffs/{tariffId}` | 🔑 AUTH | Get tariff |
| POST | `/api/tariffs` | 👑 ADMIN | Create tariff |
| GET | `/api/pricing/calculate` | 🔑 AUTH | Calculate shipping price |

---

## Admin — `/api/admin`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | 👑 ADMIN | System-wide dashboard metrics |
| GET | `/api/admin/users` | 👑 ADMIN | List all user accounts |
| POST | `/api/admin/staff` | 👑 ADMIN | Create staff account |
| POST | `/api/admin/agents` | 👑 ADMIN | Create agent account |
| POST | `/api/admin/couriers` | 👑 ADMIN | Create courier account |
| PATCH | `/api/admin/users/{userId}/freeze` | 👑 ADMIN | Freeze account (compliance) |
| PATCH | `/api/admin/users/{userId}/unfreeze` | 👑 ADMIN | Unfreeze account |

---

## Dashboard — `/api/dashboard`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard` | 🔑 AUTH | Role-adaptive dashboard metrics |
| GET | `/api/dashboard/client` | 👤 CLIENT | Client-specific dashboard |
| GET | `/api/dashboard/agent` | 🧑 AGENT | Agent-specific dashboard |
| GET | `/api/dashboard/courier` | 🚚 COURIER | Courier-specific dashboard |

---

## Finance — `/api/finance`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/finance/reports` | 💰 FINANCE | Financial reports |
| GET | `/api/finance/payments` | 💰 FINANCE | Payment ledger |
| GET | `/api/finance/refunds` | 💰 FINANCE | Refund ledger |

---

## Risk — `/api/risk`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/risk/alerts` | ⚠️ RISK | List risk alerts |
| GET | `/api/risk/alerts/{alertId}` | ⚠️ RISK | Get alert details |
| PATCH | `/api/risk/alerts/{alertId}/status` | ⚠️ RISK | Update alert status |

---

## Compliance — `/api/compliance`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/compliance/reports` | 👑 ADMIN ⚠️ RISK | List compliance reports |
| POST | `/api/compliance/reports` | 👑 ADMIN | Create compliance report |

---

## Notifications — `/api/notifications`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/notifications` | 🔑 AUTH | List own notifications |
| PATCH | `/api/notifications/{id}/read` | 🔑 AUTH | Mark as read |

---

## Support Tickets — `/api/tickets`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/tickets` | 🔑 AUTH | Create support ticket |
| GET | `/api/tickets/me` | 🔑 AUTH | List own tickets |
| GET | `/api/tickets` | 👑 ADMIN 🏢 STAFF | List all tickets |
| PATCH | `/api/tickets/{ticketId}/status` | 🏢 STAFF | Update ticket status |

---

## Refunds — `/api/refunds`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/refunds` | 👤 CLIENT | Request refund |
| GET | `/api/refunds/{refundId}` | 🔑 AUTH | Get refund status |
| PATCH | `/api/refunds/{refundId}/approve` | 💰 FINANCE | Approve refund |
| PATCH | `/api/refunds/{refundId}/reject` | 💰 FINANCE | Reject refund |

---

## Analytics — `/api/analytics`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/analytics/parcels` | 👑 ADMIN 💰 FINANCE | Parcel volume analytics |
| GET | `/api/analytics/revenue` | 💰 FINANCE | Revenue analytics |
| GET | `/api/analytics/couriers` | 👑 ADMIN 🏢 STAFF | Courier performance |

---

## AI — `/api/ai`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/api/ai/recommendations` | 👑 ADMIN 🏢 STAFF | List AI recommendations |
| PATCH | `/api/ai/recommendations/{id}/approve` | 👑 ADMIN | Approve AI action |
| PATCH | `/api/ai/recommendations/{id}/reject` | 👑 ADMIN | Reject AI action |

---

## Geolocation — `/api/geo`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/geo/route` | 🚚 COURIER | Get optimized route |
| GET | `/api/geo/location` | 🔑 AUTH | Geocode an address |

---

## USSD — `/api/ussd`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/ussd` | 🌐 PUBLIC | USSD gateway webhook handler |

---

## Offline Sync — `/api/sync`

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/sync/scan-events` | 🔑 AUTH | Bulk sync offline scan events |

---

## Actuator — `/actuator`

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/actuator/health` | 👑 ADMIN | Application health check |
| GET | `/actuator/info` | 👑 ADMIN | Application info |
