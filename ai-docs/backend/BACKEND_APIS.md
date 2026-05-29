# SmartCAMPOST — Backend APIs

This document details every public API surface: request/response shapes, validation rules, and error codes per endpoint group.

---

## Conventions

- All requests/responses: `Content-Type: application/json`
- Authentication: `Authorization: Bearer <JWT>` (except public endpoints)
- Timestamps: ISO 8601 UTC (`2024-01-15T10:30:00Z`)
- IDs: UUID string (`"550e8400-e29b-41d4-a716-446655440000"`)
- Pagination: `?page=0&size=20` (zero-indexed)
- Paginated response envelope:
```json
{
  "content": [...],
  "totalElements": 150,
  "totalPages": 8,
  "number": 0,
  "size": 20,
  "first": true,
  "last": false
}
```

---

## Authentication APIs

### POST `/api/auth/register`
**Access:** Public

**Request:**
```json
{
  "fullName": "Jean Dupont",
  "phone": "+237699000001",
  "email": "jean@example.com",
  "password": "Secret123!",
  "otp": "482910",
  "preferredLanguage": "fr"
}
```

**Validation:**
- `fullName`: required, 2–150 chars
- `phone`: required, E.164 format, unique
- `password`: required, min 8 chars
- `otp`: required, 6 digits, must match a valid unused OTP for `purpose=REGISTER`

**Response 201:**
```json
{
  "token": "eyJhbGci...",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "role": "CLIENT",
  "entityId": "uuid",
  "phone": "+237699000001",
  "email": "jean@example.com"
}
```

**Errors:** `OTP_INVALID`, `OTP_EXPIRED`, `USER_PHONE_ALREADY_EXISTS`

---

### POST `/api/auth/login`
**Access:** Public

**Request:**
```json
{ "phone": "+237699000001", "password": "Secret123!" }
```

**Response 200:** Same as register response

**Errors:** `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED` (423), `AUTH_ACCOUNT_FROZEN` (403)

---

### POST `/api/auth/google`
**Access:** Public

**Request:**
```json
{ "idToken": "<Google ID Token>" }
```

**Response 200:** Same as register response (creates account if first-time)

**Errors:** `AUTH_GOOGLE_TOKEN_INVALID`, `AUTH_GOOGLE_TOKEN_EXPIRED`

---

### POST `/api/auth/send-otp`
**Access:** Public

**Request:**
```json
{ "phone": "+237699000001", "purpose": "REGISTER" }
```

**Purpose values:** `REGISTER`, `LOGIN`, `RESET_PASSWORD`, `DELIVERY`

**Response 200:**
```json
{ "sent": true, "expiresIn": 300 }
```

**Errors:** `OTP_RATE_LIMIT` (429)

---

### POST `/api/auth/login/otp/confirm`
**Access:** Public

**Request:**
```json
{ "phone": "+237699000001", "otp": "482910" }
```

**Response 200:** AuthResponse (same as login)

**Errors:** `OTP_INVALID`, `OTP_EXPIRED`, `OTP_ALREADY_USED`

---

### POST `/api/auth/password/reset/confirm`
**Access:** Public

**Request:**
```json
{
  "phone": "+237699000001",
  "otp": "482910",
  "newPassword": "NewSecret123!"
}
```

**Response 200:** `{ "success": true }`

---

## Parcel APIs

### POST `/api/parcels`
**Access:** CLIENT

