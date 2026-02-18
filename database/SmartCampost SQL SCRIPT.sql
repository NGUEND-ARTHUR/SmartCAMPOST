-- =========================================================
-- SmartCAMPOST - EVOLVED MySQL Schema v2.0
-- For TiDB Cloud (MySQL 8.0 Compatible)
-- Date: 2026-02-18
-- =========================================================
-- This schema CREATES the SmartCAMPOST database from scratch:
-- A. Autonomous AI agents (Courier AI, Agency AI, Risk AI)
-- B. Predictive intelligence (ETA predictions, risk scoring)
-- C. Risk and anomaly detection with audit trails
-- D. Event-driven architecture
-- E. Natural interaction (conversation) support
-- =========================================================

-- =========================================================
-- STEP 1: Run this line FIRST (alone), then select the database
--         from TiDB Cloud dropdown before running the rest
-- =========================================================
CREATE DATABASE IF NOT EXISTS smartcampostDB;

-- =========================================================
-- STEP 2: After creating database, select 'smartcampostDB' from
--         the database dropdown in TiDB Cloud SQL Editor,
--         then run everything below this line
-- =========================================================

-- =========================================================
-- ENUM-LIKE CONVENTIONS (EXTENDED from domain model)
-- =========================================================
-- ServiceType        : 'STANDARD','EXPRESS'
-- ParcelStatus       : 'CREATED','ACCEPTED','TAKEN_IN_CHARGE','IN_TRANSIT','ARRIVED_HUB',
--                      'ARRIVED_DEST_AGENCY','OUT_FOR_DELIVERY','DELIVERED',
--                      'PICKED_UP_AT_AGENCY','RETURNED','RETURNED_TO_SENDER','CANCELLED'
-- PaymentMethod      : 'CASH','MOBILE_MONEY','CARD'
-- PaymentStatus      : 'INIT','PENDING','SUCCESS','FAILED','CANCELLED'
-- PaymentOption      : 'PREPAID','COD'
-- NotificationChannel: 'SMS','EMAIL','PUSH'
-- NotificationStatus : 'PENDING','SENT','FAILED'
-- NotificationType   : (extended list - see notification table)
-- DeliveryProofType  : 'SIGNATURE','PHOTO','OTP'
-- PickupRequestState : 'REQUESTED','ASSIGNED','COMPLETED','CANCELLED'
-- ScanEventType      : (extended list - see scan_event table)
-- StaffStatus        : 'ACTIVE','INACTIVE','SUSPENDED'
-- CourierStatus      : 'AVAILABLE','BUSY','OFFLINE'
-- QrStatus           : 'PARTIAL','FINAL','INVALIDATED'
-- LocationMode       : 'GPS_DEFAULT','MANUAL_OVERRIDE','NO_GPS'
-- LocationSource     : 'DEVICE_GPS','MANUAL','NETWORK','CACHED'
-- RiskAlertType      : 'AML_FLAG','HIGH_VALUE','MULTIPLE_FAILED_PAYMENTS','DELIVERY_DELAY',
--                      'REPEATED_DELIVERY_FAILURE','ANOMALY_DETECTED','FRAUD_SUSPECTED','OTHER'
-- RiskSeverity       : 'LOW','MEDIUM','HIGH','CRITICAL'
-- RiskAlertStatus    : 'OPEN','UNDER_REVIEW','RESOLVED','DISMISSED'
-- AiModuleType       : 'COURIER','AGENCY','RISK','PREDICTIVE','GENERAL'
-- AiSubjectType      : 'COURIER','AGENCY','PARCEL','PAYMENT','CLIENT','SYSTEM'
-- AiActionStatus     : 'PENDING','APPROVED','EXECUTED','REJECTED','EXPIRED'
-- EventCategory      : 'SCAN','STATUS_CHANGE','DELAY','ANOMALY','OVERLOAD','SYSTEM','USER_ACTION'
-- EventProcessingStatus : 'PENDING','PROCESSING','COMPLETED','FAILED'
-- ConversationRole   : 'SYSTEM','USER','ASSISTANT'
-- IntentType         : 'TRACK_PARCEL','DELIVERY_ISSUE','PAYMENT_INQUIRY','ACCOUNT_HELP',
--                      'PICKUP_REQUEST','GENERAL_INQUIRY','ESCALATION','OTHER'
-- =========================================================


-- =========================================================
-- 0) USER_ACCOUNT  (for authentication, any actor)
-- =========================================================
CREATE TABLE user_account (
  id             BINARY(16)    NOT NULL,       -- UUID
  phone          VARCHAR(20)   NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  role           ENUM('CLIENT','AGENT','STAFF','COURIER','ADMIN','FINANCE','RISK') NOT NULL,
  entity_id      BINARY(16)    NOT NULL,       -- points to client/agent/staff/courier
  frozen         BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_account PRIMARY KEY (id),
  CONSTRAINT uq_user_phone UNIQUE (phone)
) ENGINE=InnoDB;


-- =========================================================
-- 1) CLIENT
-- =========================================================
CREATE TABLE client (
  client_id           BINARY(16)    NOT NULL,
  full_name           VARCHAR(150)  NOT NULL,
  phone               VARCHAR(30)   NOT NULL,
  email               VARCHAR(100)  NULL,
  preferred_language  VARCHAR(10)   NULL,
  password_hash       VARCHAR(255)  NOT NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_client PRIMARY KEY (client_id),
  CONSTRAINT uq_client_phone UNIQUE (phone),
  CONSTRAINT uq_client_email UNIQUE (email)
) ENGINE=InnoDB;


