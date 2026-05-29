# SmartCAMPOST — Backend Database

## Technology

| Property | Value |
|---|---|
| Engine | MySQL 8.0 (TiDB Cloud compatible) |
| ORM | Spring Data JPA / Hibernate |
| ID Strategy | UUID stored as `BINARY(16)` |
| Time Zone | Instant (UTC epoch) for all timestamps |
| Charset | UTF-8 |

---

## Core Entity Relationship Overview

```
UserAccount ──────────────────────────────────────────────┐
  ├── entityId → Client (role = CLIENT)                    │
  ├── entityId → Staff  (role = STAFF / ADMIN / FINANCE / RISK)
  ├── entityId → Agent  (role = AGENT)                     │
  └── entityId → Courier (role = COURIER)                  │
                                                           │
Client ──┬── Parcel (many parcels per client)              │
         └── Address (many addresses per client)           │
                                                           │
Parcel ──┬── ScanEvent (many events, ordered by timestamp) │
         ├── PickupRequest (0..1, unique constraint)        │
         ├── Payment (many)                                 │
         │     └── Invoice (1..1, unique)                  │
         ├── Notification (many)                           │
         ├── DeliveryOtp (0..1)                            │
         ├── DeliveryProof (0..1)                          │
         ├── RiskAlert (many, nullable FK)                  │
         ├── Address senderAddress (FK)                    │
         ├── Address recipientAddress (FK)                 │
         ├── Agency originAgency (FK, nullable)            │
         └── Agency destinationAgency (FK, nullable)       │
                                                           │
Agency ──┬── Staff (many)                                  │
         ├── Agent (many)                                  │
         └── Courier (many)                                │
                                                           │
Agent ──── Staff (1:1 link — Agent is a Staff sub-entity)  │
```

---

## Table Definitions

### `user_account`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BINARY(16) | PK, NOT NULL | UUID |
| `phone` | VARCHAR(20) | UNIQUE, NOT NULL | Login identifier |
| `email` | VARCHAR(255) | UNIQUE, nullable | Optional |
| `password_hash` | VARCHAR(255) | nullable | null for Google-only accounts |
| `auth_provider` | ENUM | NOT NULL | `LOCAL`, `GOOGLE` |
| `google_id` | VARCHAR(255) | UNIQUE, nullable | Google `sub` claim |
| `role` | ENUM | NOT NULL | `CLIENT`, `AGENT`, `COURIER`, `STAFF`, `ADMIN`, `FINANCE`, `RISK` |
| `entity_id` | BINARY(16) | NOT NULL | Links to Client/Staff/Agent/Courier |
| `frozen` | BOOLEAN | NOT NULL, default false | Compliance freeze flag |
| `created_at` | DATETIME(6) | NOT NULL | UTC instant |

**Indexes:** `phone`, `email`, `google_id`, `entity_id`

---

### `client`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `full_name` | VARCHAR(150) | NOT NULL |
| `phone` | VARCHAR(30) | UNIQUE |
| `email` | VARCHAR(100) | UNIQUE |
| `preferred_language` | VARCHAR(10) | nullable |
| `password_hash` | VARCHAR(255) | nullable (legacy, auth via user_account) |
| `created_at` | DATETIME(6) | NOT NULL |

---

### `staff`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `agency_id` | BINARY(16) | FK → agency, nullable |
| `full_name` | VARCHAR(150) | NOT NULL |
| `role` | VARCHAR(80) | Flexible role string (e.g. "MANAGER", "SUPPORT") |
| `email` | VARCHAR(100) | UNIQUE |
| `phone` | VARCHAR(30) | UNIQUE |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `status` | ENUM | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `hired_at` | DATE | nullable |
| `terminated_at` | DATE | nullable |

---

### `agent`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `agency_id` | BINARY(16) | FK → agency, nullable |
| `staff_id` | BINARY(16) | FK → staff, UNIQUE (1:1) |
| `staff_number` | VARCHAR(50) | UNIQUE |
| `full_name` | VARCHAR(150) | — |
| `phone` | VARCHAR(30) | UNIQUE |
| `status` | ENUM | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `created_at` | DATETIME(6) | — |

