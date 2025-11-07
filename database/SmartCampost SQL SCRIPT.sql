-- =========================================================
-- SmartCAMPOST • MySQL 8.0 schema
-- =========================================================
CREATE DATABASE IF NOT EXISTS smartcampost
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE smartcampost;

-- =========================================================
-- 1) CLIENT
-- =========================================================
CREATE TABLE client (
  client_id           CHAR(36)      NOT NULL,
  full_name           VARCHAR(150)  NOT NULL,
  phone               VARCHAR(30)   NOT NULL,
  email               VARCHAR(100)  NULL,
  preferred_language  VARCHAR(10)   NULL, -- e.g. 'FR', 'EN'
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_client PRIMARY KEY (client_id),
  CONSTRAINT uq_client_phone UNIQUE (phone),
  CONSTRAINT uq_client_email UNIQUE (email)
) ENGINE=InnoDB;

-- =========================================================
-- 2) ADDRESS
-- (Nullable client_id allows addresses kept for history/walk-in)
-- ON DELETE SET NULL (address can outlive client)
-- =========================================================
CREATE TABLE address (
  address_id   CHAR(36)      NOT NULL,
  client_id    CHAR(36)      NULL,
  label        VARCHAR(255)  NOT NULL,
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
  agency_id    CHAR(36)      NOT NULL,
  agency_name  VARCHAR(150)  NOT NULL,
  agency_code  VARCHAR(50)   NOT NULL,
  city         VARCHAR(100)  NOT NULL,
  region       VARCHAR(100)  NOT NULL,
  CONSTRAINT pk_agency PRIMARY KEY (agency_id),
  CONSTRAINT uq_agency_code UNIQUE (agency_code)
) ENGINE=InnoDB;

-- =========================================================
-- 4) AGENT
-- =========================================================
CREATE TABLE agent (
  agent_id     CHAR(36)      NOT NULL,
  full_name    VARCHAR(150)  NOT NULL,
  staff_number VARCHAR(50)   NOT NULL,
  phone        VARCHAR(30)   NOT NULL,
  status       ENUM('Active','Inactive','Suspended') NOT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_agent PRIMARY KEY (agent_id),
  CONSTRAINT uq_agent_staff UNIQUE (staff_number),
  CONSTRAINT uq_agent_phone UNIQUE (phone)
) ENGINE=InnoDB;

-- =========================================================
-- 5) PARCEL
-- FKs to client and two addresses (sender/recipient)
-- ON DELETE RESTRICT to keep integrity of history
-- =========================================================
CREATE TABLE parcel (
  parcel_id            CHAR(36)      NOT NULL,
  tracking_ref         VARCHAR(80)   NOT NULL,
  client_id            CHAR(36)      NOT NULL,
  sender_address_id    CHAR(36)      NOT NULL,
  recipient_address_id CHAR(36)      NOT NULL,
  weight               DECIMAL(10,3) NOT NULL,
  dimensions           VARCHAR(50)   NULL,
  declared_value       DECIMAL(12,2) NULL,
  is_fragile           BOOLEAN       NOT NULL DEFAULT FALSE,
  service_type         VARCHAR(30)   NOT NULL, -- e.g. 'Standard','Express'
  delivery_option      ENUM('Agency','Home') NOT NULL,
  status               VARCHAR(30)   NOT NULL, -- 'Created','Accepted','PickedUp',... 
  created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX ix_parcel_client ON parcel(client_id);
CREATE INDEX ix_parcel_status ON parcel(status);

-- =========================================================
-- 6) PICKUP_REQUEST (0..1 per parcel)
-- Enforced via UNIQUE(parcel_id)
-- ON DELETE CASCADE (remove with parcel in test/purge)
-- =========================================================
CREATE TABLE pickup_request (
  pickup_id      CHAR(36)     NOT NULL,
  parcel_id      CHAR(36)     NOT NULL,
  requested_date DATE         NOT NULL,
  time_window    VARCHAR(30)  NOT NULL, -- e.g., '08:00-12:00'
  state          ENUM('Requested','Assigned','Completed','Cancelled') NOT NULL,
  comment        TEXT         NULL,
  CONSTRAINT pk_pickup PRIMARY KEY (pickup_id),
  CONSTRAINT uq_pickup_parcel UNIQUE (parcel_id),
  CONSTRAINT fk_pickup_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 7) SCAN_EVENT