-- =========================================================
-- 2) ADDRESS
-- =========================================================
CREATE TABLE address (
  address_id   BINARY(16)    NOT NULL,
  client_id    BINARY(16)    NULL,
  label        VARCHAR(255)  NOT NULL,
  street       VARCHAR(255)  NULL,
  city         VARCHAR(100)  NOT NULL,
  region       VARCHAR(100)  NOT NULL,
  country      VARCHAR(100)  NOT NULL,
  latitude     DECIMAL(9,6)  NULL,
  longitude    DECIMAL(9,6)  NULL,
  CONSTRAINT pk_address PRIMARY KEY (address_id),
  CONSTRAINT fk_address_client
    FOREIGN KEY (client_id) REFERENCES client(client_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_address_client ON address(client_id);


-- =========================================================
-- 3) AGENCY
-- =========================================================
CREATE TABLE agency (
  agency_id     BINARY(16)    NOT NULL,
  agency_name   VARCHAR(150)  NOT NULL,
  agency_code   VARCHAR(50)   NOT NULL,
  city          VARCHAR(100)  NOT NULL,
  region        VARCHAR(100)  NOT NULL,
  country       VARCHAR(100)  NOT NULL DEFAULT 'Cameroon',
  -- AI/Analytics fields
  capacity_limit INT          NULL COMMENT 'Max parcels the agency can handle',
  is_hub        BOOLEAN       NOT NULL DEFAULT FALSE COMMENT 'Is this a major hub',
  CONSTRAINT pk_agency PRIMARY KEY (agency_id),
  CONSTRAINT uq_agency_code UNIQUE (agency_code)
) ENGINE=InnoDB;


-- =========================================================
-- 4) STAFF
-- =========================================================
CREATE TABLE staff (
  staff_id      BINARY(16)    NOT NULL,
  agency_id     BINARY(16)    NULL,
  full_name     VARCHAR(150)  NOT NULL,
  role          VARCHAR(80)   NOT NULL,
  email         VARCHAR(100)  NULL,
  phone         VARCHAR(30)   NULL,
  password_hash VARCHAR(255)  NOT NULL,
  status        ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  hired_at      DATE          NULL,
  terminated_at DATE          NULL,
  CONSTRAINT pk_staff PRIMARY KEY (staff_id),
  CONSTRAINT uq_staff_email UNIQUE (email),
  CONSTRAINT uq_staff_phone UNIQUE (phone),
  CONSTRAINT fk_staff_agency
    FOREIGN KEY (agency_id) REFERENCES agency(agency_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_staff_agency ON staff(agency_id);


-- =========================================================
-- 5) AGENT
-- =========================================================
CREATE TABLE agent (
  agent_id      BINARY(16)    NOT NULL,
  agency_id     BINARY(16)    NULL,
  staff_id      BINARY(16)    NOT NULL,
  staff_number  VARCHAR(50)   NOT NULL,
  full_name     VARCHAR(150)  NOT NULL,
  phone         VARCHAR(30)   NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  status        ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_agent PRIMARY KEY (agent_id),
  CONSTRAINT uq_agent_staff_number UNIQUE (staff_number),
  CONSTRAINT uq_agent_phone UNIQUE (phone),
  CONSTRAINT uq_agent_staff_fk UNIQUE (staff_id),
  CONSTRAINT fk_agent_agency
    FOREIGN KEY (agency_id) REFERENCES agency(agency_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_agent_staff
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX ix_agent_agency ON agent(agency_id);


-- =========================================================
-- 6) COURIER
-- =========================================================
CREATE TABLE courier (
  courier_id    BINARY(16)    NOT NULL,
  agency_id     BINARY(16)    NULL,
  full_name     VARCHAR(150)  NOT NULL,
  phone         VARCHAR(30)   NOT NULL,
  vehicle_id    VARCHAR(50)   NULL,
  password_hash VARCHAR(255)  NOT NULL,
  status        ENUM('AVAILABLE','BUSY','OFFLINE','ON_ROUTE','INACTIVE') NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- AI/Analytics fields
  current_latitude   DECIMAL(10,8) NULL COMMENT 'Last known GPS latitude',
  current_longitude  DECIMAL(11,8) NULL COMMENT 'Last known GPS longitude',
  last_location_at   TIMESTAMP     NULL COMMENT 'Last GPS update timestamp',
  CONSTRAINT pk_courier PRIMARY KEY (courier_id),
  CONSTRAINT uq_courier_phone UNIQUE (phone),
  CONSTRAINT fk_courier_agency
    FOREIGN KEY (agency_id) REFERENCES agency(agency_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_courier_agency ON courier(agency_id);


-- =========================================================
-- 7) PARCEL (EXTENDED with QR, GPS, and validation fields)
-- =========================================================
CREATE TABLE parcel (
  parcel_id             BINARY(16)    NOT NULL,
  tracking_ref          VARCHAR(80)   NOT NULL,
  tracking_number       VARCHAR(80)   NULL COMMENT 'Alias for tracking_ref',
  client_id             BINARY(16)    NOT NULL,
  sender_address_id     BINARY(16)    NOT NULL,
  recipient_address_id  BINARY(16)    NOT NULL,
  origin_agency_id      BINARY(16)    NULL,
  destination_agency_id BINARY(16)    NULL,
  weight                FLOAT         NOT NULL,
  dimensions            VARCHAR(50)   NULL,
  declared_value        FLOAT         NULL,
  is_fragile            BOOLEAN       NOT NULL DEFAULT FALSE,
  service_type          ENUM('STANDARD','EXPRESS') NOT NULL,
  delivery_option       ENUM('AGENCY','HOME') NOT NULL,
  payment_option        ENUM('PREPAID','COD') NOT NULL DEFAULT 'PREPAID',
  status                ENUM('CREATED','ACCEPTED','TAKEN_IN_CHARGE','IN_TRANSIT','ARRIVED_HUB',
                             'ARRIVED_DEST_AGENCY','OUT_FOR_DELIVERY','DELIVERED',
                             'PICKED_UP_AT_AGENCY','RETURNED','RETURNED_TO_SENDER','CANCELLED')
                        NOT NULL DEFAULT 'CREATED',
  photo_url             VARCHAR(255)  NULL,
  description_comment   VARCHAR(1000) NULL COMMENT 'Parcel description from client',
  -- QR Code Two-Step Logic
  qr_status             ENUM('PARTIAL','FINAL','INVALIDATED') NOT NULL DEFAULT 'PARTIAL',
  is_locked             BOOLEAN       NOT NULL DEFAULT FALSE,
  partial_qr_code       VARCHAR(500)  NULL,
  final_qr_code         VARCHAR(500)  NULL,
  -- GPS at creation
  creation_latitude     DECIMAL(10,8) NULL,
  creation_longitude    DECIMAL(11,8) NULL,
  location_mode         ENUM('GPS_DEFAULT','MANUAL_OVERRIDE','NO_GPS') DEFAULT 'GPS_DEFAULT',
  -- Validation fields (Sprint 15)
  validated_weight      FLOAT         NULL,
  validated_dimensions  VARCHAR(50)   NULL,
  validation_comment    VARCHAR(1000) NULL COMMENT 'Agent validation notes',
  description_confirmed BOOLEAN       NULL COMMENT 'Agent confirmed description',
  validated_at          TIMESTAMP     NULL,
  validated_by_staff_id BINARY(16)    NULL,
  -- Timestamps
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_at  TIMESTAMP     NULL,
  CONSTRAINT pk_parcel PRIMARY KEY (parcel_id),
  CONSTRAINT uq_parcel_tracking UNIQUE (tracking_ref),
  CONSTRAINT fk_parcel_client
    FOREIGN KEY (client_id) REFERENCES client(client_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_parcel_sender_addr
    FOREIGN KEY (sender_address_id) REFERENCES address(address_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_parcel_recipient_addr
    FOREIGN KEY (recipient_address_id) REFERENCES address(address_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_parcel_origin_agency
    FOREIGN KEY (origin_agency_id) REFERENCES agency(agency_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_parcel_dest_agency
    FOREIGN KEY (destination_agency_id) REFERENCES agency(agency_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_parcel_validated_by
    FOREIGN KEY (validated_by_staff_id) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_parcel_client   ON parcel(client_id);
CREATE INDEX ix_parcel_status   ON parcel(status);
CREATE INDEX ix_parcel_tracking ON parcel(tracking_ref);
CREATE INDEX ix_parcel_qr_status ON parcel(qr_status);
CREATE INDEX ix_parcel_created_at ON parcel(created_at);


-- =========================================================
-- 8) PICKUP_REQUEST
-- =========================================================
CREATE TABLE pickup_request (
  pickup_id      BINARY(16)   NOT NULL,
  parcel_id      BINARY(16)   NOT NULL,
  courier_id     BINARY(16)   NULL,
  requested_date DATE         NOT NULL,
  time_window    VARCHAR(30)  NOT NULL,
  state          ENUM('REQUESTED','ASSIGNED','COMPLETED','CANCELLED') NOT NULL,
  pickup_latitude  DECIMAL(10,8) NULL,
  pickup_longitude DECIMAL(11,8) NULL,
  location_mode    VARCHAR(30) NULL,
  comment        VARCHAR(255) NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_pickup PRIMARY KEY (pickup_id),
  CONSTRAINT uq_pickup_parcel UNIQUE (parcel_id),
  CONSTRAINT fk_pickup_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pickup_courier
    FOREIGN KEY (courier_id) REFERENCES courier(courier_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_pickup_state   ON pickup_request(state);
CREATE INDEX ix_pickup_courier ON pickup_request(courier_id);


-- =========================================================
-- 9) SCAN_EVENT (EXTENDED with GPS, Actor, Proof fields)
-- =========================================================
CREATE TABLE scan_event (
  scan_id         BINARY(16)   NOT NULL,
  parcel_id       BINARY(16)   NOT NULL,
  agency_id       BINARY(16)   NULL,
  agent_id        BINARY(16)   NULL,
  event_type      ENUM(
                    'CREATED','ACCEPTED','AT_ORIGIN_AGENCY','TAKEN_IN_CHARGE',
                    'IN_TRANSIT','ARRIVED_HUB','DEPARTED_HUB',
                    'ARRIVED_DESTINATION','ARRIVED_DEST_AGENCY',
                    'OUT_FOR_DELIVERY','DELIVERED','PICKED_UP_AT_AGENCY',
                    'RETURNED','RETURNED_TO_SENDER','DELIVERY_FAILED',
                    'RESCHEDULED','CANCELLED',
                    'OTP_SENT','OTP_VERIFIED','PROOF_CAPTURED'
                  ) NOT NULL,
  timestamp       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  location_note   VARCHAR(255) NULL,
  -- GPS fields (MANDATORY)
  latitude        DECIMAL(10,8) NOT NULL DEFAULT 0.0 COMMENT 'GPS latitude',
  longitude       DECIMAL(11,8) NOT NULL DEFAULT 0.0 COMMENT 'GPS longitude',
  location_source ENUM('DEVICE_GPS','MANUAL','NETWORK','CACHED') NOT NULL DEFAULT 'DEVICE_GPS',
  device_timestamp TIMESTAMP   NULL COMMENT 'Timestamp from scanning device',
  -- Actor identification
  actor_id        VARCHAR(64)  NULL COMMENT 'UUID or identifier of actor',
  actor_role      VARCHAR(40)  NULL COMMENT 'AGENT, COURIER, SYSTEM, etc.',
  -- Proof & Comments
  proof_url       VARCHAR(500) NULL COMMENT 'URL to photo/signature proof',
  comment         VARCHAR(1000) NULL COMMENT 'Additional notes',
  -- Legacy/compatibility fields
  source          VARCHAR(50)  NULL COMMENT 'Scan source (APP, SCANNER, etc.)',
  scan_type       VARCHAR(60)  NULL,
  scanned_by      VARCHAR(64)  NULL,
  role            VARCHAR(40)  NULL,
  address         VARCHAR(500) NULL,
  -- Offline sync support
  is_synced       BOOLEAN      NOT NULL DEFAULT TRUE,
  offline_created_at TIMESTAMP  NULL,
  synced_at       TIMESTAMP    NULL,
  CONSTRAINT pk_scan PRIMARY KEY (scan_id),
  CONSTRAINT fk_scan_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_scan_agency
    FOREIGN KEY (agency_id) REFERENCES agency(agency_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_scan_agent
    FOREIGN KEY (agent_id) REFERENCES agent(agent_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_scan_parcel_time ON scan_event(parcel_id, timestamp);
CREATE INDEX ix_scan_agency      ON scan_event(agency_id);
CREATE INDEX ix_scan_agent       ON scan_event(agent_id);
CREATE INDEX ix_scan_type_time   ON scan_event(event_type, timestamp);
CREATE INDEX ix_scan_actor       ON scan_event(actor_id, actor_role);


-- =========================================================
-- 10) DELIVERY_PROOF
-- =========================================================
CREATE TABLE delivery_proof (
  pod_id      BINARY(16)   NOT NULL,
  parcel_id   BINARY(16)   NOT NULL,
  courier_id  BINARY(16)   NULL,
  proof_type  ENUM('SIGNATURE','PHOTO','OTP') NOT NULL,
  timestamp   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details     VARCHAR(255) NULL,
  CONSTRAINT pk_pod PRIMARY KEY (pod_id),
  CONSTRAINT uq_pod_parcel UNIQUE (parcel_id),
  CONSTRAINT fk_pod_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pod_courier
    FOREIGN KEY (courier_id) REFERENCES courier(courier_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;


-- =========================================================
-- 10B) DELIVERY_OTP
-- =========================================================
CREATE TABLE delivery_otp (
  delivery_otp_id BINARY(16)   NOT NULL,
  parcel_id       BINARY(16)   NOT NULL,
  phone_number    VARCHAR(30)  NOT NULL,
  otp_code        VARCHAR(10)  NOT NULL,
  expires_at      TIMESTAMP    NOT NULL,
  consumed        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_delivery_otp PRIMARY KEY (delivery_otp_id),
  CONSTRAINT fk_delivery_otp_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_delivery_otp_parcel   ON delivery_otp(parcel_id);
CREATE INDEX ix_delivery_otp_consumed ON delivery_otp(parcel_id, consumed);


-- =========================================================
-- 11) PAYMENT
-- =========================================================
CREATE TABLE payment (
  payment_id   BINARY(16)   NOT NULL,
  parcel_id    BINARY(16)   NOT NULL,
  amount       FLOAT        NOT NULL,
  currency     VARCHAR(10)  NOT NULL DEFAULT 'XAF',
  method       ENUM('CASH','MOBILE_MONEY','CARD') NOT NULL,
  status       ENUM('INIT','PENDING','SUCCESS','FAILED','CANCELLED')
               NOT NULL DEFAULT 'INIT',
  reversed     BOOLEAN      NOT NULL DEFAULT FALSE,
  timestamp    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  external_ref VARCHAR(100) NULL,
  CONSTRAINT pk_payment PRIMARY KEY (payment_id),
  CONSTRAINT fk_payment_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX ix_payment_parcel ON payment(parcel_id);
CREATE INDEX ix_payment_status ON payment(status);


-- =========================================================
-- 12) INVOICE
-- =========================================================
CREATE TABLE invoice (
  invoice_id      BINARY(16)   NOT NULL,
  payment_id      BINARY(16)   NOT NULL,
  invoice_number  VARCHAR(50)  NOT NULL,
  total_amount    FLOAT        NOT NULL,
  issued_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pdf_link        VARCHAR(255) NULL,
  CONSTRAINT pk_invoice PRIMARY KEY (invoice_id),
  CONSTRAINT uq_invoice_number UNIQUE (invoice_number),
  CONSTRAINT uq_invoice_payment UNIQUE (payment_id),
  CONSTRAINT fk_invoice_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- 13) NOTIFICATION
-- =========================================================
CREATE TABLE notification (
  notification_id  BINARY(16)   NOT NULL,
  parcel_id        BINARY(16)   NULL,
  pickup_id        BINARY(16)   NULL,
  recipient_phone  VARCHAR(30)  NULL,
  recipient_email  VARCHAR(100) NULL,
  channel          ENUM('SMS','EMAIL','PUSH') NOT NULL,
  type             ENUM(
                      'PICKUP_REQUESTED','PICKUP_COMPLETED','PARCEL_DELIVERED','MANUAL',
                      'PARCEL_CREATED','PARCEL_ACCEPTED','PARCEL_STATUS_CHANGE','PARCEL_IN_TRANSIT',
                      'PARCEL_ARRIVED_DESTINATION','PARCEL_OUT_FOR_DELIVERY',
                      'PARCEL_RETURNED','PAYMENT_CONFIRMED','DELIVERY_OPTION_CHANGED',
                      'REMINDER_NOT_COLLECTED','DELIVERY_OTP',
                      'DELIVERY_RESCHEDULED','DELIVERY_ATTEMPT_FAILED',
                      'INVOICE_ISSUED','REFUND_REQUESTED','REFUND_STATUS_UPDATED',
                      'SUPPORT_TICKET_CREATED','SUPPORT_TICKET_REPLIED','SUPPORT_TICKET_STATUS_UPDATED',
                      'RISK_ALERT_UPDATED','RISK_ALERT_RESOLVED',
                      'ACCOUNT_FROZEN','ACCOUNT_UNFROZEN',
                      'DELAY_WARNING','CONGESTION_ALERT','AI_RECOMMENDATION'
                    ) NOT NULL,
  status           ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  subject          VARCHAR(255) NOT NULL,
  message          TEXT         NOT NULL,
  retry_count      INT          NOT NULL DEFAULT 0,
  error_message    VARCHAR(255) NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at          TIMESTAMP    NULL,
  CONSTRAINT pk_notification PRIMARY KEY (notification_id),
  CONSTRAINT fk_notification_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_notification_pickup
    FOREIGN KEY (pickup_id) REFERENCES pickup_request(pickup_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_notif_parcel ON notification(parcel_id);
CREATE INDEX ix_notif_pickup ON notification(pickup_id);
CREATE INDEX ix_notif_type   ON notification(type);
CREATE INDEX ix_notif_status ON notification(status);


-- =========================================================
-- 14) TARIFF
-- =========================================================
CREATE TABLE tariff (
  id               BINARY(16)    NOT NULL,
  service_type     ENUM('STANDARD','EXPRESS') NOT NULL,
  origin_zone      VARCHAR(255)   NOT NULL,
  destination_zone VARCHAR(255)   NOT NULL,
  weight_bracket   VARCHAR(255)   NOT NULL,
  price            DECIMAL(38,2)  NOT NULL,
  CONSTRAINT pk_tariff PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE INDEX ix_tariff_lookup
  ON tariff(service_type, origin_zone, destination_zone, weight_bracket);


-- =========================================================
-- 15) PRICING_DETAIL
-- =========================================================
CREATE TABLE pricing_detail (
  pricing_detail_id BINARY(16)   NOT NULL,
  parcel_id         BINARY(16)   NOT NULL,
  tariff_id         BINARY(16)   NOT NULL,
  applied_price     FLOAT        NOT NULL,
  applied_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_pricing_detail PRIMARY KEY (pricing_detail_id),
  CONSTRAINT fk_pd_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pd_tariff
    FOREIGN KEY (tariff_id) REFERENCES tariff(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_pd_parcel ON pricing_detail(parcel_id, applied_at);
CREATE INDEX ix_pd_tariff ON pricing_detail(tariff_id);


-- =========================================================
-- 16) OTP_CODE
-- =========================================================
CREATE TABLE otp_code (
  otp_id      BINARY(16)   NOT NULL,
  phone       VARCHAR(20)  NOT NULL,
  code        VARCHAR(10)  NOT NULL,
  purpose     ENUM('REGISTER','LOGIN','RESET_PASSWORD') NOT NULL,
  expires_at  TIMESTAMP    NOT NULL,
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_otp_code PRIMARY KEY (otp_id),
  INDEX ix_otp_phone_purpose (phone, purpose, created_at)
) ENGINE=InnoDB;


-- =========================================================
-- 17) SUPPORT_TICKET
-- =========================================================
CREATE TABLE support_ticket (
  ticket_id          BINARY(16)   NOT NULL,
  client_id          BINARY(16)   NULL,
  parcel_id          BINARY(16)   NULL,
  subject            VARCHAR(200) NOT NULL,
  description        TEXT         NOT NULL,
  category           ENUM('COMPLAINT','CLAIM','TECHNICAL','PAYMENT','OTHER') NOT NULL,
  status             ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  priority           ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NULL,
  assigned_staff_id  BINARY(16)   NULL,
  CONSTRAINT pk_support_ticket PRIMARY KEY (ticket_id),
  CONSTRAINT fk_st_client
    FOREIGN KEY (client_id) REFERENCES client(client_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_st_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_st_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_st_client   ON support_ticket(client_id);
CREATE INDEX ix_st_parcel   ON support_ticket(parcel_id);
CREATE INDEX ix_st_status   ON support_ticket(status);
CREATE INDEX ix_st_priority ON support_ticket(priority);


-- =========================================================
-- 18) REFUND_ADJUSTMENT
-- =========================================================
CREATE TABLE refund_adjustment (
  refund_id             BINARY(16)   NOT NULL,
  payment_id            BINARY(16)   NOT NULL,
  type                  ENUM('REFUND','CHARGEBACK','ADJUSTMENT') NOT NULL,
  status                ENUM('REQUESTED','PENDING','APPROVED','REJECTED','COMPLETED','PROCESSED')
                        NOT NULL DEFAULT 'REQUESTED',
  amount                FLOAT        NOT NULL,
  reason                VARCHAR(255) NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at          TIMESTAMP    NULL,
  processed_by_staff_id BINARY(16)   NULL,
  CONSTRAINT pk_refund_adj PRIMARY KEY (refund_id),
  CONSTRAINT fk_refund_adjustment_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_refund_adjustment_staff
    FOREIGN KEY (processed_by_staff_id) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_refund_payment ON refund_adjustment(payment_id);
CREATE INDEX ix_refund_status  ON refund_adjustment(status);


-- =========================================================
-- 18B) REFUND
-- =========================================================
CREATE TABLE refund (
  refund_id             BINARY(16)   NOT NULL,
  payment_id            BINARY(16)   NOT NULL,
  status                ENUM('REQUESTED','APPROVED','REJECTED','PROCESSED') NOT NULL DEFAULT 'REQUESTED',
  amount                FLOAT        NOT NULL,
  reason                VARCHAR(255) NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at          TIMESTAMP    NULL,
  processed_by_staff_id BINARY(16)   NULL,
  CONSTRAINT pk_refund_table PRIMARY KEY (refund_id),
  CONSTRAINT fk_refund_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_refund_staff
    FOREIGN KEY (processed_by_staff_id) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_refund_table_payment ON refund(payment_id);
CREATE INDEX ix_refund_table_status  ON refund(status);


-- =========================================================
-- 19) RISK_ALERT (EXTENDED with new alert types)
-- =========================================================
CREATE TABLE risk_alert (
  risk_alert_id        BINARY(16)   NOT NULL,
  parcel_id            BINARY(16)   NULL,
  payment_id           BINARY(16)   NULL,
  alert_type           ENUM('AML_FLAG','HIGH_VALUE','MULTIPLE_FAILED_PAYMENTS',
                            'DELIVERY_DELAY','REPEATED_DELIVERY_FAILURE',
                            'ANOMALY_DETECTED','FRAUD_SUSPECTED','OTHER') NOT NULL,
  severity             ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  status               ENUM('OPEN','UNDER_REVIEW','RESOLVED','DISMISSED') NOT NULL DEFAULT 'OPEN',
  resolved             BOOLEAN      NOT NULL DEFAULT FALSE,
  description          VARCHAR(500) NULL,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NULL,
  reviewed_by_staff_id BINARY(16)   NULL,
  -- AI-generated context
  ai_confidence_score  FLOAT        NULL COMMENT 'AI confidence in this alert (0-1)',
  ai_reasoning         TEXT         NULL COMMENT 'AI explanation for the alert',
  CONSTRAINT pk_risk_alert PRIMARY KEY (risk_alert_id),
  CONSTRAINT fk_risk_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_risk_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_risk_staff
    FOREIGN KEY (reviewed_by_staff_id) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_risk_status   ON risk_alert(status);
CREATE INDEX ix_risk_severity ON risk_alert(severity);
CREATE INDEX ix_risk_parcel   ON risk_alert(parcel_id);
CREATE INDEX ix_risk_payment  ON risk_alert(payment_id);
CREATE INDEX ix_risk_type     ON risk_alert(alert_type);


-- =========================================================
-- 20) GEOLOCATION_ROUTE_LOG
-- =========================================================
CREATE TABLE geolocation_route_log (
  route_log_id       BINARY(16)   NOT NULL,
  parcel_id          BINARY(16)   NULL,
  origin_lat         DECIMAL(9,6) NULL,
  origin_lng         DECIMAL(9,6) NULL,
  dest_lat           DECIMAL(9,6) NULL,
  dest_lng           DECIMAL(9,6) NULL,
  distance_km        FLOAT        NULL,
  duration_min       INT          NULL,
  provider           VARCHAR(50)  NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_geo_route PRIMARY KEY (route_log_id),
  CONSTRAINT fk_geo_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_geo_parcel ON geolocation_route_log(parcel_id);


-- =========================================================
-- 21) USSD_SESSION
-- =========================================================
CREATE TABLE ussd_session (
  ussd_session_id     BINARY(16)   NOT NULL,
  session_ref         VARCHAR(100) NOT NULL,
  phone               VARCHAR(20)  NOT NULL,
  state               VARCHAR(50)  NOT NULL,
  current_menu        VARCHAR(50)  NOT NULL DEFAULT 'MAIN',
  last_input          VARCHAR(255) NULL,
  active              BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NULL,
  last_interaction_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_ussd_session PRIMARY KEY (ussd_session_id),
  CONSTRAINT uq_ussd_session_ref UNIQUE (session_ref)
) ENGINE=InnoDB;

CREATE INDEX ix_ussd_phone ON ussd_session(phone);


-- =========================================================
-- 22) INTEGRATION_CONFIG
-- =========================================================
CREATE TABLE integration_config (
  integration_id    BINARY(16)   NOT NULL,
  integration_type  ENUM('PAYMENT','SMS','USSD','MAPS','NPSI','ANALYTICS','AI','OTHER') NOT NULL,
  provider_name     VARCHAR(100) NOT NULL,
  base_url          VARCHAR(255) NULL,
  api_key           VARCHAR(255) NULL,
  active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NULL,
  CONSTRAINT pk_integration_config PRIMARY KEY (integration_id)
) ENGINE=InnoDB;

CREATE INDEX ix_integration_type   ON integration_config(integration_type);
CREATE INDEX ix_integration_active ON integration_config(active);


-- =========================================================
-- 23) COMPLIANCE_REPORT
-- =========================================================
CREATE TABLE compliance_report (
  compliance_report_id  BINARY(16)   NOT NULL,
  period_start          DATE         NOT NULL,
  period_end            DATE         NOT NULL,
  generated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by_staff_id BINARY(16)   NULL,
  status                ENUM('GENERATED','SENT','ARCHIVED') NOT NULL DEFAULT 'GENERATED',
  file_url              VARCHAR(255) NULL,
  CONSTRAINT pk_compliance_report PRIMARY KEY (compliance_report_id),
  CONSTRAINT fk_compliance_staff
    FOREIGN KEY (generated_by_staff_id) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_compliance_period ON compliance_report(period_start, period_end);
CREATE INDEX ix_compliance_status ON compliance_report(status);


-- =========================================================
-- 24) QR_VERIFICATION_TOKEN
-- =========================================================
CREATE TABLE qr_verification_token (
  token_id            BINARY(16)    NOT NULL,
  token               VARCHAR(64)   NOT NULL,
  signature           VARCHAR(255)  NOT NULL,
  token_type          ENUM('PERMANENT','TEMPORARY') NOT NULL,
  parcel_id           BINARY(16)    NOT NULL,
  pickup_id           BINARY(16)    NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at          TIMESTAMP     NULL,
  valid               BOOLEAN       NOT NULL DEFAULT TRUE,
  revocation_reason   VARCHAR(255)  NULL,
  verification_count  INT           NOT NULL DEFAULT 0,
  last_verified_at    TIMESTAMP     NULL,
  last_verified_by    BINARY(16)    NULL,
  last_client_ip      VARCHAR(45)   NULL,
  last_user_agent     VARCHAR(255)  NULL,
  CONSTRAINT pk_qr_token PRIMARY KEY (token_id),
  CONSTRAINT uq_qr_token UNIQUE (token),
  CONSTRAINT fk_qr_token_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_qr_token_pickup
    FOREIGN KEY (pickup_id) REFERENCES pickup_request(pickup_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_qr_token_verified_by
    FOREIGN KEY (last_verified_by) REFERENCES user_account(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_qr_token_parcel ON qr_verification_token(parcel_id);
CREATE INDEX ix_qr_token_pickup ON qr_verification_token(pickup_id);
CREATE INDEX ix_qr_token_valid  ON qr_verification_token(valid);
CREATE INDEX ix_qr_token_type   ON qr_verification_token(token_type);


-- =========================================================
-- 25) DELIVERY_ATTEMPT
-- =========================================================
CREATE TABLE delivery_attempt (
  attempt_id      BINARY(16)    NOT NULL,
  parcel_id       BINARY(16)    NOT NULL,
  courier_id      BINARY(16)    NULL,
  attempt_number  INT           NOT NULL,
  result          ENUM('SUCCESS','FAILED_NOT_HOME','FAILED_WRONG_ADDRESS',
                       'FAILED_REFUSED','FAILED_ACCESS_DENIED','FAILED_OTHER') NOT NULL,
  failure_reason  VARCHAR(255)  NULL,
  latitude        DECIMAL(10,8) NULL,
  longitude       DECIMAL(11,8) NULL,
  notes           VARCHAR(500)  NULL,
  attempted_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_delivery_attempt PRIMARY KEY (attempt_id),
  CONSTRAINT fk_attempt_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_attempt_courier
    FOREIGN KEY (courier_id) REFERENCES courier(courier_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_attempt_parcel  ON delivery_attempt(parcel_id);
CREATE INDEX ix_attempt_courier ON delivery_attempt(courier_id);
CREATE INDEX ix_attempt_result  ON delivery_attempt(result);


-- =========================================================
-- 26) DELIVERY_RECEIPT
-- =========================================================
CREATE TABLE delivery_receipt (
  receipt_id             BINARY(16)    NOT NULL,
  parcel_id              BINARY(16)    NOT NULL,
  proof_id               BINARY(16)    NULL,
  receipt_number         VARCHAR(50)   NOT NULL,
  receiver_name          VARCHAR(100)  NULL,
  receiver_signature_url VARCHAR(255)  NULL,
  delivery_address       VARCHAR(500)  NULL,
  courier_name           VARCHAR(100)  NULL,
  total_amount           DOUBLE        NULL,
  payment_collected      BOOLEAN       NOT NULL DEFAULT FALSE,
  payment_method         VARCHAR(30)   NULL,
  pdf_url                VARCHAR(255)  NULL,
  delivered_at           TIMESTAMP     NOT NULL,
  generated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_delivery_receipt PRIMARY KEY (receipt_id),
  CONSTRAINT uq_receipt_parcel UNIQUE (parcel_id),
  CONSTRAINT uq_receipt_number UNIQUE (receipt_number),
  CONSTRAINT fk_receipt_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_receipt_proof
    FOREIGN KEY (proof_id) REFERENCES delivery_proof(pod_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_receipt_number ON delivery_receipt(receipt_number);


-- =========================================================
-- 27) LOCATIONS (Real-time GPS tracking for couriers/agents)
-- =========================================================
CREATE TABLE locations (
  id          BIGINT AUTO_INCREMENT NOT NULL,
  user_id     BIGINT        NULL COMMENT 'courier or agent user ID',
  latitude    DECIMAL(10,8) NULL,
  longitude   DECIMAL(11,8) NULL,
  address     VARCHAR(500)  NULL,
  source      VARCHAR(20)   NULL COMMENT 'GPS or MANUAL',
  timestamp   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_locations PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE INDEX ix_locations_user ON locations(user_id);
CREATE INDEX ix_locations_time ON locations(timestamp);


-- =========================================================
-- =========================================================
--                  NEW AI/AUTONOMOUS TABLES
-- =========================================================
-- =========================================================


-- =========================================================
-- A1) AI_AGENT_RECOMMENDATION
--     Stores AI agent recommendations (Courier AI, Agency AI, Risk AI)
-- =========================================================
CREATE TABLE ai_agent_recommendation (
  recommendation_id  BINARY(16)   NOT NULL,
  module_type        ENUM('COURIER','AGENCY','RISK','PREDICTIVE','GENERAL') NOT NULL,
  subject_type       ENUM('COURIER','AGENCY','PARCEL','PAYMENT','CLIENT','SYSTEM') NOT NULL,
  subject_id         BINARY(16)   NOT NULL COMMENT 'ID of the entity being recommended about',
  summary            VARCHAR(255) NULL COMMENT 'Human-readable summary',
  payload_json       JSON         NOT NULL COMMENT 'Full recommendation payload',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Status tracking
  status             ENUM('PENDING','APPROVED','EXECUTED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  reviewed_at        TIMESTAMP    NULL,
  reviewed_by        BINARY(16)   NULL,
  execution_result   VARCHAR(500) NULL COMMENT 'Result after execution',
  CONSTRAINT pk_ai_recommendation PRIMARY KEY (recommendation_id),
  CONSTRAINT fk_ai_rec_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_ai_rec_module ON ai_agent_recommendation(module_type);
CREATE INDEX ix_ai_rec_subject ON ai_agent_recommendation(subject_type, subject_id);
CREATE INDEX ix_ai_rec_status ON ai_agent_recommendation(status);
CREATE INDEX ix_ai_rec_created ON ai_agent_recommendation(created_at);


-- =========================================================
-- A2) AI_AGENT_STATE
--     Tracks the state and confidence of each AI agent instance
-- =========================================================
CREATE TABLE ai_agent_state (
  agent_state_id     BINARY(16)   NOT NULL,
  module_type        ENUM('COURIER','AGENCY','RISK','PREDICTIVE','GENERAL') NOT NULL,
  subject_type       ENUM('COURIER','AGENCY','PARCEL','PAYMENT','CLIENT','SYSTEM') NOT NULL,
  subject_id         BINARY(16)   NOT NULL,
  confidence_score   FLOAT        NOT NULL DEFAULT 0.5 COMMENT 'Current confidence (0-1)',
  risk_score         FLOAT        NULL COMMENT 'Current risk assessment (0-1)',
  state_data         JSON         NULL COMMENT 'Agent-specific state data',
  last_evaluation_at TIMESTAMP    NULL,
  evaluation_count   INT          NOT NULL DEFAULT 0,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NULL,
  CONSTRAINT pk_ai_agent_state PRIMARY KEY (agent_state_id),
  CONSTRAINT uq_ai_state_subject UNIQUE (module_type, subject_type, subject_id)
) ENGINE=InnoDB;

CREATE INDEX ix_ai_state_module ON ai_agent_state(module_type);
CREATE INDEX ix_ai_state_subject ON ai_agent_state(subject_type, subject_id);
CREATE INDEX ix_ai_state_confidence ON ai_agent_state(confidence_score);


-- =========================================================
-- A3) AI_DECISION_LOG
--     Audit trail of AI agent decisions
-- =========================================================
CREATE TABLE ai_decision_log (
  decision_id        BINARY(16)   NOT NULL,
  module_type        ENUM('COURIER','AGENCY','RISK','PREDICTIVE','GENERAL') NOT NULL,
  decision_type      VARCHAR(100) NOT NULL COMMENT 'Type of decision made',
  subject_type       ENUM('COURIER','AGENCY','PARCEL','PAYMENT','CLIENT','SYSTEM') NOT NULL,
  subject_id         BINARY(16)   NOT NULL,
  input_data         JSON         NULL COMMENT 'Input that triggered the decision',
  decision_outcome   VARCHAR(50)  NOT NULL COMMENT 'The decision made',
  confidence_score   FLOAT        NOT NULL COMMENT 'Confidence in this decision',
  reasoning          TEXT         NULL COMMENT 'Explanation of the decision',
  was_overridden     BOOLEAN      NOT NULL DEFAULT FALSE,
  overridden_by      BINARY(16)   NULL,
  override_reason    VARCHAR(500) NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_ai_decision_log PRIMARY KEY (decision_id),
  CONSTRAINT fk_ai_decision_overridden_by
    FOREIGN KEY (overridden_by) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_ai_decision_module ON ai_decision_log(module_type);
CREATE INDEX ix_ai_decision_subject ON ai_decision_log(subject_type, subject_id);
CREATE INDEX ix_ai_decision_created ON ai_decision_log(created_at);
CREATE INDEX ix_ai_decision_type ON ai_decision_log(decision_type);


-- =========================================================
-- A4) AI_EXECUTION_LOG
--     Logs actual execution of AI-triggered actions
-- =========================================================
CREATE TABLE ai_execution_log (
  execution_id       BINARY(16)   NOT NULL,
  recommendation_id  BINARY(16)   NULL COMMENT 'Link to AI recommendation',
  decision_id        BINARY(16)   NULL COMMENT 'Link to AI decision',
  action_type        VARCHAR(100) NOT NULL COMMENT 'Type of action executed',
  target_type        ENUM('COURIER','AGENCY','PARCEL','PAYMENT','CLIENT','SYSTEM') NOT NULL,
  target_id          BINARY(16)   NULL,
  execution_status   ENUM('STARTED','IN_PROGRESS','COMPLETED','FAILED','ROLLED_BACK') NOT NULL,
  started_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at       TIMESTAMP    NULL,
  result_summary     VARCHAR(500) NULL,
  error_message      TEXT         NULL,
  rollback_data      JSON         NULL COMMENT 'Data for potential rollback',
  CONSTRAINT pk_ai_execution_log PRIMARY KEY (execution_id),
  CONSTRAINT fk_ai_exec_recommendation
    FOREIGN KEY (recommendation_id) REFERENCES ai_agent_recommendation(recommendation_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_ai_exec_decision
    FOREIGN KEY (decision_id) REFERENCES ai_decision_log(decision_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_ai_exec_rec ON ai_execution_log(recommendation_id);
CREATE INDEX ix_ai_exec_decision ON ai_execution_log(decision_id);
CREATE INDEX ix_ai_exec_status ON ai_execution_log(execution_status);
CREATE INDEX ix_ai_exec_started ON ai_execution_log(started_at);


-- =========================================================
-- B1) PREDICTIVE_RESULT
--     Stores prediction results (ETA, risk, congestion, etc.)
-- =========================================================
CREATE TABLE predictive_result (
  prediction_id      BINARY(16)   NOT NULL,
  prediction_type    ENUM('ETA','DELAY_RISK','FAILURE_RISK','CONGESTION','DEMAND') NOT NULL,
  subject_type       ENUM('PARCEL','AGENCY','COURIER','ROUTE') NOT NULL,
  subject_id         BINARY(16)   NULL,
  predicted_value    FLOAT        NULL COMMENT 'Numeric prediction result',
  predicted_timestamp TIMESTAMP   NULL COMMENT 'Predicted time (for ETA)',
  confidence_score   FLOAT        NOT NULL DEFAULT 0.5,
  model_version      VARCHAR(50)  NULL COMMENT 'AI model version used',
  input_features     JSON         NULL COMMENT 'Features used for prediction',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until        TIMESTAMP    NULL COMMENT 'When this prediction expires',
  actual_value       FLOAT        NULL COMMENT 'Actual outcome (for training)',
  actual_timestamp   TIMESTAMP    NULL COMMENT 'Actual time (for training)',
  CONSTRAINT pk_predictive_result PRIMARY KEY (prediction_id)
) ENGINE=InnoDB;

CREATE INDEX ix_pred_type ON predictive_result(prediction_type);
CREATE INDEX ix_pred_subject ON predictive_result(subject_type, subject_id);
CREATE INDEX ix_pred_created ON predictive_result(created_at);
CREATE INDEX ix_pred_valid ON predictive_result(valid_until);


-- =========================================================
-- B2) HISTORICAL_DELIVERY_EVENT
--     Historical data for ML training and heuristics
-- =========================================================
CREATE TABLE historical_delivery_event (
  event_id           BINARY(16)   NOT NULL,
  parcel_id          BINARY(16)   NULL,
  tracking_ref       VARCHAR(80)  NULL,
  origin_agency_id   BINARY(16)   NULL,
  dest_agency_id     BINARY(16)   NULL,
  courier_id         BINARY(16)   NULL,
  service_type       VARCHAR(20)  NULL,
  delivery_option    VARCHAR(20)  NULL,
  distance_km        FLOAT        NULL,
  created_at         TIMESTAMP    NULL,
  accepted_at        TIMESTAMP    NULL,
  first_scan_at      TIMESTAMP    NULL,
  last_scan_at       TIMESTAMP    NULL,
  delivered_at       TIMESTAMP    NULL,
  total_duration_min INT          NULL COMMENT 'Total minutes from creation to delivery',
  transit_duration_min INT        NULL COMMENT 'Minutes in transit',
  num_scan_events    INT          NULL,
  num_delivery_attempts INT       NULL,
  was_delayed        BOOLEAN      NULL,
  delay_minutes      INT          NULL,
  final_status       VARCHAR(40)  NULL,
  weather_condition  VARCHAR(50)  NULL COMMENT 'Weather at delivery time',
  day_of_week        TINYINT      NULL,
  hour_of_day        TINYINT      NULL,
  CONSTRAINT pk_historical_delivery PRIMARY KEY (event_id)
) ENGINE=InnoDB;

CREATE INDEX ix_hist_parcel ON historical_delivery_event(parcel_id);
CREATE INDEX ix_hist_courier ON historical_delivery_event(courier_id);
CREATE INDEX ix_hist_origin ON historical_delivery_event(origin_agency_id);
CREATE INDEX ix_hist_dest ON historical_delivery_event(dest_agency_id);
CREATE INDEX ix_hist_delivered ON historical_delivery_event(delivered_at);


-- =========================================================
-- B3) PERFORMANCE_METRIC
--     Time-based performance indicators
-- =========================================================
CREATE TABLE performance_metric (
  metric_id          BINARY(16)   NOT NULL,
  metric_type        ENUM('DELIVERY_TIME','SUCCESS_RATE','CONGESTION_LEVEL',
                          'COURIER_EFFICIENCY','AGENCY_THROUGHPUT','PREDICTION_ACCURACY') NOT NULL,
  subject_type       ENUM('SYSTEM','AGENCY','COURIER','ROUTE') NOT NULL,
  subject_id         BINARY(16)   NULL,
  period_type        ENUM('HOUR','DAY','WEEK','MONTH') NOT NULL,
  period_start       TIMESTAMP    NOT NULL,
  period_end         TIMESTAMP    NOT NULL,
  metric_value       FLOAT        NOT NULL,
  sample_count       INT          NOT NULL DEFAULT 1,
  metadata           JSON         NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_performance_metric PRIMARY KEY (metric_id)
) ENGINE=InnoDB;

CREATE INDEX ix_perf_type ON performance_metric(metric_type);
CREATE INDEX ix_perf_subject ON performance_metric(subject_type, subject_id);
CREATE INDEX ix_perf_period ON performance_metric(period_type, period_start);


-- =========================================================
-- C1) ANOMALY_EVENT
--     Detected anomalies and escalation tracking
-- =========================================================
CREATE TABLE anomaly_event (
  anomaly_id         BINARY(16)   NOT NULL,
  anomaly_type       ENUM('UNUSUAL_LOCATION','UNUSUAL_TIME','PATTERN_DEVIATION',
                          'SUSPICIOUS_ACTIVITY','SYSTEM_ERROR','DATA_INCONSISTENCY') NOT NULL,
  severity           ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  subject_type       ENUM('PARCEL','COURIER','AGENCY','PAYMENT','SYSTEM') NOT NULL,
  subject_id         BINARY(16)   NULL,
  description        VARCHAR(500) NOT NULL,
  detection_method   VARCHAR(100) NULL COMMENT 'How was this detected',
  raw_data           JSON         NULL COMMENT 'Raw data that triggered detection',
  status             ENUM('DETECTED','INVESTIGATING','CONFIRMED','FALSE_POSITIVE','RESOLVED') NOT NULL DEFAULT 'DETECTED',
  escalation_level   TINYINT      NOT NULL DEFAULT 0 COMMENT '0=none, 1=supervisor, 2=manager, 3=admin',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at    TIMESTAMP    NULL,
  acknowledged_by    BINARY(16)   NULL,
  resolved_at        TIMESTAMP    NULL,
  resolved_by        BINARY(16)   NULL,
  resolution_notes   TEXT         NULL,
  CONSTRAINT pk_anomaly_event PRIMARY KEY (anomaly_id),
  CONSTRAINT fk_anomaly_ack_by
    FOREIGN KEY (acknowledged_by) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_anomaly_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_anomaly_type ON anomaly_event(anomaly_type);
CREATE INDEX ix_anomaly_severity ON anomaly_event(severity);
CREATE INDEX ix_anomaly_status ON anomaly_event(status);
CREATE INDEX ix_anomaly_subject ON anomaly_event(subject_type, subject_id);
CREATE INDEX ix_anomaly_created ON anomaly_event(created_at);


-- =========================================================
-- C2) AUDIT_LOG
--     Comprehensive audit trail (who/what/when)
-- =========================================================
CREATE TABLE audit_log (
  audit_id           BINARY(16)   NOT NULL,
  action_type        VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, ACCESS, etc.',
  entity_type        VARCHAR(50)  NOT NULL COMMENT 'Table/entity name',
  entity_id          BINARY(16)   NULL,
  actor_type         ENUM('USER','AGENT','COURIER','STAFF','SYSTEM','AI') NOT NULL,
  actor_id           VARCHAR(64)  NULL,
  actor_ip           VARCHAR(45)  NULL,
  actor_user_agent   VARCHAR(255) NULL,
  old_values         JSON         NULL COMMENT 'Previous state',
  new_values         JSON         NULL COMMENT 'New state',
  change_summary     VARCHAR(500) NULL,
  timestamp          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  session_id         VARCHAR(100) NULL,
  request_id         VARCHAR(100) NULL COMMENT 'For request tracing',
  CONSTRAINT pk_audit_log PRIMARY KEY (audit_id)
) ENGINE=InnoDB;

CREATE INDEX ix_audit_action ON audit_log(action_type);
CREATE INDEX ix_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX ix_audit_actor ON audit_log(actor_type, actor_id);
CREATE INDEX ix_audit_timestamp ON audit_log(timestamp);


-- =========================================================
-- C3) ESCALATION_HISTORY
--     Tracks escalations of issues/alerts
-- =========================================================
CREATE TABLE escalation_history (
  escalation_id      BINARY(16)   NOT NULL,
  source_type        ENUM('RISK_ALERT','ANOMALY','SUPPORT_TICKET','AI_DECISION') NOT NULL,
  source_id          BINARY(16)   NOT NULL,
  from_level         TINYINT      NOT NULL,
  to_level           TINYINT      NOT NULL,
  escalated_by       BINARY(16)   NULL COMMENT 'NULL if auto-escalated',
  reason             VARCHAR(500) NULL,
  auto_escalated     BOOLEAN      NOT NULL DEFAULT FALSE,
  escalated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_escalation_history PRIMARY KEY (escalation_id),
  CONSTRAINT fk_escalation_by
    FOREIGN KEY (escalated_by) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_escalation_source ON escalation_history(source_type, source_id);
CREATE INDEX ix_escalation_time ON escalation_history(escalated_at);


-- =========================================================
-- D1) SYSTEM_EVENT
--     Unified events table for event-driven architecture
-- =========================================================
CREATE TABLE system_event (
  event_id           BINARY(16)   NOT NULL,
  event_category     ENUM('SCAN','STATUS_CHANGE','DELAY','ANOMALY','OVERLOAD',
                          'SYSTEM','USER_ACTION','AI_ACTION','PAYMENT','NOTIFICATION') NOT NULL,
  event_type         VARCHAR(100) NOT NULL COMMENT 'Specific event type',
  entity_type        VARCHAR(50)  NOT NULL,
  entity_id          BINARY(16)   NULL,
  payload            JSON         NOT NULL COMMENT 'Event data',
  priority           TINYINT      NOT NULL DEFAULT 5 COMMENT '1=highest, 10=lowest',
  processing_status  ENUM('PENDING','PROCESSING','COMPLETED','FAILED','SKIPPED') NOT NULL DEFAULT 'PENDING',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at       TIMESTAMP    NULL,
  processor_id       VARCHAR(100) NULL COMMENT 'ID of the processor that handled this',
  retry_count        TINYINT      NOT NULL DEFAULT 0,
  error_message      TEXT         NULL,
  correlation_id     VARCHAR(100) NULL COMMENT 'For event correlation',
  CONSTRAINT pk_system_event PRIMARY KEY (event_id)
) ENGINE=InnoDB;

CREATE INDEX ix_event_category ON system_event(event_category);
CREATE INDEX ix_event_type ON system_event(event_type);
CREATE INDEX ix_event_entity ON system_event(entity_type, entity_id);
CREATE INDEX ix_event_status ON system_event(processing_status);
CREATE INDEX ix_event_created ON system_event(created_at);
CREATE INDEX ix_event_priority ON system_event(priority, created_at);
CREATE INDEX ix_event_correlation ON system_event(correlation_id);


-- =========================================================
-- D2) EVENT_SUBSCRIPTION
--     Event subscribers for event-driven processing
-- =========================================================
CREATE TABLE event_subscription (
  subscription_id    BINARY(16)   NOT NULL,
  subscriber_name    VARCHAR(100) NOT NULL COMMENT 'Unique subscriber identifier',
  event_category     ENUM('SCAN','STATUS_CHANGE','DELAY','ANOMALY','OVERLOAD',
                          'SYSTEM','USER_ACTION','AI_ACTION','PAYMENT','NOTIFICATION','ALL') NOT NULL,
  event_type_filter  VARCHAR(255) NULL COMMENT 'Regex or comma-separated types',
  active             BOOLEAN      NOT NULL DEFAULT TRUE,
  endpoint_url       VARCHAR(500) NULL COMMENT 'Webhook URL if external',
  handler_class      VARCHAR(255) NULL COMMENT 'Internal handler class',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NULL,
  CONSTRAINT pk_event_subscription PRIMARY KEY (subscription_id),
  CONSTRAINT uq_subscriber_name UNIQUE (subscriber_name)
) ENGINE=InnoDB;

CREATE INDEX ix_sub_category ON event_subscription(event_category);
CREATE INDEX ix_sub_active ON event_subscription(active);


-- =========================================================
-- E1) CONVERSATION
--     Conversation sessions for AI chat/assistant
-- =========================================================
CREATE TABLE conversation (
  conversation_id    BINARY(16)   NOT NULL,
  user_type          ENUM('CLIENT','AGENT','STAFF','COURIER','ADMIN','FINANCE','RISK') NOT NULL,
  user_id            BINARY(16)   NOT NULL,
  channel            ENUM('WEB','MOBILE','USSD','SMS','INTERNAL') NOT NULL,
  status             ENUM('ACTIVE','CLOSED','ESCALATED') NOT NULL DEFAULT 'ACTIVE',
  started_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at    TIMESTAMP    NULL,
  closed_at          TIMESTAMP    NULL,
  escalated_to       BINARY(16)   NULL COMMENT 'Staff ID if escalated',
  context_data       JSON         NULL COMMENT 'Session context',
  CONSTRAINT pk_conversation PRIMARY KEY (conversation_id),
  CONSTRAINT fk_conv_escalated_to
    FOREIGN KEY (escalated_to) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_conv_user ON conversation(user_type, user_id);
CREATE INDEX ix_conv_status ON conversation(status);
CREATE INDEX ix_conv_started ON conversation(started_at);


-- =========================================================
-- E2) CONVERSATION_MESSAGE
--     Individual messages in a conversation
-- =========================================================
CREATE TABLE conversation_message (
  message_id         BINARY(16)   NOT NULL,
  conversation_id    BINARY(16)   NOT NULL,
  role               ENUM('SYSTEM','USER','ASSISTANT') NOT NULL,
  content            TEXT         NOT NULL,
  timestamp          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Intent/entity extraction
  detected_intent    VARCHAR(100) NULL,
  detected_entities  JSON         NULL COMMENT 'Extracted entities',
  -- System action taken
  action_taken       VARCHAR(100) NULL,
  action_result      JSON         NULL,
  -- Metadata
  token_count        INT          NULL,
  processing_time_ms INT          NULL,
  CONSTRAINT pk_conv_message PRIMARY KEY (message_id),
  CONSTRAINT fk_conv_message_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversation(conversation_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_conv_msg_conversation ON conversation_message(conversation_id, timestamp);
CREATE INDEX ix_conv_msg_role ON conversation_message(role);
CREATE INDEX ix_conv_msg_intent ON conversation_message(detected_intent);


-- =========================================================
-- E3) INTENT_ACTION_MAPPING
--     Maps detected intents to system actions
-- =========================================================
CREATE TABLE intent_action_mapping (
  mapping_id         BINARY(16)   NOT NULL,
  intent_name        VARCHAR(100) NOT NULL,
  action_name        VARCHAR(100) NOT NULL,
  required_entities  JSON         NULL COMMENT 'Entities needed for this action',
  response_template  TEXT         NULL,
  is_automated       BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'Can be auto-executed',
  requires_confirmation BOOLEAN   NOT NULL DEFAULT FALSE,
  active             BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT pk_intent_action PRIMARY KEY (mapping_id),
  CONSTRAINT uq_intent_action UNIQUE (intent_name, action_name)
) ENGINE=InnoDB;

CREATE INDEX ix_intent_name ON intent_action_mapping(intent_name);
CREATE INDEX ix_intent_active ON intent_action_mapping(active);


-- =========================================================
-- DONE - SmartCAMPOST Schema Created
-- =========================================================