---

### `courier`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `agency_id` | BINARY(16) | FK → agency, nullable |
| `full_name` | VARCHAR(150) | NOT NULL |
| `phone` | VARCHAR(30) | UNIQUE, NOT NULL |
| `vehicle_id` | VARCHAR(50) | nullable |
| `status` | ENUM | `AVAILABLE`, `BUSY`, `ON_ROUTE`, `INACTIVE`, `OFFLINE` |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `current_latitude` | DECIMAL(10,8) | nullable (live GPS) |
| `current_longitude` | DECIMAL(11,8) | nullable (live GPS) |
| `last_location_at` | DATETIME(6) | nullable |
| `created_at` | DATETIME(6) | — |

---

### `address`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `client_id` | BINARY(16) | FK → client, nullable |
| `label` | VARCHAR(100) | e.g. "Home", "Office" |
| `line1` | VARCHAR(255) | Street address |
| `city` | VARCHAR(100) | — |
| `region` | VARCHAR(100) | — |
| `country` | VARCHAR(100) | — |
| `latitude` | DECIMAL(10,8) | nullable |
| `longitude` | DECIMAL(11,8) | nullable |

---

### `agency`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `name` | VARCHAR(150) | NOT NULL |
| `city` | VARCHAR(100) | — |
| `region` | VARCHAR(100) | — |
| `address` | VARCHAR(255) | — |
| `phone` | VARCHAR(30) | — |
| `latitude` | DECIMAL(10,8) | nullable |
| `longitude` | DECIMAL(11,8) | nullable |
| `active` | BOOLEAN | default true |

---

### `parcel` *(Core entity)*

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BINARY(16) | PK | — |
| `tracking_ref` | VARCHAR(80) | UNIQUE, NOT NULL | Public tracking code |
| `tracking_number` | VARCHAR(80) | — | Alias for tracking_ref |
| `qr_status` | ENUM | — | `PARTIAL`, `FINAL`, `INVALIDATED` |
| `locked` | BOOLEAN | default false | Locked after final QR |
| `partial_qr_code` | VARCHAR(255) | — | Client-generated QR data |
| `final_qr_code` | VARCHAR(255) | — | Agent-validated QR data |
| `client_id` | BINARY(16) | FK → client, NOT NULL | — |
| `sender_address_id` | BINARY(16) | FK → address, NOT NULL | — |
| `recipient_address_id` | BINARY(16) | FK → address, NOT NULL | — |
| `origin_agency_id` | BINARY(16) | FK → agency, nullable | — |
| `destination_agency_id` | BINARY(16) | FK → agency, nullable | — |
| `weight` | FLOAT | — | kg |
| `dimensions` | VARCHAR(50) | — | e.g. "30x20x15" |
| `declared_value` | FLOAT | — | XAF |
| `fragile` | BOOLEAN | default false | — |
| `service_type` | ENUM | — | `STANDARD`, `EXPRESS` |
| `delivery_option` | ENUM | — | `AGENCY`, `HOME` |
| `payment_option` | ENUM | — | `PREPAID`, `COD` |
| `status` | ENUM | NOT NULL | See ParcelStatus enum below |
| `photo_url` | VARCHAR(255) | — | Photo attachment |
| `description_comment` | VARCHAR(1000) | — | Client description |
| `creation_latitude` | DOUBLE | — | GPS at creation |
| `creation_longitude` | DOUBLE | — | GPS at creation |
| `location_mode` | ENUM | — | `GPS_DEFAULT`, `MANUAL_OVERRIDE`, `NO_GPS` |
| `current_latitude` | DOUBLE | — | Denormalized last location |
| `current_longitude` | DOUBLE | — | Denormalized last location |
| `location_updated_at` | DATETIME(6) | — | When GPS last updated |
| `validated_weight` | DOUBLE | — | Agent-confirmed weight |
| `validated_dimensions` | VARCHAR(50) | — | Agent-confirmed dimensions |
| `validation_comment` | VARCHAR(255) | — | Agent notes on validation |
| `description_confirmed` | BOOLEAN | — | Agent confirmed content |
| `validated_at` | DATETIME(6) | — | Timestamp of validation |
| `validated_by_id` | BINARY(16) | FK → staff, nullable | Who validated |
| `created_at` | DATETIME(6) | NOT NULL | — |
| `expected_delivery_at` | DATETIME(6) | — | ETA |

