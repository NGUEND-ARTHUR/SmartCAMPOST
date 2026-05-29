# SmartCAMPOST — Frontend Workflows

## 1. Client Registration

```
User visits /auth/register
1. User enters fullName, phone, email (optional), password, confirmPassword
2. Client-side validation (phone regex, password strength, match)
3. "Send OTP" → POST /api/auth/send-otp { phone, purpose: "REGISTER" }
4. SMS arrives, user enters 6-digit OTP
5. "Create Account" → POST /api/auth/register { fullName, phone, otp, password, ... }
6. On success: authStore.setAuth(user, token) → navigate(/client)
7. On error: toast message with translated error code
```

---

## 2. Login Workflows

### Phone + Password
```
/auth/login
1. Enter phone/email + password
2. Submit → POST /api/auth/login
3. On success: setAuth + navigate(routeByRole)
4. On 423 LOCKED: show "Account locked" with countdown
5. On 403 FROZEN: show "Account frozen, contact support"
```

### OTP Login
```
/auth/login-otp
1. Enter phone → "Send OTP" → POST /api/auth/login/otp/request
2. Enter OTP → "Verify" → POST /api/auth/login/otp/confirm
3. On success: setAuth + navigate(routeByRole)
```

### Google OAuth
```
Both /auth/login and /auth/register
1. Click Google button → Google sign-in popup opens
2. User selects/confirms Google account
3. Google returns credential (idToken)
4. POST /api/auth/google { idToken }
5. On success: setAuth + navigate(routeByRole)
```

---

## 3. Parcel Creation (Client)

```
/client/parcels/create — Multi-step form (4 tabs)

Tab 1 — Addresses:
  - Load saved addresses via GET /api/addresses
  - Select or create sender + recipient addresses
  - Address picker: map-based (LocationPicker) or manual entry

Tab 2 — Parcel Details:
  - Weight (kg), Dimensions, Declared Value (XAF)
  - Fragile toggle, Description/comment

Tab 3 — Service:
  - Service Type: STANDARD | EXPRESS
  - Delivery Option: AGENCY_PICKUP | HOME_DELIVERY
  - Select Origin Agency + Destination Agency
  - Real-time price calculation → GET /api/pricing/calculate

Tab 4 — Payment:
  - Payment Option: PREPAID | COD | MOBILE_MONEY

Submit:
  POST /api/parcels { weight, dimensions, serviceType, deliveryOption,
                     paymentOption, senderAddressId, recipientAddressId,
                     originAgencyId, destinationAgencyId, ... }
  On success: navigate(/client/parcels/{id})
  Backend generates tracking ref + partial QR code
```

---

## 4. Parcel Tracking (Public)

```
/ or /tracking or /client/tracking
1. User enters tracking number or scans QR code (html5-qrcode)
2. GET /api/parcels/tracking/{trackingRef}
3. Shows:
   - Status badge (colored)
   - Route: From city → To city
   - Timeline of scan events (with icons, timestamps, location)
   - Live map marker (if current GPS available)
   - For STAFF/ADMIN: full audit trail section
```

---

## 5. Agent Parcel Intake Workflow

```
/agent/scan → ScanConsole
1. Agent opens QR scanner (camera)
2. Scans parcel's partial QR code
3. Frontend: POST /api/qr/validate { qrData }
4. If valid: shows parcel info (trackingRef, sender, weight)
5. Agent creates intake scan event:
   POST /api/scan-events { parcelId, eventType: "AT_ORIGIN_AGENCY", GPS }
6. Success toast with parcel tracking ref

/agent from AgentDashboard
- Links to scan console for intake
- Shows pending validation count
```

---

## 6. Agent Parcel Validation Workflow

From `StaffDashboard` or scan result:
```
GET /api/parcels?status=CREATED → shows parcels needing validation

For each parcel:
1. Click "Validate & Lock"
2. Dialog opens: confirm/update weight, dimensions, add comment
3. POST /api/parcels/{id}/validate-and-lock
4. Backend: locks parcel, generates final QR
5. Success: status badge updates to ACCEPTED/TAKEN_IN_CHARGE
6. "View QR" button → /admin/parcels/:id/qr (or equivalent role route)
```

---

## 7. Courier Delivery Workflow

```
/courier/deliveries → CourierDeliveries
Shows parcels in OUT_FOR_DELIVERY or ARRIVED_DEST_AGENCY

Click "Start Delivery" (ARRIVED_DEST_AGENCY):
  POST /api/delivery/start { parcelId }

Click "Confirm Delivery" → /courier/deliveries/confirm
  Step 1: Enter recipient phone number
          POST /api/delivery/otp/send { parcelId, phone, GPS }
          SMS sent to recipient

  Step 2: Recipient tells courier the OTP code
          Enter OTP → POST /api/delivery/otp/verify { parcelId, otp, GPS }

  Step 3: Capture proof
          Camera → upload photo → POST /api/delivery/proof { parcelId, type, url, GPS }
          Or signature capture

  Step 4: Complete delivery
          POST /api/delivery/complete { parcelId, GPS }
          Parcel status → DELIVERED
          Success: navigate back to deliveries list
```

