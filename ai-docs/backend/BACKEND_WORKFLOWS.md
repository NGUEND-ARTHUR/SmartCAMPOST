# SmartCAMPOST — Backend Workflows

This document describes the complete business workflows from a backend perspective — the sequence of API calls, state transitions, and side-effects for each major process.

---

## 1. Client Registration Workflow

```
Client → POST /api/auth/send-otp (purpose=REGISTER)
    Backend: generates 6-digit OTP, stores in otp_code (expires 5 min), sends SMS via Twilio

Client → POST /api/auth/register (phone, password, OTP, fullName)
    Backend:
    1. Validate OTP (must be unused, unexpired, purpose=REGISTER)
    2. Mark OTP as used (atomic)
    3. Check phone not already in user_account
    4. BCrypt encode password
    5. INSERT INTO client (fullName, phone, email, ...)
    6. INSERT INTO user_account (phone, passwordHash, role=CLIENT, entityId=client.id)
    7. Generate JWT
    Return: AuthResponse { token, role=CLIENT, entityId }
```

**State after:** Client + UserAccount created, JWT issued, client can immediately use the system.

---

## 2. Internal Account Creation (Admin creates Staff/Agent/Courier)

```
Admin → POST /api/admin/staff (fullName, phone, email, password, role, agencyId)
    Backend:
    1. Verify caller has ADMIN role (@PreAuthorize)
    2. Check phone not already registered
    3. BCrypt encode temporary password
    4. INSERT INTO staff (fullName, phone, email, agencyId, status=ACTIVE)
    5. INSERT INTO user_account (phone, passwordHash, role=STAFF/ADMIN/FINANCE/RISK, entityId=staff.id)
    6. Log to audit_log
    Return: Staff DTO
```

For **Agent:**
- Requires an existing `Staff` record (`staff_id`)
- Creates `Agent` + `UserAccount` (role=AGENT)

For **Courier:**
- Creates `Courier` + `UserAccount` (role=COURIER)

---

## 3. Parcel Creation Workflow

```
Client → POST /api/parcels
    Backend:
    1. Extract clientId from JWT (entityId)
    2. Validate sender/recipient address IDs belong to this client
    3. Validate agency IDs exist
    4. Generate unique tracking reference (SCP-YYYYMMDD-XXXX)
    5. Calculate pricing via PricingService (weight × tariff)
    6. INSERT INTO parcel (status=CREATED, qrStatus=PARTIAL, locked=false)
    7. Generate partial QR code (HMAC-signed, contains trackingRef + client signature)
    8. Store partialQrCode on parcel
    9. Create ScanEvent (type=CREATED, GPS coords from request)
    10. Trigger notification (PARCEL_CREATED) to client phone/email
    Return: ParcelResponse with partialQrCode
```

---

## 4. Parcel Acceptance & Validation Workflow (Agent)

```
Step A — Agent scans partial QR at intake counter:
Agent → POST /api/qr/validate (qrData, latitude, longitude)
    Backend:
    1. HMAC-verify QR signature
    2. Extract trackingRef, look up parcel
    3. Confirm parcel.status = CREATED
    Return: { valid:true, parcelId, trackingRef, qrStatus=PARTIAL }

Step B — Agent physically validates parcel:
Agent → PATCH /api/parcels/{parcelId}/validate (validatedWeight, dims, comment)
    Backend:
    1. Verify caller is AGENT (@PreAuthorize)
    2. Confirm parcel not already locked
    3. Update parcel (validatedWeight, validatedDimensions, validatedBy, validatedAt)
    4. Update parcel.status = ACCEPTED
    5. Create ScanEvent (type=ACCEPTED, GPS)

Step C — Agent generates final QR and locks parcel:
Agent → POST /api/parcels/{parcelId}/validate-and-lock (GPS)
    Backend:
    1. Confirm parcel.status = ACCEPTED
    2. Generate finalQrCode (new HMAC token, links to validated parcel snapshot)
    3. Set parcel.locked = true, parcel.qrStatus = FINAL
    4. Create ScanEvent (type=TAKEN_IN_CHARGE, GPS)
    5. Trigger notification (PARCEL_ACCEPTED) to client
    Return: ParcelResponse { locked=true, qrStatus=FINAL, finalQrCode }
```

**After this point:** Parcel data is immutable. Only ADMIN can override.

---

## 5. Parcel Correction Workflow (Client, before lock)

```
Client → GET /api/parcels/{parcelId}/can-correct
    Backend: Returns true if parcel.locked=false AND parcel.status=CREATED

Client → PATCH /api/parcels/{parcelId}/correct (weight, dimensions, description, etc.)
    Backend:
    1. Check parcel.locked=false (else 400 PARCEL_ALREADY_LOCKED)
    2. Check parcel.status=CREATED (else 400 PARCEL_CANNOT_CORRECT)
    3. Update parcel fields
    4. Create AuditLog entry (before/after values)
    Return: Updated ParcelResponse
```

---