**Indexes:** `client_id`, `status`, `tracking_ref`, `qr_status`, `created_at`, `origin_agency_id`, `destination_agency_id`

**ParcelStatus Enum Values:**
`CREATED → ACCEPTED → TAKEN_IN_CHARGE → IN_TRANSIT → ARRIVED_HUB → ARRIVED_DEST_AGENCY → OUT_FOR_DELIVERY → DELIVERED`

Also: `PICKED_UP_AT_AGENCY`, `RETURNED_TO_SENDER`, `RETURNED`, `CANCELLED`

---

### `scan_event`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | BINARY(16) | PK | — |
| `parcel_id` | BINARY(16) | FK → parcel, NOT NULL | — |
| `agency_id` | BINARY(16) | FK → agency, nullable | — |
| `agent_id` | BINARY(16) | FK → agent, nullable | — |
| `event_type` | ENUM | NOT NULL | See ScanEventType |
| `timestamp` | DATETIME(6) | NOT NULL | Server time |
| `location_note` | VARCHAR(255) | — | Human-readable location |
| `latitude` | DECIMAL(10,8) | NOT NULL | Mandatory GPS |
| `longitude` | DECIMAL(11,8) | NOT NULL | Mandatory GPS |
| `location_source` | ENUM | — | `DEVICE_GPS`, `MANUAL`, `NETWORK`, `CACHED` |
| `device_timestamp` | DATETIME(6) | — | Client device clock |
| `actor_id` | VARCHAR(64) | — | UUID of performer |
| `actor_role` | VARCHAR(50) | — | `AGENT`, `COURIER`, `SYSTEM` |
| `proof_url` | VARCHAR(500) | — | Photo/signature URL |
| `comment` | VARCHAR(1000) | — | Free-text notes |
| `source` | VARCHAR(50) | — | `APP`, `SCANNER`, `USSD` |
| `synced` | BOOLEAN | — | Offline sync flag |
| `offline_created_at` | DATETIME(6) | — | Offline creation time |
| `synced_at` | DATETIME(6) | — | When synced |

**Indexes:** `parcel_id + timestamp`, `event_type`, `actor_id`, `agency_id`, `synced`

---

### `pickup_request`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `parcel_id` | BINARY(16) | FK → parcel, NOT NULL, UNIQUE |
| `courier_id` | BINARY(16) | FK → courier, nullable |
| `requested_date` | DATE | NOT NULL |
| `time_window` | VARCHAR(30) | NOT NULL |
| `state` | ENUM | `REQUESTED`, `ASSIGNED`, `COMPLETED`, `CANCELLED` |
| `pickup_latitude` | DOUBLE | — |
| `pickup_longitude` | DOUBLE | — |
| `location_mode` | ENUM | — |
| `comment` | VARCHAR(255) | — |
| `created_at` | DATETIME(6) | — |

---

### `payment`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `parcel_id` | BINARY(16) | FK → parcel, NOT NULL |
| `amount` | FLOAT | — |
| `currency` | VARCHAR(10) | default 'XAF' |
| `method` | ENUM | `CASH`, `MOBILE_MONEY`, `CARD` |
| `status` | ENUM | `INIT`, `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED` |
| `reversed` | BOOLEAN | default false |
| `timestamp` | DATETIME(6) | NOT NULL |
| `external_ref` | VARCHAR(100) | — |

**Indexes:** `parcel_id`, `status`, `external_ref`

---

### `invoice`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `payment_id` | BINARY(16) | FK → payment, NOT NULL, UNIQUE |
| `invoice_number` | VARCHAR(50) | UNIQUE |
| `total_amount` | FLOAT | — |
| `issued_at` | DATETIME(6) | NOT NULL |
| `pdf_link` | VARCHAR(255) | S3/storage URL |

---

