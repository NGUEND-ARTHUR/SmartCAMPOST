# SmartCAMPOST — System Workflows (End-to-End)

## WF-01: Client Self-Registration

| Layer | Action |
|---|---|
| **Web/Mobile** | Open registration form, enter name, phone, password |
| **Web/Mobile** | Click "Send OTP" → `POST /api/auth/send-otp { phone, purpose: REGISTER }` |
| **Backend** | Generate 6-digit OTP, store in `otp_code` (5 min TTL), send SMS via Twilio |
| **Web/Mobile** | Enter SMS OTP, submit form → `POST /api/auth/register` |
| **Backend** | Validate OTP (atomic use), create `Client` entity, create `UserAccount (role=CLIENT)`, issue JWT |
| **Web/Mobile** | Store JWT, redirect to `/client` dashboard |

---

## WF-02: Admin Creates Internal Accounts

| Layer | Action |
|---|---|
| **Web (Admin)** | Navigate to `/admin/users/staff` (or agents/couriers) |
| **Web** | Fill create form: fullName, phone, email, temp password, role, agency |
| **Backend** | Verify ADMIN role, create `Staff/Agent/Courier` entity, create `UserAccount`, write `AuditLog` |
| **Web** | Success toast, table refreshes |
| **New Staff/Agent/Courier** | Logs in with phone + temp password, changes password |

---

## WF-03: Parcel Creation & QR Generation

| Layer | Action |
|---|---|
| **Web/Mobile (Client)** | Fill parcel form: addresses, weight, service type, agencies, delivery option |
| **Web/Mobile** | Request GPS permission, capture location |
| **Web/Mobile** | `POST /api/parcels { ... creationLatitude, creationLongitude }` |
| **Backend** | Generate unique `trackingRef` (SCP-YYYYMMDD-XXXX), calculate price via tariff, INSERT parcel (status=CREATED), generate HMAC-signed `partialQrCode`, create `ScanEvent (CREATED)`, trigger CLIENT notification |
| **Web/Mobile** | Show parcel detail with tracking ref + partial QR code |

---

## WF-04: Agency Intake (Agent)

| Layer | Action |
|---|---|
| **Mobile (Agent)** | Open `ScanIntakeScreen`, scan parcel's partial QR |
| **Mobile** | Acquire GPS → `POST /api/scan-events { parcelId, eventType: INTAKE, GPS }` |
| **Backend** | Validate GPS (NOT NULL), INSERT ScanEvent, update `parcel.currentLatitude/Longitude` |
| **Web/Mobile (Agent)** | Navigate to `ParcelValidationScreen`, see CREATED parcel |
| **Web/Mobile (Agent)** | Physical check: weight, dimensions, content match |
| **Agent** | "Validate & Lock" → `POST /api/parcels/{id}/validate-and-lock { validatedWeight, GPS }` |
| **Backend** | Set `locked=true`, `qrStatus=FINAL`, generate `finalQrCode`, create ScanEvent (TAKEN_IN_CHARGE), trigger CLIENT notification (parcel accepted) |

---

## WF-05: In-Transit Tracking

| Layer | Action |
|---|---|
| **Any Actor** | `POST /api/scan-events { parcelId, eventType, GPS }` at each checkpoint |
| **Backend** | INSERT ScanEvent, update parcel status, update parcel.currentLatitude/Longitude, push SSE event to admin feed, trigger notifications |
| **Web (Admin)** | Live scan events appear in AdminDashboard SSE feed |
| **Web/Mobile (Client)** | `GET /api/parcels/tracking/{ref}` shows updated timeline |
| **Public** | `/tracking?ref=SCP-...` shows timeline without auth |

---

## WF-06: Home Delivery (Courier + OTP)

| Layer | Action |
|---|---|
| **Mobile (Courier)** | Open `DeliveryScreen`, find parcel OUT_FOR_DELIVERY |
| **Mobile (Courier)** | Tap "Confirm Delivery" → `DeliveryConfirmationScreen` |
| **Mobile (Courier)** | Enter recipient phone, acquire GPS, tap "Send OTP" |
| **Backend** | Generate 6-digit delivery OTP, store in `delivery_otp`, send SMS to recipient via Twilio |
| **Recipient** | Reads SMS, tells courier the OTP code |
| **Mobile (Courier)** | Enter OTP, acquire GPS, tap "Confirm" → `POST /api/delivery/otp/verify { GPS }` |
| **Backend** | Validate OTP (atomic use), create ScanEvent (OTP_VERIFIED), update parcel |
| **Mobile (Courier)** | Optional: capture proof photo |
| **Backend** | UPDATE parcel.status = DELIVERED, create DeliveryReceipt, trigger DELIVERED notification to client |

