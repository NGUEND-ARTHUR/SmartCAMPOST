-- =========================================================
-- SmartCAMPOST • MySQL schema (UUID = BINARY(16), TIMESTAMP)
-- =========================================================

DROP DATABASE IF EXISTS smartcampost;
CREATE DATABASE smartcampost
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE smartcampost;

-- =========================================================
-- ENUM-LIKE CONVENTIONS (from the domain model)
--   ServiceType        : 'STANDARD','EXPRESS'
--   ParcelStatus       : 'CREATED','ACCEPTED','IN_TRANSIT','ARRIVED_HUB',
--                        'OUT_FOR_DELIVERY','DELIVERED','RETURNED','CANCELLED'
--   PaymentMethod      : 'CASH','MOBILE_MONEY','CARD'
--   PaymentStatus      : 'INIT','PENDING','SUCCESS','FAILED','CANCELLED'
--   PaymentOption      : 'PREPAID','COD'
--   NotificationChannel: 'SMS','EMAIL','PUSH'
--   NotificationStatus : 'PENDING','SENT','FAILED'
--   NotificationType   : 'PICKUP_REQUESTED','PICKUP_COMPLETED','PARCEL_DELIVERED','MANUAL',
--                        'PARCEL_CREATED','PARCEL_ACCEPTED','PARCEL_IN_TRANSIT',
--                        'PARCEL_ARRIVED_DESTINATION','PARCEL_OUT_FOR_DELIVERY',
--                        'PARCEL_RETURNED','PAYMENT_CONFIRMED','DELIVERY_OPTION_CHANGED',
--                        'REMINDER_NOT_COLLECTED','DELIVERY_OTP'
--   DeliveryProofType  : 'SIGNATURE','PHOTO','OTP'
--   PickupRequestState : 'REQUESTED','ASSIGNED','COMPLETED','CANCELLED'
--   ScanEventType      : 'CREATED','AT_ORIGIN_AGENCY','IN_TRANSIT','ARRIVED_HUB',
--                        'DEPARTED_HUB','ARRIVED_DESTINATION',
--                        'OUT_FOR_DELIVERY','DELIVERED','RETURNED'
--   StaffStatus / AgentStatus : 'ACTIVE','INACTIVE','SUSPENDED'
--   CourierStatus      : 'AVAILABLE','BUSY','OFFLINE'
--   SupportCategory    : 'COMPLAINT','CLAIM','TECHNICAL','PAYMENT','OTHER'
--   SupportTicketStatus: 'OPEN','IN_PROGRESS','RESOLVED','CLOSED'
--   SupportPriority    : 'LOW','MEDIUM','HIGH','URGENT'
--   RefundType         : 'REFUND','CHARGEBACK','ADJUSTMENT'
--   RefundStatus       : 'REQUESTED','PENDING','APPROVED','REJECTED','COMPLETED','PROCESSED'
--   RiskAlertType      : 'AML_FLAG','HIGH_VALUE','MULTIPLE_FAILED_PAYMENTS','OTHER'
--   RiskSeverity       : 'LOW','MEDIUM','HIGH','CRITICAL'
--   RiskAlertStatus    : 'OPEN','UNDER_REVIEW','RESOLVED','DISMISSED'
--   IntegrationType    : 'PAYMENT','SMS','USSD','MAPS','NPSI','ANALYTICS','OTHER'
--   ComplianceStatus   : 'GENERATED','SENT','ARCHIVED'
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
  frozen         BOOLEAN       NOT NULL DEFAULT FALSE,   -- 🔥 account freeze flag
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_account PRIMARY KEY (id),
  CONSTRAINT uq_user_phone UNIQUE (phone)
) ENGINE=InnoDB;


-- =========================================================
-- 1) CLIENT
-- =========================================================
CREATE TABLE client (
  client_id           BINARY(16)    NOT NULL,             -- UUID
  full_name           VARCHAR(150)  NOT NULL,
  phone               VARCHAR(30)   NOT NULL,
  email               VARCHAR(100)  NULL,
  preferred_language  VARCHAR(10)   NULL,                 -- 'FR','EN',...
  password_hash       VARCHAR(255)  NOT NULL,             -- for client login
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_client PRIMARY KEY (client_id),
  CONSTRAINT uq_client_phone UNIQUE (phone),
  CONSTRAINT uq_client_email UNIQUE (email)
) ENGINE=InnoDB;