### `otp_code`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `phone` | VARCHAR(20) | NOT NULL |
| `code` | VARCHAR(10) | NOT NULL |
| `purpose` | ENUM | `REGISTER`, `LOGIN`, `RESET_PASSWORD`, `DELIVERY` |
| `expires_at` | DATETIME(6) | NOT NULL |
| `used` | BOOLEAN | NOT NULL |
| `created_at` | DATETIME(6) | NOT NULL |

**Indexes:** `phone + purpose + used`, `expires_at`

---

### `delivery_otp`

| Column | Type | Notes |
|---|---|---|
| `id` | BINARY(16) | PK |
| `parcel_id` | BINARY(16) | FK → parcel |
| `code` | VARCHAR(10) | 6-digit code |
| `recipient_phone` | VARCHAR(30) | — |
| `expires_at` | DATETIME(6) | — |
| `used` | BOOLEAN | — |
| `created_at` | DATETIME(6) | — |

---

### `delivery_proof`

| Column | Type | Notes |
|---|---|---|
| `id` | BINARY(16) | PK |
| `parcel_id` | BINARY(16) | FK → parcel |
| `proof_type` | ENUM | `SIGNATURE`, `PHOTO`, `OTP` |
| `proof_url` | VARCHAR(500) | Signature/photo URL |
| `captured_at` | DATETIME(6) | — |
| `captured_by_id` | BINARY(16) | FK → courier |
| `latitude` | DECIMAL(10,8) | GPS at proof |
| `longitude` | DECIMAL(11,8) | GPS at proof |

---

### `notification`

| Column | Type | Constraints |
|---|---|---|
| `id` | BINARY(16) | PK |
| `parcel_id` | BINARY(16) | FK → parcel, nullable |
| `pickup_request_id` | BINARY(16) | FK → pickup_request, nullable |
| `recipient_phone` | VARCHAR(30) | — |
| `recipient_email` | VARCHAR(100) | — |
| `channel` | ENUM | `SMS`, `EMAIL`, `PUSH`, `IN_APP` |
| `type` | ENUM | See NotificationType |
| `status` | ENUM | `PENDING`, `SENT`, `FAILED`, `READ` |
| `subject` | VARCHAR(255) | — |
| `message` | TEXT | NOT NULL |
| `error_message` | VARCHAR(255) | — |
| `retry_count` | INT | default 0 |
| `created_at` | DATETIME(6) | NOT NULL |
| `sent_at` | DATETIME(6) | — |
| `read_at` | DATETIME(6) | — |

---

### `audit_log`

| Column | Type | Notes |
|---|---|---|
| `id` | BINARY(16) | PK |
| `action_type` | VARCHAR(100) | e.g. "PARCEL_STATUS_UPDATED" |
| `entity_type` | VARCHAR(50) | e.g. "Parcel" |
| `entity_id` | BINARY(16) | — |
| `actor_type` | ENUM | `SYSTEM`, `USER`, `ADMIN`, `AGENT` |
| `actor_id` | VARCHAR(64) | UUID or system identifier |
| `actor_ip` | VARCHAR(45) | IPv4/IPv6 |
| `actor_user_agent` | VARCHAR(255) | — |
| `old_values` | LONGTEXT | JSON snapshot before |
| `new_values` | LONGTEXT | JSON snapshot after |
| `change_summary` | VARCHAR(500) | Human-readable summary |
| `timestamp` | DATETIME(6) | NOT NULL |
| `session_id` | VARCHAR(100) | — |
| `request_id` | VARCHAR(100) | — |

---

### `risk_alert`

| Column | Type | Notes |
|---|---|---|
| `id` | BINARY(16) | PK |
| `parcel_id` | BINARY(16) | FK → parcel, nullable |
| `payment_id` | BINARY(16) | FK → payment, nullable |
| `alert_type` | ENUM | `FRAUD`, `AML_MATCH`, `DUPLICATE_PARCEL`, `HIGH_VALUE`, etc. |
| `severity` | ENUM | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | ENUM | `OPEN`, `ACKNOWLEDGED`, `UNDER_REVIEW`, `RESOLVED`, `ESCALATED` |
| `resolved` | BOOLEAN | — |
| `description` | VARCHAR(500) | — |
| `ai_confidence_score` | FLOAT | 0.0–1.0 |
| `ai_reasoning` | TEXT | AI explanation |
| `reviewed_by_staff_id` | BINARY(16) | FK → staff |
| `created_at` | DATETIME(6) | NOT NULL |
| `updated_at` | DATETIME(6) | — |