---

## WF-07: Agency Pickup (Client Collects at Agency)

| Layer | Action |
|---|---|
| **Client** | Arrives at destination agency with QR code (mobile app or printed) |
| **Agent** | `POST /api/qr/validate { qrData }` → confirms parcel at agency |
| **Agent** | `POST /api/scan-events { eventType: PICKED_UP_AT_AGENCY, GPS }` |
| **Backend** | UPDATE parcel.status = PICKED_UP_AT_AGENCY, trigger notification to client |

---

## WF-08: Payment Flow

### PREPAID
| Layer | Action |
|---|---|
| **Web/Mobile (Client)** | `POST /api/payments { parcelId, method: MOBILE_MONEY }` |
| **Backend** | INSERT payment (INIT), initiate MTN MoMo request via MtnService, status → PENDING |
| **MTN** | Sends push payment request to client's phone |
| **Client** | Confirms payment on phone |
| **MTN** | `POST /api/payments/mtn/callback` webhook |
| **Backend** | Update payment.status = SUCCESS, generate Invoice, trigger payment confirmation notification |

### COD (Cash on Delivery)
| Layer | Action |
|---|---|
| **Agent/Courier** | Collects cash at delivery/pickup |
| **Backend** | `POST /api/payments { method: CASH }` → status = SUCCESS immediately, generate Invoice |

---

## WF-09: Risk Alert Lifecycle

| Layer | Action |
|---|---|
| **Backend (AI/System)** | Detects anomaly (high-value parcel, AML match, location jump) |
| **Backend** | INSERT risk_alert (status=OPEN, aiConfidenceScore, aiReasoning) |
| **Web (Risk)** | `GET /api/risk/alerts` → reviews alerts |
| **Web (Risk)** | May escalate: `PATCH /api/risk/alerts/{id}/status → ESCALATED` |
| **Web (Risk/Admin)** | May freeze user: `PATCH /api/admin/users/{id}/freeze` |
| **Backend** | UserAccount.frozen = true, AuditLog entry |
| **Web (Risk)** | Resolution: `PATCH /api/risk/alerts/{id}/status → RESOLVED` |

---

## WF-10: Refund Flow

| Layer | Action |
|---|---|
| **Web/Mobile (Client)** | `POST /api/refunds { paymentId, reason }` |
| **Backend** | Validate payment SUCCESS, INSERT refund (PENDING) |
| **Web (Finance)** | `GET /api/refunds` → reviews pending refunds |
| **Web (Finance)** | `PATCH /api/refunds/{id}/approve` → initiate reverse transfer |
| **Backend** | refund.status = PROCESSED, payment.reversed = true, trigger notification to client |

---

## WF-11: Self-Healing Congestion

| Layer | Action |
|---|---|
| **Web (Admin)** | `GET /api/self-healing/congestion` (auto-refreshes every 30s) |
| **Backend** | Query agency parcel counts, compare against thresholds, return CongestionAlert list |
| **Web (Admin)** | Reviews suggested actions (e.g., "Redirect to Bafoussam hub") |
| **Web (Admin)** | Clicks "Execute" → `POST /api/self-healing/execute { action, agencyId }` |
| **Backend** | Bulk reassign parcels, notify affected clients, write AuditLog |

---

## WF-12: Offline Scan Sync (Mobile — Future)

| Layer | Action |
|---|---|
| **Mobile (Agent/Courier)** | Scans QR while offline → stores event locally with `synced=false` |
| **Background worker** | Detects network restoration |
| **Mobile** | `POST /api/sync/scan-events [ ...events ]` |
| **Backend** | Deduplicates by parcelId + offlineCreatedAt, processes in order, returns `{ synced, failed }` |

> Note: Local DB not yet implemented. This is the planned flow.

---

## Cross-Cutting Concerns

| Concern | Implementation |
|---|---|
| Audit trail | Every state change writes to `AuditLog` (actor, IP, old/new JSON) |
| Notifications | Every parcel status change triggers `Notification` (SMS/email/in-app) |
| GPS | Every ScanEvent mandatorily carries latitude + longitude |
| i18n | All 3 clients support EN/FR; backend messages also i18n-ready |
| Rate limiting | Auth endpoints: 10 req/min/IP; General: 60 req/min/IP |
| Idempotency | OTP codes consumed atomically; delivery OTP single-use |