-- =========================================================
-- 2) ADDRESS
-- =========================================================
CREATE TABLE address (
  address_id   BINARY(16)    NOT NULL,        -- UUID
  client_id    BINARY(16)    NULL,
  label        VARCHAR(255)  NOT NULL,        -- e.g. "Home", "Office"
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
  agency_id     BINARY(16)    NOT NULL,       -- UUID
  agency_name   VARCHAR(150)  NOT NULL,
  agency_code   VARCHAR(50)   NOT NULL,
  city          VARCHAR(100)  NOT NULL,
  region        VARCHAR(100)  NOT NULL,
  country       VARCHAR(100)  NOT NULL DEFAULT 'Cameroon',
  CONSTRAINT pk_agency PRIMARY KEY (agency_id),
  CONSTRAINT uq_agency_code UNIQUE (agency_code)
) ENGINE=InnoDB;


-- =========================================================
-- 4) STAFF
-- =========================================================
CREATE TABLE staff (
  staff_id      BINARY(16)    NOT NULL,        -- UUID
  full_name     VARCHAR(150)  NOT NULL,
  role          VARCHAR(80)   NOT NULL,        -- e.g. 'ADMIN','MANAGER','CASHIER','FINANCE'
  email         VARCHAR(100)  NULL,
  phone         VARCHAR(30)   NULL,
  password_hash VARCHAR(255)  NOT NULL,        -- for staff login if needed
  status        ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  hired_at      DATE          NULL,
  terminated_at DATE          NULL,
  CONSTRAINT pk_staff PRIMARY KEY (staff_id),
  CONSTRAINT uq_staff_email UNIQUE (email),
  CONSTRAINT uq_staff_phone UNIQUE (phone)
) ENGINE=InnoDB;


-- =========================================================
-- 5) AGENT
-- =========================================================
CREATE TABLE agent (
  agent_id      BINARY(16)    NOT NULL,        -- UUID
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
  courier_id    BINARY(16)    NOT NULL,   -- UUID
  full_name     VARCHAR(150)  NOT NULL,
  phone         VARCHAR(30)   NOT NULL,
  vehicle_id    VARCHAR(50)   NULL,
  password_hash VARCHAR(255)  NOT NULL,
  status        ENUM('AVAILABLE','BUSY','OFFLINE') NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_courier PRIMARY KEY (courier_id),
  CONSTRAINT uq_courier_phone UNIQUE (phone)
) ENGINE=InnoDB;


