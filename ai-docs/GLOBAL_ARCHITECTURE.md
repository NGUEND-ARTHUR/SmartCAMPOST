# SmartCAMPOST — Global System Architecture

## System Overview

SmartCAMPOST is a full-stack logistics / parcel delivery management platform targeting Cameroon's market. It provides end-to-end parcel shipping workflows: from client self-registration, through physical agency intake, in-transit tracking, home delivery with OTP confirmation, payment, invoicing, and compliance reporting.

---

## Platform Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SmartCAMPOST Platform                           │
├───────────────────┬──────────────────────┬──────────────────────────────┤
│   Web Frontend    │   Flutter Mobile App  │   Backend (Spring Boot)      │
│   React 19 +TS    │   Dart 3.11 / Flutter │   Java 17                    │
│   Vite + Tailwind │   GoRouter + Provider │   Spring Boot 3.5.7          │
│   Zustand + RQ    │   Dio + Secure Store  │   Spring Security + JPA      │
│   7 role UIs      │   7 role UIs          │   MySQL 8 / TiDB Cloud       │
└───────────────────┴──────────────────────┴──────────────────────────────┘
              │                   │                        │
              └───────────────────┴────────────────────────┘
                                  │
                         REST API (JSON + JWT)
                    https://smartcampost-backend.onrender.com/api
```

---

## Backend Architecture

```
Layer               Technology              Responsibility
─────────────────────────────────────────────────────────
Filter Chain        Spring Security         Rate limit, JWT extraction, auth
Controllers         @RestController         HTTP mapping, DTO validation
Services            Interface + Impl        All business logic
Repositories        Spring Data JPA         DB queries (BINARY(16) UUIDs)
Models              JPA @Entity             102 entity classes
Database            MySQL 8 / TiDB Cloud    Persistent storage

Infrastructure:
  JWT Auth          JJWT 0.11.5 / HS256     Stateless sessions
  Google OAuth      google-api-client        ID token verification
  SMS               Twilio                  OTP + notifications
  Payments          MTN Mobile Money         PREPAID + COD flows
  AI                Spring AI + OpenAI       Recommendations + anomaly
  QR Codes          ZXing 3.5.2             Partial + Final QR (HMAC-signed)
  Invoices          PDFBox 2.0.27           PDF generation
  Cache             Caffeine 3.1.8          In-process, 5k entries, 10 min TTL
  Maps              Google Maps Platform     Geocoding + routing
  SSE               Spring WebFlux          Real-time admin scan feed
  USSD              Custom gateway           Feature phone support
```

---

## Frontend Architecture (Web)

```
Layer               Technology              Responsibility
─────────────────────────────────────────────────────────
Router              React Router DOM v7     7 role-prefixed route trees
Auth Guard          ProtectedWrapper        Role-based route protection
Layout              RoleLayout.tsx          Sidebar nav + theme + i18n
Pages               React (lazy-loaded)     50+ page components
Components          Radix + shadcn-style    Reusable UI primitives
State (auth)        Zustand                 JWT + user stored in localStorage
State (server)      React Query             Cached API data, mutations
HTTP                Axios                   Bearer token injected by interceptor
i18n                i18next                 EN/FR translations (270+ keys)
Maps                MapLibre + React Map GL  Cameroon map, tracking, routing
Charts              Recharts                Analytics dashboards
QR                  qrcode.react, html5-qrcode QR display + webcam scan
Export              jsPDF, XLSX             Data export capabilities
```

---

## Mobile Architecture (Flutter)

```
Layer               Technology              Responsibility
─────────────────────────────────────────────────────────
Navigation          GoRouter 14.6.2         Route guards + role redirect
State               Provider (ChangeNotifier) Auth, Parcel, Locale
HTTP                Dio 5.7.0               Bearer token + error interceptors
Storage             Flutter Secure Storage  JWT encrypted at rest
Screens             40+ widgets             7 role-specific UI trees
i18n                Custom JSON-based       EN/FR (270+ keys), default FR
QR Scan             Mobile Scanner 6.0.2    Camera-based QR detection
QR Display          QR Flutter 4.1.0        QR code generation
GPS                 Geolocator 13.0.2       Permission + position acquisition
Auth                Google Sign-In 6.2.2    Google OAuth2 ID token
Maps                flutter_map (installed, UNUSED) —
Offline             Partial model support   No local DB implemented yet
```

---

## Data Flow: Parcel Lifecycle

```
CLIENT (web/mobile)
  │  POST /api/parcels
  ▼