## 6. In-Transit Tracking Workflow

```
At each physical checkpoint, staff/agent/courier records a scan:

Actor → POST /api/scan-events (parcelId, eventType, GPS, actorRole, comment)
    Backend:
    1. Validate parcel exists
    2. Validate GPS coords present (NOT NULL)
    3. Insert ScanEvent record
    4. Update parcel.currentLatitude, currentLongitude, locationUpdatedAt
    5. Update parcel.status based on eventType mapping:
       AT_ORIGIN_AGENCY    → status stays or updates
       IN_TRANSIT          → IN_TRANSIT
       ARRIVED_HUB         → ARRIVED_HUB
       ARRIVED_DESTINATION → ARRIVED_DEST_AGENCY
       OUT_FOR_DELIVERY    → OUT_FOR_DELIVERY
    6. Trigger appropriate notification to client

Typical status path:
CREATED → ACCEPTED → TAKEN_IN_CHARGE → IN_TRANSIT → ARRIVED_HUB →
→ IN_TRANSIT → ARRIVED_DEST_AGENCY → OUT_FOR_DELIVERY → DELIVERED
```

---

## 7. Home Delivery Workflow (Courier)

```
Step A — Courier picks up parcel from destination agency:
Courier → POST /api/scan-events (parcelId, eventType=TAKEN_IN_CHARGE, GPS)

Step B — Courier arrives at recipient address:
Courier → POST /api/delivery/otp/request (parcelId, recipientPhone, GPS)
    Backend:
    1. Generate 6-digit OTP (purpose=DELIVERY, expires 10 min)
    2. Store in delivery_otp table
    3. Send SMS to recipientPhone via Twilio
    4. Create ScanEvent (type=OTP_SENT)

Step C — Recipient provides OTP to courier:
Courier → POST /api/delivery/otp/verify (parcelId, otp, GPS)
    Backend:
    1. Validate OTP (not expired, not used)
    2. Mark OTP as used (atomic)
    3. Create ScanEvent (type=OTP_VERIFIED, GPS)

Step D — Courier captures proof:
Courier → POST /api/delivery/proof (parcelId, proofType=PHOTO, proofUrl, GPS)
    Backend:
    1. Insert delivery_proof record
    2. Create ScanEvent (type=PROOF_CAPTURED)

Step E — Mark as delivered:
Courier → POST /api/delivery/complete (parcelId, GPS)
    Backend:
    1. Update parcel.status = DELIVERED
    2. Create ScanEvent (type=DELIVERED, GPS)
    3. Trigger DELIVERED notification to client
    4. Generate DeliveryReceipt
    Return: ParcelResponse { status=DELIVERED }
```

---

## 8. Agency Pickup Workflow (Client picks up from agency)

```
Client arrives at agency, agent verifies:
Agent → POST /api/qr/validate (client's QR code / tracking ref)
    Backend: Validates QR, confirms parcel at agency

Agent → POST /api/scan-events (parcelId, eventType=PICKED_UP_AT_AGENCY, GPS)
    Backend:
    1. Insert scan event
    2. Update parcel.status = PICKED_UP_AT_AGENCY
    3. Trigger notification to client
```

---

## 9. Home Pickup Request Workflow

```
Client → POST /api/pickups (parcelId, requestedDate, timeWindow, address, GPS)
    Backend:
    1. Validate parcel.status = CREATED (pickup only valid before dropoff)
    2. Check no existing pickup for this parcel (UNIQUE constraint)
    3. Insert pickup_request (state=REQUESTED)
    4. Trigger notification to admin/courier

Admin/Staff → PATCH /api/pickups/{pickupId}/state (state=ASSIGNED, courierId)
    Backend:
    1. Set pickup_request.state = ASSIGNED
    2. Set pickup_request.courier_id = courierId
    3. Notify courier of new assignment

Courier → PATCH /api/pickups/{pickupId}/state (state=COMPLETED, GPS)
    Backend:
    1. Set pickup_request.state = COMPLETED
    2. Create ScanEvent (type=CREATED or AT_ORIGIN_AGENCY)
    3. Update parcel appropriately
    4. Notify client pickup completed
```

---

## 10. Payment Workflow

```
Scenario A — PREPAID (client pays upfront):
Client → POST /api/payments (parcelId, amount, method=MOBILE_MONEY)
    Backend:
    1. Insert payment (status=INIT)
    2. Initiate MTN MoMo request via MtnService
    3. Update payment.status = PENDING, set externalRef

MTN → POST /api/payments/mtn/callback (webhook)
    Backend:
    1. Verify webhook signature
    2. Find payment by externalRef
    3. If SUCCESS: payment.status = SUCCESS, generate Invoice, trigger notification
    4. If FAILED: payment.status = FAILED, trigger failure notification

Scenario B — COD (cash on delivery):
    Payment is created with method=CASH by agent/courier at delivery time
    payment.status = SUCCESS immediately
    Invoice generated
```

---

## 11. Refund Workflow