-- =========================================================
-- 7) PARCEL
-- =========================================================
CREATE TABLE parcel (
  parcel_id             BINARY(16)    NOT NULL,         -- UUID
  tracking_ref          VARCHAR(80)   NOT NULL,
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
  status                ENUM('CREATED','ACCEPTED','IN_TRANSIT','ARRIVED_HUB',
                             'OUT_FOR_DELIVERY','DELIVERED','RETURNED','CANCELLED')
                       NOT NULL DEFAULT 'CREATED',
  photo_url             VARCHAR(255)  NULL,
  description_comment   VARCHAR(255)  NULL,
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
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_parcel_client   ON parcel(client_id);
CREATE INDEX ix_parcel_status   ON parcel(status);
CREATE INDEX ix_parcel_tracking ON parcel(tracking_ref);


-- =========================================================
-- 8) PICKUP_REQUEST
-- =========================================================
CREATE TABLE pickup_request (
  pickup_id      BINARY(16)   NOT NULL,       -- UUID
  parcel_id      BINARY(16)   NOT NULL,
  courier_id     BINARY(16)   NULL,
  requested_date DATE         NOT NULL,
  time_window    VARCHAR(30)  NOT NULL,       -- '08:00-12:00'
  state          ENUM('REQUESTED','ASSIGNED','COMPLETED','CANCELLED') NOT NULL,
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
-- 9) SCAN_EVENT (Tracking history)
-- =========================================================
CREATE TABLE scan_event (
  scan_id       BINARY(16)   NOT NULL,      -- UUID
  parcel_id     BINARY(16)   NOT NULL,
  agency_id     BINARY(16)   NULL,
  agent_id      BINARY(16)   NULL,
  event_type    ENUM(
                  'CREATED',
                  'AT_ORIGIN_AGENCY',
                  'IN_TRANSIT',
                  'ARRIVED_HUB',
                  'DEPARTED_HUB',
                  'ARRIVED_DESTINATION',
                  'OUT_FOR_DELIVERY',
                  'DELIVERED',
                  'RETURNED'
                ) NOT NULL,
  timestamp     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  location_note VARCHAR(255) NULL,
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


-- =========================================================
-- 10) DELIVERY_PROOF
-- =========================================================
CREATE TABLE delivery_proof (
  pod_id      BINARY(16)   NOT NULL,      -- UUID
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
-- 10B) DELIVERY_OTP (OTP codes for final delivery confirmation)
-- =========================================================
CREATE TABLE delivery_otp (
  delivery_otp_id BINARY(16)   NOT NULL,    -- UUID
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
  payment_id   BINARY(16)   NOT NULL,      -- UUID
  parcel_id    BINARY(16)   NOT NULL,
  amount       FLOAT        NOT NULL,
  currency     VARCHAR(10)  NOT NULL DEFAULT 'XAF',
  method       ENUM('CASH','MOBILE_MONEY','CARD') NOT NULL,
  status       ENUM('INIT','PENDING','SUCCESS','FAILED','CANCELLED')
               NOT NULL DEFAULT 'INIT',
  reversed     BOOLEAN      NOT NULL DEFAULT FALSE,  -- 🔥 soft reversal flag
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
  invoice_id      BINARY(16)   NOT NULL,       -- UUID
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
  notification_id  BINARY(16)   NOT NULL,      -- UUID
  parcel_id        BINARY(16)   NULL,
  pickup_id        BINARY(16)   NULL,
  recipient_phone  VARCHAR(30)  NULL,
  recipient_email  VARCHAR(100) NULL,
  channel          ENUM('SMS','EMAIL','PUSH') NOT NULL,
  type             ENUM(
                      'PICKUP_REQUESTED',
                      'PICKUP_COMPLETED',
                      'PARCEL_DELIVERED',
                      'MANUAL',
                      'PARCEL_CREATED',
                      'PARCEL_ACCEPTED',
                      'PARCEL_IN_TRANSIT',
                      'PARCEL_ARRIVED_DESTINATION',
                      'PARCEL_OUT_FOR_DELIVERY',
                      'PARCEL_RETURNED',
                      'PAYMENT_CONFIRMED',
                      'DELIVERY_OPTION_CHANGED',
                      'REMINDER_NOT_COLLECTED',
                      'DELIVERY_OTP'
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
  id               BINARY(16)    NOT NULL,   -- UUID
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
  pricing_detail_id BINARY(16)   NOT NULL,   -- UUID
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
-- 16) OTP_CODE (for OTP / SMS auth)
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
-- 17) SUPPORT_TICKET  (Support / Ticketing module)
-- =========================================================
CREATE TABLE support_ticket (
  ticket_id          BINARY(16)   NOT NULL,      -- UUID
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
-- 18) REFUND_ADJUSTMENT (Refunds & Chargebacks)
--     ✅ Fix Hibernate FK duplication by renaming FK constraint names here
-- =========================================================
CREATE TABLE refund_adjustment (
  refund_id             BINARY(16)   NOT NULL,     -- UUID
  payment_id            BINARY(16)   NOT NULL,
  type                  ENUM('REFUND','CHARGEBACK','ADJUSTMENT') NOT NULL,
  status                ENUM('REQUESTED','PENDING','APPROVED','REJECTED','COMPLETED','PROCESSED')
                        NOT NULL DEFAULT 'REQUESTED',
  amount                FLOAT        NOT NULL,
  reason                VARCHAR(255) NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at          TIMESTAMP    NULL,
  processed_by_staff_id BINARY(16)   NULL,
  CONSTRAINT pk_refund PRIMARY KEY (refund_id),

  -- ⚠️ Changed only constraint names (table/columns unchanged)
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
-- 18B) REFUND  (Added to match Hibernate expectation and reserve fk_refund_payment name)
--      ✅ This prevents Hibernate from trying to create/alter refund FK with same name.
-- =========================================================
CREATE TABLE refund (
  refund_id             BINARY(16)   NOT NULL,     -- UUID
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
-- 19) RISK_ALERT (Compliance / AML / Risk)
-- =========================================================
CREATE TABLE risk_alert (
  risk_alert_id        BINARY(16)   NOT NULL,     -- UUID
  parcel_id            BINARY(16)   NULL,
  payment_id           BINARY(16)   NULL,
  alert_type           ENUM('AML_FLAG','HIGH_VALUE','MULTIPLE_FAILED_PAYMENTS','OTHER') NOT NULL,
  severity             ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  status               ENUM('OPEN','UNDER_REVIEW','RESOLVED','DISMISSED') NOT NULL DEFAULT 'OPEN',
  resolved             BOOLEAN      NOT NULL DEFAULT FALSE,   -- 🔥 boolean flag used in service
  description          VARCHAR(255) NULL,
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NULL,
  reviewed_by_staff_id BINARY(16)   NULL,
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


-- =========================================================
-- 20) GEOLOCATION_ROUTE_LOG (Geocoding / routing / ETA)
-- =========================================================
CREATE TABLE geolocation_route_log (
  route_log_id       BINARY(16)   NOT NULL,    -- UUID
  parcel_id          BINARY(16)   NULL,
  origin_lat         DECIMAL(9,6) NULL,
  origin_lng         DECIMAL(9,6) NULL,
  dest_lat           DECIMAL(9,6) NULL,
  dest_lng           DECIMAL(9,6) NULL,
  distance_km        FLOAT        NULL,
  duration_min       INT          NULL,
  provider           VARCHAR(50)  NULL,        -- 'GOOGLE','OSM','INTERNAL',...
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_geo_route PRIMARY KEY (route_log_id),
  CONSTRAINT fk_geo_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_geo_parcel ON geolocation_route_log(parcel_id);


-- =========================================================
-- 21) USSD_SESSION (USSD Integration)
-- =========================================================
CREATE TABLE ussd_session (
  ussd_session_id    BINARY(16)   NOT NULL,    -- UUID
  session_ref        VARCHAR(100) NOT NULL,    -- telco session id
  phone              VARCHAR(20)  NOT NULL,
  state              VARCHAR(50)  NOT NULL,    -- technical state (ACTIVE/COMPLETED, etc.)
  current_menu       VARCHAR(50)  NOT NULL DEFAULT 'MAIN',  -- 🔥 logical menu (MAIN, TRACK_PROMPT, ...)
  last_input         VARCHAR(255) NULL,
  active             BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NULL,
  last_interaction_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 🔥 used in service
  CONSTRAINT pk_ussd_session PRIMARY KEY (ussd_session_id),
  CONSTRAINT uq_ussd_session_ref UNIQUE (session_ref)
) ENGINE=InnoDB;

CREATE INDEX ix_ussd_phone ON ussd_session(phone);


-- =========================================================
-- 22) INTEGRATION_CONFIG (Operational integrations)
-- =========================================================
CREATE TABLE integration_config (
  integration_id    BINARY(16)   NOT NULL,    -- UUID
  integration_type  ENUM('PAYMENT','SMS','USSD','MAPS','NPSI','ANALYTICS','OTHER') NOT NULL,
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
-- 23) COMPLIANCE_REPORT (Compliance / AML reporting)
-- =========================================================
CREATE TABLE compliance_report (
  compliance_report_id  BINARY(16)   NOT NULL,  -- UUID
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
-- DONE
-- =========================================================