Backend: Creates parcel (CREATED), generates partial QR, creates ScanEvent
  │
AGENT (web/mobile) scans partial QR
  │  POST /api/qr/validate
  │  POST /api/scan-events (ACCEPTED)
  │  POST /api/parcels/{id}/validate-and-lock
  ▼
Backend: Locks parcel, generates final QR
  │
Transit (Agent/Courier)
  │  POST /api/scan-events (IN_TRANSIT, ARRIVED_HUB, ARRIVED_DEST_AGENCY)
  ▼
Backend: Updates parcel.currentLatitude/Longitude, triggers notifications
  │
COURIER (mobile preferred)
  │  POST /api/delivery/otp/send  (SMS to recipient)
  │  POST /api/delivery/otp/verify
  │  POST /api/delivery/proof
  │  POST /api/delivery/complete
  ▼
Backend: parcel.status = DELIVERED, DeliveryReceipt created
  │
FINANCE (web)
  │  Reviews payments, approves refunds
  ▼
RISK/ADMIN (web)
  │  Reviews risk alerts, may freeze accounts
```

---

## Authentication Flow (All Clients)

```
All three clients (web, mobile) share the same backend auth:

1. Phone + Password  →  POST /api/auth/login         →  JWT
2. OTP              →  POST /api/auth/login/otp/*    →  JWT
3. Google OAuth2    →  POST /api/auth/google          →  JWT

JWT Payload:
  sub = user UUID
  phone, role, entityId, email
  HS256 signed, 8h default TTL

JWT Storage:
  Web:     localStorage (Zustand persist)
  Mobile:  FlutterSecureStorage (AES-256 encrypted)

JWT Injection:
  Web:     Axios request interceptor → Authorization: Bearer
  Mobile:  Dio request interceptor  → Authorization: Bearer
```

---

## Third-Party Integration Map

| Service | Used By | Purpose |
|---|---|---|
| Google OAuth2 | All 3 clients | Authentication |
| Google Maps | Backend + Web | Geocoding, route optimization |
| MTN Mobile Money | Backend + Web | Payment gateway |
| Twilio SMS | Backend | OTP + delivery notifications |
| OpenAI | Backend | AI recommendations, anomaly detection |
| Firebase (planned) | Mobile | Push notifications (not yet integrated) |

---

## Deployment Topology

```
Production:
  Backend: Render.com (https://smartcampost-backend.onrender.com)
  Database: TiDB Cloud (MySQL-compatible)
  Frontend: (CDN or Render static hosting)
  Mobile: Android APK / iOS App Store

Development:
  Backend: localhost:8082
  Frontend: localhost:5173–5176 (Vite dev server)
  Mobile: Android emulator (10.0.2.2:8082) / iOS (localhost:8082)
```

---

## Role Architecture

```
                     ADMIN
                    (created by bootstrap or another ADMIN)
                       │
        ┌──────────────┼───────────────┐
        │              │               │
     STAFF          FINANCE          RISK
        │
   ┌────┴────┐
 AGENT    COURIER

CLIENT ← self-registers independently
```

All internal roles (STAFF, AGENT, COURIER, FINANCE, RISK) require ADMIN creation.  
Only CLIENT can self-register.

---

## Key Business Invariants

1. A parcel is immutable after `locked = true` (only ADMIN can override)
2. `ScanEvent.latitude` and `longitude` are NOT NULL — GPS is mandatory
3. Each parcel has at most one `PickupRequest` (UNIQUE constraint)
4. Each `Payment` has at most one `Invoice` (UNIQUE constraint)
5. OTP codes are consumed atomically (single use, prevents replay)
6. Agent is always linked to a Staff (1:1 relationship)
7. `UserAccount.entityId` always points to the correct entity type for the role
8. Frozen accounts are blocked from API access