---

### `support_ticket`

| Column | Type | Notes |
|---|---|---|
| `id` | BINARY(16) | PK |
| `client_id` | BINARY(16) | FK → client |
| `parcel_id` | BINARY(16) | FK → parcel, nullable |
| `category` | ENUM | `DELIVERY_ISSUE`, `PAYMENT_ISSUE`, `ACCOUNT_ISSUE`, etc. |
| `subject` | VARCHAR(255) | — |
| `description` | TEXT | — |
| `status` | ENUM | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REOPENED` |
| `assigned_to_id` | BINARY(16) | FK → staff |
| `created_at` | DATETIME(6) | — |
| `updated_at` | DATETIME(6) | — |

---

### `refund`

| Column | Type | Notes |
|---|---|---|
| `id` | BINARY(16) | PK |
| `payment_id` | BINARY(16) | FK → payment |
| `amount` | FLOAT | — |
| `reason` | VARCHAR(500) | — |
| `status` | ENUM | `PENDING`, `APPROVED`, `REJECTED`, `PROCESSED` |
| `approved_by_id` | BINARY(16) | FK → staff |
| `created_at` | DATETIME(6) | — |
| `processed_at` | DATETIME(6) | — |

---

### `ai_agent_recommendation`

| Column | Type | Notes |
|---|---|---|
| `id` | BINARY(16) | PK |
| `module_type` | ENUM | `PREDICTION`, `RECOMMENDATION`, `ANOMALY_DETECTION`, `ROUTING_OPTIMIZATION` |
| `subject_type` | ENUM | `PARCEL`, `COURIER`, `AGENT`, `DELIVERY`, `PAYMENT` |
| `subject_id` | BINARY(16) | Entity being recommended for |
| `summary` | VARCHAR(255) | — |
| `payload_json` | LONGTEXT | Full AI response JSON |
| `status` | ENUM | `PENDING`, `APPROVED`, `REJECTED`, `EXECUTED` |
| `reviewed_at` | DATETIME(6) | — |
| `reviewed_by_id` | BINARY(16) | FK → staff |
| `execution_result` | VARCHAR(500) | — |
| `created_at` | DATETIME(6) | NOT NULL |

---

### `tariff`

| Column | Type | Notes |
|---|---|---|
| `id` | BINARY(16) | PK |
| `name` | VARCHAR(100) | — |
| `service_type` | ENUM | `STANDARD`, `EXPRESS` |
| `weight_from` | DOUBLE | kg range start |
| `weight_to` | DOUBLE | kg range end |
| `base_price` | DOUBLE | XAF |
| `price_per_kg` | DOUBLE | XAF |
| `active` | BOOLEAN | — |
| `created_at` | DATETIME(6) | — |

---

## Key Constraints & Business Rules

1. **One Pickup Per Parcel:** `pickup_request.parcel_id` has a UNIQUE constraint
2. **One Invoice Per Payment:** `invoice.payment_id` has a UNIQUE constraint
3. **Agent is linked to Staff:** `agent.staff_id` is UNIQUE (one-to-one)
4. **Parcel Immutability After Lock:** `parcel.locked = true` blocks further edits (enforced in service layer)
5. **OTP Single Use:** `otp_code.used` boolean, set atomically in a transaction
6. **Mandatory GPS on Scan:** `scan_event.latitude` and `longitude` are NOT NULL
7. **UserAccount entityId:** Must always match a valid entity of the corresponding role type

---

## Caching

| Cache Key | Data | TTL |
|---|---|---|
| FAQ data | Static FAQ content | 10 min |
| Pricing | Tariff lookup results | 10 min |
| Agency data | Active agency list | 10 min |
| Tariff list | Active tariffs | 10 min |

Cache: Caffeine (in-memory, 5,000 entry max). Not shared across instances.