-- Optional agency/agent: ON DELETE SET NULL
-- =========================================================
CREATE TABLE scan_event (
  scan_id     CHAR(36)     NOT NULL,
  parcel_id   CHAR(36)     NOT NULL,
  agency_id   CHAR(36)     NULL,
  agent_id    CHAR(36)     NULL,
  event_type  VARCHAR(40)  NOT NULL, -- 'CREATED','IN_TRANSIT','ARRIVED_HUB',...
  timestamp   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
CREATE INDEX ix_scan_agency ON scan_event(agency_id);
CREATE INDEX ix_scan_agent ON scan_event(agent_id);
CREATE INDEX ix_scan_type_time ON scan_event(event_type, timestamp);

-- =========================================================
-- 8) DELIVERY_PROOF (0..1 per parcel) — UNIQUE(parcel_id)
-- ON DELETE CASCADE with parcel
-- =========================================================
CREATE TABLE delivery_proof (
  pod_id     CHAR(36)     NOT NULL,
  parcel_id  CHAR(36)     NOT NULL,
  proof_type ENUM('Signature','Photo','OTP') NOT NULL,
  timestamp  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details    TEXT         NULL,
  CONSTRAINT pk_pod PRIMARY KEY (pod_id),
  CONSTRAINT uq_pod_parcel UNIQUE (parcel_id),
  CONSTRAINT fk_pod_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 9) PAYMENT (N per parcel)
-- Keep history: ON DELETE RESTRICT
-- =========================================================
CREATE TABLE payment (
  payment_id   CHAR(36)      NOT NULL,
  parcel_id    CHAR(36)      NOT NULL,
  amount       DECIMAL(12,2) NOT NULL,
  currency     VARCHAR(10)   NOT NULL DEFAULT 'XAF',
  method       ENUM('Digital','Cash') NOT NULL,
  status       ENUM('INIT','PAID','FAILED') NOT NULL,
  timestamp    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  external_ref VARCHAR(100)  NULL,
  CONSTRAINT pk_payment PRIMARY KEY (payment_id),
  CONSTRAINT fk_payment_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX ix_payment_parcel ON payment(parcel_id);
CREATE INDEX ix_payment_status ON payment(status);

-- =========================================================
-- 10) INVOICE (0..1 per payment) — UNIQUE(payment_id)
-- ON DELETE CASCADE with payment
-- =========================================================
CREATE TABLE invoice (
  invoice_id    CHAR(36)      NOT NULL,
  payment_id    CHAR(36)      NOT NULL,
  invoice_number VARCHAR(50)  NOT NULL,
  total_amount  DECIMAL(12,2) NOT NULL,
  issued_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pdf_link      TEXT          NULL,
  CONSTRAINT pk_invoice PRIMARY KEY (invoice_id),
  CONSTRAINT uq_invoice_number UNIQUE (invoice_number),
  CONSTRAINT uq_invoice_payment UNIQUE (payment_id),
  CONSTRAINT fk_invoice_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- 11) NOTIFICATION (N per parcel, N per client)
-- ON DELETE CASCADE (safe to purge with parents)
-- =========================================================
CREATE TABLE notification (
  notif_id   CHAR(36)     NOT NULL,
  parcel_id  CHAR(36)     NOT NULL,
  client_id  CHAR(36)     NOT NULL,
  channel    ENUM('SMS','PUSH') NOT NULL,
  message    TEXT         NOT NULL,
  timestamp  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status     ENUM('SENT','FAILED') NOT NULL,
  CONSTRAINT pk_notification PRIMARY KEY (notif_id),
  CONSTRAINT fk_notif_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notif_client
    FOREIGN KEY (client_id) REFERENCES client(client_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_notif_parcel ON notification(parcel_id);
CREATE INDEX ix_notif_client ON notification(client_id);

-- =========================================================
-- 12) TARIFF (reference data used for pricing)
-- =========================================================
CREATE TABLE tariff (
  tariff_id      CHAR(36)      NOT NULL,
  service_type   VARCHAR(30)   NOT NULL,
  origin_zone    VARCHAR(50)   NOT NULL,
  destination_zone VARCHAR(50) NOT NULL,
  weight_bracket VARCHAR(30)   NOT NULL,
  price          DECIMAL(10,2) NOT NULL,
  CONSTRAINT pk_tariff PRIMARY KEY (tariff_id)
) ENGINE=InnoDB;

CREATE INDEX ix_tariff_lookup
  ON tariff(service_type, origin_zone, destination_zone, weight_bracket);

-- =========================================================
-- 13) PRICING_DETAIL (audit of the tariff used)
-- N per parcel; links tariff used and applied price
-- ON DELETE CASCADE (safe with parcel/tariff purge)
-- =========================================================
CREATE TABLE pricing_detail (
  pricing_detail_id CHAR(36)      NOT NULL,
  parcel_id         CHAR(36)      NOT NULL,
  tariff_id         CHAR(36)      NOT NULL,
  applied_price     DECIMAL(12,2) NOT NULL,
  applied_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_pricing_detail PRIMARY KEY (pricing_detail_id),
  CONSTRAINT fk_pd_parcel
    FOREIGN KEY (parcel_id) REFERENCES parcel(parcel_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pd_tariff
    FOREIGN KEY (tariff_id) REFERENCES tariff(tariff_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX ix_pd_parcel ON pricing_detail(parcel_id, applied_at);
CREATE INDEX ix_pd_tariff ON pricing_detail(tariff_id);

-- =========================================================
-- DONE
-- =========================================================