**Request:**
```json
{
  "senderAddressId": "uuid",
  "recipientAddressId": "uuid",
  "originAgencyId": "uuid",
  "destinationAgencyId": "uuid",
  "weight": 2.5,
  "dimensions": "30x20x15",
  "declaredValue": 25000,
  "descriptionComment": "Fragile electronics",
  "serviceType": "STANDARD",
  "deliveryOption": "AGENCY",
  "paymentOption": "PREPAID",
  "fragile": true,
  "creationLatitude": 3.848,
  "creationLongitude": 11.502
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "trackingRef": "SCP-20240115-ABCD",
  "status": "CREATED",
  "qrStatus": "PARTIAL",
  "partialQrCode": "data:...",
  "locked": false,
  "weight": 2.5,
  "serviceType": "STANDARD",
  "deliveryOption": "AGENCY",
  "paymentOption": "PREPAID",
  "senderAddress": { "city": "Yaoundé", ... },
  "recipientAddress": { "city": "Douala", ... },
  "originAgency": { "name": "Agency A", ... },
  "destinationAgency": { "name": "Agency B", ... },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### GET `/api/parcels/tracking/{trackingRef}`
**Access:** Public

**Response 200:**
```json
{
  "trackingRef": "SCP-20240115-ABCD",
  "status": "IN_TRANSIT",
  "serviceType": "STANDARD",
  "deliveryOption": "AGENCY",
  "originCity": "Yaoundé",
  "destinationCity": "Douala",
  "expectedDeliveryAt": "2024-01-17T00:00:00Z",
  "scanEvents": [
    {
      "eventType": "CREATED",
      "timestamp": "2024-01-15T10:30:00Z",
      "locationNote": "Yaoundé Centre",
      "latitude": 3.848,
      "longitude": 11.502
    }
  ]
}
```

---

### POST `/api/parcels/{parcelId}/validate-and-lock`
**Access:** AGENT

**Request:**
```json
{
  "validatedWeight": 2.7,
  "validatedDimensions": "32x21x16",
  "validationComment": "Weight matches, minor dimension difference",
  "descriptionConfirmed": true,
  "latitude": 3.848,
  "longitude": 11.502
}
```

**Effect:** Sets `locked=true`, `qrStatus=FINAL`, generates `finalQrCode`

**Response 200:** Full ParcelResponse with `locked=true`

**Errors:** `PARCEL_ALREADY_LOCKED`, `PARCEL_NOT_FOUND`

---

### PATCH `/api/parcels/{parcelId}/admin-override`
**Access:** ADMIN

**Request:**
```json
{
  "reason": "Client requested correction after agency validation error",
  "adminNote": "Exceptional override authorized by supervisor"
}
```

**Effect:** Sets `locked=false`, creates AuditLog entry

---

## Scan Event APIs

### POST `/api/scan-events`
**Access:** Any authenticated user

**Request:**
```json
{
  "parcelId": "uuid",
  "eventType": "IN_TRANSIT",
  "latitude": 3.848,
  "longitude": 11.502,
  "locationSource": "DEVICE_GPS",
  "locationNote": "Bafoussam hub",
  "comment": "Parcel in good condition",
  "proofUrl": "https://storage/proof.jpg",
  "actorId": "uuid",
  "actorRole": "COURIER",
  "deviceTimestamp": "2024-01-15T14:00:00Z",
  "synced": false
}
```

**Required:** `parcelId`, `eventType`, `latitude`, `longitude`

**Response 201:**
```json
{
  "id": "uuid",
  "parcelId": "uuid",
  "eventType": "IN_TRANSIT",
  "timestamp": "2024-01-15T14:00:05Z",
  "latitude": 3.848,
  "longitude": 11.502,
  "locationSource": "DEVICE_GPS",
  "actorRole": "COURIER"
}
```

---

### POST `/api/sync/scan-events` (Offline Sync)
**Access:** Authenticated

**Request:**
```json
[
  {
    "parcelId": "uuid",
    "eventType": "IN_TRANSIT",
    "latitude": 3.848,
    "longitude": 11.502,
    "offlineCreatedAt": "2024-01-15T13:00:00Z",
    "synced": false
  }
]
```

**Response 200:**
```json
{ "synced": 3, "failed": 0, "errors": [] }
```

---

## Delivery APIs

### POST `/api/delivery/otp/request`
**Access:** COURIER

**Request:**
```json
{
  "parcelId": "uuid",
  "recipientPhone": "+237699000002",
  "latitude": 3.848,
  "longitude": 11.502
}
```

**Response 200:**
```json
{ "sent": true, "expiresIn": 300 }
```

**Effect:** Sends 6-digit OTP via SMS to recipient's phone

---

### POST `/api/delivery/otp/verify`
**Access:** COURIER

**Request:**
```json
{
  "parcelId": "uuid",
  "otp": "938271",
  "latitude": 3.848,
  "longitude": 11.502
}
```

**Response 200:**
```json
{ "verified": true, "deliveryId": "uuid" }
```

---

### POST `/api/delivery/proof`
**Access:** COURIER

**Request:**
```json
{
  "parcelId": "uuid",
  "proofType": "PHOTO",
  "proofUrl": "https://storage/delivery-proof-123.jpg",
  "latitude": 3.848,
  "longitude": 11.502
}
```

**proofType values:** `PHOTO`, `SIGNATURE`, `OTP`

---

## Payment APIs

### POST `/api/payments`
**Access:** CLIENT

**Request:**
```json
{
  "parcelId": "uuid",
  "amount": 2500,
  "currency": "XAF",
  "method": "MOBILE_MONEY"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "parcelId": "uuid",
  "amount": 2500,
  "currency": "XAF",
  "method": "MOBILE_MONEY",
  "status": "INIT",
  "timestamp": "2024-01-15T10:30:00Z",
  "externalRef": null
}
```

---

### POST `/api/payments/mtn/callback` (MTN Webhook)
**Access:** Public (webhook from MTN)

Handles payment confirmation/failure callbacks from MTN Mobile Money gateway.
Updates payment status from `PENDING` → `SUCCESS` or `FAILED`.

---

## QR Code APIs

### POST `/api/qr/validate`
**Access:** AGENT

**Request:**
```json
{
  "qrData": "SCP-QR-2024...",
  "latitude": 3.848,
  "longitude": 11.502
}
```

**Response 200:**
```json
{
  "valid": true,
  "parcelId": "uuid",
  "trackingRef": "SCP-20240115-ABCD",
  "qrStatus": "PARTIAL",
  "locked": false
}
```

---

## Admin APIs

### POST `/api/admin/staff`
**Access:** ADMIN

**Request:**
```json
{
  "fullName": "Alice Manager",
  "phone": "+237699000003",
  "email": "alice@smartcampost.cm",
  "password": "TempPass123!",
  "role": "STAFF",
  "agencyId": "uuid"
}
```

**Creates:** Staff entity + UserAccount with appropriate role

**Response 201:**
```json
{
  "id": "uuid",
  "fullName": "Alice Manager",
  "phone": "+237699000003",
  "role": "STAFF",
  "status": "ACTIVE",
  "agencyId": "uuid"
}
```

---

### PATCH `/api/admin/users/{userId}/freeze`
**Access:** ADMIN

**Request:**
```json
{ "reason": "Suspicious activity detected by risk team" }
```

**Response 200:**
```json
{ "frozen": true, "userId": "uuid", "frozenAt": "2024-01-15T10:30:00Z" }
```

**Effect:** Sets `UserAccount.frozen = true`, creates AuditLog entry

---

## Pricing APIs

### GET `/api/pricing/calculate`
**Access:** Authenticated

**Query params:** `weight=2.5&serviceType=STANDARD&originAgencyId=uuid&destinationAgencyId=uuid`

**Response 200:**
```json
{
  "basePrice": 1500,
  "weightSurcharge": 500,
  "totalPrice": 2000,
  "currency": "XAF",
  "serviceType": "STANDARD",
  "estimatedDays": 3
}
```

---

## Dashboard APIs

### GET `/api/dashboard`
**Access:** Any authenticated user

Returns role-adaptive metrics:

**CLIENT Response:**
```json
{
  "totalParcels": 12,
  "inTransit": 3,
  "delivered": 8,
  "pending": 1
}
```

**ADMIN Response:**
```json
{
  "totalParcels": 1520,
  "totalUsers": 340,
  "totalAgencies": 12,
  "totalRevenue": 4500000,
  "assignedPickups": 45,
  "deliveriesToday": 67,
  "pendingIssues": 3
}
```

---

## Risk APIs

### PATCH `/api/risk/alerts/{alertId}/status`
**Access:** RISK

**Request:**
```json
{
  "status": "UNDER_REVIEW",
  "comment": "Investigating transaction patterns"
}
```

**Status values:** `OPEN`, `ACKNOWLEDGED`, `UNDER_REVIEW`, `RESOLVED`, `ESCALATED`

---

## Self-Healing APIs

### GET `/api/self-healing/congestion`
**Access:** ADMIN

**Response 200:**
```json
{
  "congestionAlerts": [
    {
      "agencyId": "uuid",
      "agencyName": "Yaoundé Centre",
      "parcelCount": 450,
      "threshold": 300,
      "severity": "HIGH",
      "suggestedAction": "REDIRECT_TO_BAFOUSSAM_HUB"
    }
  ]
}
```

---

## SSE (Server-Sent Events)

### GET `/api/sse/scan-events`
**Access:** Authenticated via `?token=<jwt>` query param

**Stream:** Real-time `ScanEvent` JSON objects as they are created

**Usage:** Admin dashboard live feed of scan activity across all agencies

---

## AI APIs

### POST `/api/ai/chat`
**Access:** Authenticated

**Request:**
```json
{ "message": "Which parcels are at risk of delay today?" }
```

**Response 200:**
```json
{
  "reply": "Based on current transit data, 3 parcels show delay risk...",
  "recommendedActions": [...]
}
```

---

## Standard Error Response

All errors return:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "code": "OTP_INVALID",
  "message": "The OTP provided is invalid or has expired",
  "path": "/api/auth/verify-otp"
}
```

**HTTP Status Mapping:**
| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error or bad request |
| 401 | Invalid/missing JWT or wrong credentials |
| 403 | Insufficient role or frozen account |
| 404 | Resource not found |
| 409 | Conflict (duplicate, constraint violation) |
| 423 | Account locked |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