---

## 8. Pickup Request Workflow

### Client Requests Pickup
```
/client/pickups → Pickups
"Request Pickup" button → dialog form:
  - Date, Time Window, Address (from saved addresses or map picker)
  POST /api/pickups { parcelId, requestedDate, timeWindow, address, GPS }
  State → REQUESTED
```

### Courier Completes Pickup
```
/courier/pickups → CourierPickups
List of ASSIGNED pickup requests

Click "Confirm Pickup" on a card:
  POST /api/pickups/confirm { pickupId }
  State → COMPLETED
  Creates ScanEvent at origin
```

### Staff Assigns Courier to Pickup
```
/staff/pickups → PickupsManagement
List of REQUESTED pickups

Select courier from dropdown:
  POST /api/pickups/{id}/assign-courier { courierId }
  State → ASSIGNED
```

---

## 9. Payment Workflow

### Client Prepaid
```
/client/payments → ClientPayments
"Pay Now" on a parcel with PREPAID option:
  POST /api/payments { parcelId, amount, method: "MOBILE_MONEY" }
  
MoMo flow:
  Navigate to /mtn or show MTN MoMo payment dialog
  User confirms on phone
  Backend receives webhook → payment.status = SUCCESS
  UI polls GET /api/payments/{id} until SUCCESS
  Invoice auto-generated, shown with download link
```

### COD (Cash on Delivery)
```
No upfront action required by client
Agent/courier marks cash received at delivery:
  POST /api/payments { parcelId, amount, method: "CASH" }
  Status immediately SUCCESS
```

---

## 10. Admin: User Account Creation

```
/admin/users/staff → StaffManagement
"Create Staff" button → dialog form:
  - Full Name, Phone, Email, Password (temp), Role, Agency
  POST /api/admin/staff { ... }
  On success: table refreshes, success toast

Roles available in form:
  STAFF, ADMIN, FINANCE, RISK, COURIER

For agents:
/admin/users/agents → AgentManagement
"Create Agent" → dialog form with staff link, agency, staff number
POST /api/admin/agents { ... }
```

---

## 11. Admin: Account Freeze/Unfreeze

```
/admin/accounts → UserAccountManagement
OR
/risk/alerts → RiskAlerts (freeze from alert context)

"Freeze" button:
  Confirmation dialog with reason field
  PATCH /api/admin/users/{userId}/freeze { reason }
  UserAccount.frozen = true
  All active JWTs for user remain valid up to 8h (backend gap)
  Success toast, table refreshes

"Unfreeze" button:
  PATCH /api/admin/users/{userId}/unfreeze
```

---

## 12. Admin: Tariff Management

```
/admin/tariffs → TariffManagement
"Create Tariff" button → form:
  - Name, Service Type, Origin Zone, Destination Zone
  - Weight Range (from/to), Base Price, Price per Kg, Currency
  POST /api/tariffs { ... }

Edit: click tariff row → pre-filled dialog → PUT /api/tariffs/{id}
Delete: click delete → confirmation → DELETE /api/tariffs/{id}
```

---

## 13. Self-Healing Dashboard

```
/admin/self-healing → SelfHealingDashboard
Auto-refreshes every 30 seconds

GET /api/self-healing/congestion
Shows agency congestion alerts:
  - Agency name, parcel count, threshold, severity
  - Suggested action (e.g., "Redirect to alternative hub")

Click "Execute Action":
  POST /api/self-healing/execute { action, agencyId }
  Confirmation dialog
  Executes: bulk reassign parcels, notify clients
  Success toast
```

---

## 14. QR Code Lifecycle (Frontend)

```
Client creates parcel:
  Backend returns partialQrCode
  QRCodePage shows QRCodeDisplay component with partialQrCode data
  Client can download/print partial QR

Agent validates & locks:
  Backend generates finalQrCode
  QRCodePage shows finalQrCode (locked)
  locked=true indicator shown on parcel detail

Scan:
  QRCodeScanner component (html5-qrcode) captures QR
  POST /api/qr/validate { qrData } → { valid, parcelId }
  On success: pre-fills scan event form
```

---

## 15. Offline Sync (Web)

```
useOfflineSync.ts hook:
- Queues failed scan events in localStorage
- On reconnect (window online event): flushes queue
  POST /api/sync/scan-events [ ...events ]
- Clears queue on success
- Status indicator in UI (ScanConsole shows "N events pending sync")
```

---

## 16. Live Admin Feed (SSE)

```
AdminDashboard → useScanSSE.tsx
Establishes EventSource connection to /api/sse/scan-events?token={jwt}
On each SSE event: pushes scan event to live feed list
Live feed shows: tracking ref, event type, location, timestamp
Auto-scrolls to latest event
On connection error: retries with exponential backoff
```