```
Client → POST /api/refunds (paymentId, reason)
    Backend:
    1. Validate payment.status = SUCCESS
    2. Validate payment not already reversed
    3. Insert refund (status=PENDING)
    4. Trigger notification to finance team

Finance → PATCH /api/refunds/{refundId}/approve
    Backend:
    1. Set refund.status = APPROVED
    2. Set payment.reversed = true
    3. Initiate reverse transfer to client (MTN/manual)
    4. Set refund.status = PROCESSED
    5. Trigger notification to client
```

---

## 12. Risk Alert Workflow

```
Automatic trigger (AI/system):
    AI detects anomaly → INSERT into risk_alert (status=OPEN, aiConfidenceScore)

Risk Officer → GET /api/risk/alerts → reviews alerts

Risk Officer → PATCH /api/risk/alerts/{alertId}/status (status=UNDER_REVIEW)

Risk Officer → PATCH /api/admin/users/{userId}/freeze (if fraud confirmed)
    Backend:
    1. UserAccount.frozen = true
    2. AuditLog entry
    3. Notification to compliance

Risk Officer → PATCH /api/risk/alerts/{alertId}/status (status=RESOLVED)
```

---

## 13. Offline Scan Sync Workflow

```
Mobile device offline (e.g., courier in poor signal area):
    App creates ScanEvent locally with synced=false, offlineCreatedAt=device timestamp
    Events queued in local storage

Device regains connectivity:
Courier → POST /api/sync/scan-events (array of queued events)
    Backend:
    1. Process events in offlineCreatedAt order
    2. For each event:
       - Skip if already synced (dedup by parcelId + offlineCreatedAt)
       - Insert ScanEvent with synced=true, syncedAt=now
       - Update parcel status accordingly
    3. Return { synced: N, failed: M, errors: [...] }
```

---

## 14. Admin Bootstrap Workflow

```
Application startup (DefaultAdminBootstrap.java):
1. Read ADMIN_PHONE, ADMIN_PASSWORD, ADMIN_FULLNAME, ADMIN_EMAIL from env
2. If any blank → skip silently
3. If UserAccount with ADMIN_PHONE already exists → skip
4. INSERT INTO staff (fullName, email, status=ACTIVE, role=ADMIN)
5. INSERT INTO user_account (phone, passwordHash=BCrypt(ADMIN_PASSWORD),
   role=ADMIN, entityId=staff.id)
6. Log masked phone (****XXXX)
```

---

## 15. Self-Healing / Congestion Detection Workflow

```
Admin → GET /api/self-healing/congestion
    Backend (SelfHealingService):
    1. Query all agencies with parcel counts
    2. Compare counts against configured thresholds
    3. Flag agencies exceeding threshold (e.g., >300 parcels pending)
    4. Generate suggested actions (redirect routes, reassign couriers)
    Return: CongestionAlert list with suggestedAction

Admin → POST /api/self-healing/execute (action, agencyId)
    Backend:
    1. Execute action (e.g., bulk reassign parcels to alternative agency)
    2. Create AuditLog entry
    3. Trigger notifications to affected clients (route change)
```

---

## 16. AI Recommendation Workflow

```
Background job / trigger:
    AI module runs analysis (delay predictions, route optimization)
    INSERT INTO ai_agent_recommendation (status=PENDING, payloadJson, aiConfidenceScore)

Admin → GET /api/ai/recommendations (status=PENDING)

Admin → PATCH /api/ai/recommendations/{id}/approve
    Backend:
    1. Set recommendation.status = APPROVED
    2. Execute recommended action (assign courier, re-route, etc.)
    3. Set recommendation.status = EXECUTED, executionResult
    4. AuditLog entry

Admin → PATCH /api/ai/recommendations/{id}/reject
    Backend: Set recommendation.status = REJECTED
```

---

## Status Transition State Machine (Parcel)

```
                    ┌─────────────────────────────────────┐
                    │            PARCEL STATUS             │
                    └─────────────────────────────────────┘
                              │
                    [Client creates]
                              │
                         CREATED
                              │
                    [Agent accepts]
                              │
                         ACCEPTED
                              │
                 [Agent validates & locks]
                              │
                    TAKEN_IN_CHARGE
                              │
                    [Transit to hub]
                              │
                       IN_TRANSIT
                              │
                    [Hub receives]
                              │
                       ARRIVED_HUB
                              │
                    [Hub departs]
                              │
                       IN_TRANSIT
                              │
                  [Arrives destination]
                              │
                  ARRIVED_DEST_AGENCY
                         /        \
                [HOME delivery]   [AGENCY pickup]
                        /              \
              OUT_FOR_DELIVERY     PICKED_UP_AT_AGENCY
                        │
                [OTP + Proof + Complete]
                        │
                    DELIVERED

Exceptional paths:
   Any status → CANCELLED (admin)
   OUT_FOR_DELIVERY → RETURNED_TO_SENDER (failed delivery x3)
   Any status → RETURNED (client withdrawal)
```
