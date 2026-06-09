-- =============================================================
--  SmartCAMPOST — Complete Production Database Schema
--  MySQL 8.0+ / InnoDB
--  Generated: 2026-06-05
--
--  Conventions:
--    UUID primary keys  → BINARY(16)
--    Instant / OffsetDateTime → DATETIME(6)
--    LocalDate          → DATE
--    boolean/Boolean    → BIT(1)
--    @Lob String        → LONGTEXT (unless entity sets columnDefinition="TEXT")
--    Explicit JSON cols → JSON
--    Long PK (identity) → BIGINT AUTO_INCREMENT
--
--  Run against a clean (empty) database. All statements use
--  CREATE TABLE IF NOT EXISTS so the script is re-runnable.
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================
-- SECTION 1: STANDALONE / ROOT TABLES
-- (no foreign-key dependencies)
-- =============================================================

CREATE TABLE IF NOT EXISTS agency (
    agency_id   BINARY(16)   NOT NULL,
    agency_name VARCHAR(150) NOT NULL,
    agency_code VARCHAR(50)  NOT NULL,
    city        VARCHAR(100) NOT NULL,
    region      VARCHAR(100) NOT NULL,
    country     VARCHAR(100) NOT NULL DEFAULT 'Cameroon',
    PRIMARY KEY (agency_id),
    UNIQUE KEY uq_agency_code (agency_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS client (
    client_id          BINARY(16)   NOT NULL,
    full_name          VARCHAR(150) NOT NULL,
    phone              VARCHAR(30),
    email              VARCHAR(100),
    preferred_language VARCHAR(10),
    password_hash      VARCHAR(255),
    created_at         DATETIME(6)  NOT NULL,
    PRIMARY KEY (client_id),
    UNIQUE KEY uq_client_phone (phone),
    UNIQUE KEY uq_client_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tariff (
    id               BINARY(16)     NOT NULL,
    service_type     VARCHAR(50)    NOT NULL,
    origin_zone      VARCHAR(255)   NOT NULL,
    destination_zone VARCHAR(255)   NOT NULL,
    weight_bracket   VARCHAR(255)   NOT NULL,
    price            DECIMAL(38, 2) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_account (
    id            BINARY(16)   NOT NULL,
    phone         VARCHAR(20),
    email         VARCHAR(255),
    password_hash VARCHAR(255),
    auth_provider VARCHAR(20)  NOT NULL DEFAULT 'LOCAL',
    google_id     VARCHAR(255),
    role          VARCHAR(50)  NOT NULL,
    entity_id     BINARY(16)   NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    frozen        BIT(1)       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_phone    (phone),
    UNIQUE KEY uq_user_email    (email),
    UNIQUE KEY uq_user_google_id (google_id),
    INDEX ix_user_auth_provider (auth_provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS otp_code (
    otp_id     BINARY(16)  NOT NULL,
    phone      VARCHAR(20) NOT NULL,
    code       VARCHAR(10) NOT NULL,
    purpose    VARCHAR(30) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used       BIT(1)      NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (otp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS approval_requests (
    id              BINARY(16)   NOT NULL,
    tool_name       VARCHAR(255),
    actor_id        VARCHAR(255),
    actor_role      VARCHAR(255),
    parameters_json LONGTEXT,
    reason          VARCHAR(255),
    approved        BIT(1)       NOT NULL DEFAULT 0,
    processed       BIT(1)       NOT NULL DEFAULT 0,
    handled         BIT(1)       NOT NULL DEFAULT 0,
    created_at      DATETIME(6),
    processed_at    DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS locations (
    id        BIGINT        NOT NULL AUTO_INCREMENT,
    user_id   VARCHAR(64),
    latitude  DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address   VARCHAR(500),
    source    VARCHAR(20),
    timestamp DATETIME(6)   NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS integration_config (
    integration_id   BINARY(16)   NOT NULL,
    integration_type VARCHAR(50)  NOT NULL,
    provider_name    VARCHAR(100) NOT NULL,
    api_key          VARCHAR(255),
    base_url         VARCHAR(255),
    active           BIT(1)       NOT NULL DEFAULT 0,
    created_at       DATETIME(6)  NOT NULL,
    updated_at       DATETIME(6),
    PRIMARY KEY (integration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS event_subscription (
    subscription_id   BINARY(16)   NOT NULL,
    subscriber_name   VARCHAR(100) NOT NULL,
    event_category    VARCHAR(50)  NOT NULL,
    event_type_filter VARCHAR(255),
    active            BIT(1)       NOT NULL DEFAULT 1,
    endpoint_url      VARCHAR(500),
    handler_class     VARCHAR(255),
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6),
    PRIMARY KEY (subscription_id),
    UNIQUE KEY uq_subscriber_name (subscriber_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS intent_action_mapping (
    mapping_id            BINARY(16)   NOT NULL,
    intent_name           VARCHAR(100) NOT NULL,
    action_name           VARCHAR(100) NOT NULL,
    required_entities     JSON,
    response_template     TEXT,
    is_automated          BIT(1)       NOT NULL DEFAULT 1,
    requires_confirmation BIT(1)       NOT NULL DEFAULT 0,
    active                BIT(1)       NOT NULL DEFAULT 1,
    PRIMARY KEY (mapping_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS system_event (
    event_id          BINARY(16)   NOT NULL,
    event_category    VARCHAR(30)  NOT NULL,
    event_type        VARCHAR(100) NOT NULL,
    entity_type       VARCHAR(50)  NOT NULL,
    entity_id         BINARY(16),
    payload           JSON         NOT NULL,
    priority          TINYINT      NOT NULL DEFAULT 5,
    processing_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    created_at        DATETIME(6)  NOT NULL,
    processed_at      DATETIME(6),
    processor_id      VARCHAR(100),
    retry_count       TINYINT      NOT NULL DEFAULT 0,
    error_message     TEXT,
    correlation_id    VARCHAR(100),
    PRIMARY KEY (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_log (
    audit_id         BINARY(16)   NOT NULL,
    action_type      VARCHAR(100) NOT NULL,
    entity_type      VARCHAR(50)  NOT NULL,
    entity_id        BINARY(16),
    actor_type       VARCHAR(20)  NOT NULL,
    actor_id         VARCHAR(64),
    actor_ip         VARCHAR(45),
    actor_user_agent VARCHAR(255),
    old_values       JSON,
    new_values       JSON,
    change_summary   VARCHAR(500),
    timestamp        DATETIME(6)  NOT NULL,
    session_id       VARCHAR(100),
    request_id       VARCHAR(100),
    PRIMARY KEY (audit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS historical_delivery_event (
    event_id              BINARY(16)  NOT NULL,
    parcel_id             BINARY(16),
    tracking_ref          VARCHAR(80),
    origin_agency_id      BINARY(16),
    dest_agency_id        BINARY(16),
    courier_id            BINARY(16),
    service_type          VARCHAR(20),
    delivery_option       VARCHAR(20),
    distance_km           FLOAT,
    created_at            DATETIME(6),
    accepted_at           DATETIME(6),
    first_scan_at         DATETIME(6),
    last_scan_at          DATETIME(6),
    delivered_at          DATETIME(6),
    total_duration_min    INT,
    transit_duration_min  INT,
    num_scan_events       INT,
    num_delivery_attempts INT,
    was_delayed           BIT(1),
    delay_minutes         INT,
    final_status          VARCHAR(40),
    weather_condition     VARCHAR(50),
    day_of_week           TINYINT,
    hour_of_day           TINYINT,
    PRIMARY KEY (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS performance_metric (
    metric_id    BINARY(16)  NOT NULL,
    metric_type  VARCHAR(30) NOT NULL,
    subject_type VARCHAR(30) NOT NULL,
    subject_id   BINARY(16),
    period_type  VARCHAR(20) NOT NULL,
    period_start DATETIME(6) NOT NULL,
    period_end   DATETIME(6) NOT NULL,
    metric_value FLOAT       NOT NULL,
    sample_count INT         NOT NULL DEFAULT 1,
    metadata     JSON,
    created_at   DATETIME(6) NOT NULL,
    PRIMARY KEY (metric_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS predictive_result (
    prediction_id       BINARY(16)  NOT NULL,
    prediction_type     VARCHAR(30) NOT NULL,
    subject_type        VARCHAR(30) NOT NULL,
    subject_id          BINARY(16),
    predicted_value     FLOAT,
    predicted_timestamp DATETIME(6),
    confidence_score    FLOAT       NOT NULL DEFAULT 0.5,
    model_version       VARCHAR(50),
    input_features      JSON,
    created_at          DATETIME(6) NOT NULL,
    valid_until         DATETIME(6),
    actual_value        FLOAT,
    actual_timestamp    DATETIME(6),
    PRIMARY KEY (prediction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ussd_session (
    ussd_session_id     BINARY(16)   NOT NULL,
    phone               VARCHAR(20)  NOT NULL,
    session_ref         VARCHAR(100) NOT NULL,
    current_menu        VARCHAR(50),
    state               VARCHAR(20)  NOT NULL,
    last_interaction_at DATETIME(6)  NOT NULL,
    PRIMARY KEY (ussd_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 2: TABLES DEPENDING ON agency
-- =============================================================

CREATE TABLE IF NOT EXISTS staff (
    staff_id      BINARY(16)   NOT NULL,
    agency_id     BINARY(16),
    full_name     VARCHAR(150) NOT NULL,
    role          VARCHAR(80)  NOT NULL,
    email         VARCHAR(100),
    phone         VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    status        VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    hired_at      DATE,
    terminated_at DATE,
    PRIMARY KEY (staff_id),
    UNIQUE KEY uq_staff_email (email),
    UNIQUE KEY uq_staff_phone (phone),
    CONSTRAINT fk_staff_agency FOREIGN KEY (agency_id) REFERENCES agency (agency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS courier (
    courier_id        BINARY(16)    NOT NULL,
    agency_id         BINARY(16),
    full_name         VARCHAR(150)  NOT NULL,
    phone             VARCHAR(30)   NOT NULL,
    vehicle_id        VARCHAR(50),
    status            VARCHAR(30)   NOT NULL,
    password_hash     VARCHAR(255)  NOT NULL,
    created_at        DATETIME(6)   NOT NULL,
    current_latitude  DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    last_location_at  DATETIME(6),
    PRIMARY KEY (courier_id),
    UNIQUE KEY uq_courier_phone (phone),
    CONSTRAINT fk_courier_agency FOREIGN KEY (agency_id) REFERENCES agency (agency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 3: TABLES DEPENDING ON agency + staff
-- =============================================================

CREATE TABLE IF NOT EXISTS agent (
    agent_id      BINARY(16)   NOT NULL,
    agency_id     BINARY(16),
    staff_id      BINARY(16)   NOT NULL,
    staff_number  VARCHAR(50)  NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    phone         VARCHAR(30)  NOT NULL,
    status        VARCHAR(30)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (agent_id),
    UNIQUE KEY uq_agent_staff_number (staff_number),
    UNIQUE KEY uq_agent_phone        (phone),
    CONSTRAINT fk_agent_agency FOREIGN KEY (agency_id) REFERENCES agency (agency_id),
    CONSTRAINT fk_agent_staff  FOREIGN KEY (staff_id)  REFERENCES staff  (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 4: TABLES DEPENDING ON client
-- =============================================================

CREATE TABLE IF NOT EXISTS address (
    address_id BINARY(16)   NOT NULL,
    client_id  BINARY(16),
    label      VARCHAR(255) NOT NULL,
    street     VARCHAR(255),
    city       VARCHAR(100) NOT NULL,
    region     VARCHAR(100) NOT NULL,
    country    VARCHAR(100) NOT NULL,
    latitude   DECIMAL(9,6),
    longitude  DECIMAL(9,6),
    PRIMARY KEY (address_id),
    CONSTRAINT fk_address_client FOREIGN KEY (client_id) REFERENCES client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS support_ticket (
    ticket_id   BINARY(16)   NOT NULL,
    client_id   BINARY(16),
    subject     VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL,
    status      VARCHAR(30)  NOT NULL,
    category    VARCHAR(50)  NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6),
    PRIMARY KEY (ticket_id),
    CONSTRAINT fk_ticket_client FOREIGN KEY (client_id) REFERENCES client (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 5: PARCEL (depends on client, address, agency, staff)
-- =============================================================

CREATE TABLE IF NOT EXISTS parcel (
    parcel_id              BINARY(16)    NOT NULL,
    tracking_ref           VARCHAR(80)   NOT NULL,
    tracking_number        VARCHAR(80),
    qr_status              VARCHAR(20)   NOT NULL DEFAULT 'PARTIAL',
    is_locked              BIT(1)        NOT NULL DEFAULT 0,
    partial_qr_code        VARCHAR(500),
    final_qr_code          VARCHAR(500),
    creation_latitude      DECIMAL(10,8),
    creation_longitude     DECIMAL(11,8),
    location_mode          VARCHAR(20)   DEFAULT 'GPS_DEFAULT',
    current_latitude       DECIMAL(10,8),
    current_longitude      DECIMAL(11,8),
    location_updated_at    DATETIME(6),
    client_id              BINARY(16)    NOT NULL,
    sender_address_id      BINARY(16)    NOT NULL,
    recipient_address_id   BINARY(16)    NOT NULL,
    origin_agency_id       BINARY(16),
    destination_agency_id  BINARY(16),
    weight                 DOUBLE        NOT NULL,
    dimensions             VARCHAR(50),
    declared_value         DOUBLE,
    is_fragile             BIT(1)        NOT NULL DEFAULT 0,
    service_type           VARCHAR(30)   NOT NULL,
    delivery_option        VARCHAR(30)   NOT NULL,
    status                 VARCHAR(30)   NOT NULL,
    payment_option         VARCHAR(30)   NOT NULL,
    photo_url              VARCHAR(255),
    description_comment    VARCHAR(1000),
    validated_weight       DOUBLE,
    validated_dimensions   VARCHAR(50),
    validation_comment     VARCHAR(1000),
    description_confirmed  BIT(1),
    validated_at           DATETIME(6),
    validated_by_staff_id  BINARY(16),
    created_at             DATETIME(6)   NOT NULL,
    expected_delivery_at   DATETIME(6),
    PRIMARY KEY (parcel_id),
    UNIQUE KEY uq_parcel_tracking_ref (tracking_ref),
    CONSTRAINT fk_parcel_client          FOREIGN KEY (client_id)             REFERENCES client  (client_id),
    CONSTRAINT fk_parcel_sender_addr     FOREIGN KEY (sender_address_id)     REFERENCES address (address_id),
    CONSTRAINT fk_parcel_recipient_addr  FOREIGN KEY (recipient_address_id)  REFERENCES address (address_id),
    CONSTRAINT fk_parcel_origin_agency   FOREIGN KEY (origin_agency_id)      REFERENCES agency  (agency_id),
    CONSTRAINT fk_parcel_dest_agency     FOREIGN KEY (destination_agency_id) REFERENCES agency  (agency_id),
    CONSTRAINT fk_parcel_validated_by    FOREIGN KEY (validated_by_staff_id) REFERENCES staff   (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 6: TABLES DEPENDING ON parcel
-- =============================================================

CREATE TABLE IF NOT EXISTS pickup_request (
    pickup_id         BINARY(16)    NOT NULL,
    parcel_id         BINARY(16)    NOT NULL,
    courier_id        BINARY(16),
    requested_date    DATE          NOT NULL,
    time_window       VARCHAR(30)   NOT NULL,
    state             VARCHAR(30)   NOT NULL,
    pickup_latitude   DECIMAL(10,8),
    pickup_longitude  DECIMAL(11,8),
    location_mode     VARCHAR(30),
    comment           VARCHAR(255),
    created_at        DATETIME(6)   NOT NULL,
    PRIMARY KEY (pickup_id),
    UNIQUE KEY uq_pickup_parcel (parcel_id),
    CONSTRAINT fk_pickup_parcel  FOREIGN KEY (parcel_id)  REFERENCES parcel  (parcel_id),
    CONSTRAINT fk_pickup_courier FOREIGN KEY (courier_id) REFERENCES courier (courier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment (
    payment_id   BINARY(16)  NOT NULL,
    parcel_id    BINARY(16)  NOT NULL,
    amount       DOUBLE      NOT NULL,
    currency     VARCHAR(10) NOT NULL DEFAULT 'XAF',
    method       VARCHAR(30) NOT NULL,
    status       VARCHAR(30) NOT NULL,
    timestamp    DATETIME(6) NOT NULL,
    external_ref VARCHAR(100),
    reversed     BIT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (payment_id),
    CONSTRAINT fk_payment_parcel FOREIGN KEY (parcel_id) REFERENCES parcel (parcel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS delivery_proof (
    pod_id     BINARY(16)  NOT NULL,
    parcel_id  BINARY(16)  NOT NULL,
    courier_id BINARY(16),
    proof_type VARCHAR(30) NOT NULL,
    timestamp  DATETIME(6) NOT NULL,
    details    VARCHAR(255),
    PRIMARY KEY (pod_id),
    UNIQUE KEY uq_pod_parcel (parcel_id),
    CONSTRAINT fk_pod_parcel  FOREIGN KEY (parcel_id)  REFERENCES parcel  (parcel_id),
    CONSTRAINT fk_pod_courier FOREIGN KEY (courier_id) REFERENCES courier (courier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS delivery_attempt (
    attempt_id     BINARY(16)    NOT NULL,
    parcel_id      BINARY(16)    NOT NULL,
    courier_id     BINARY(16),
    attempt_number INT           NOT NULL,
    result         VARCHAR(20)   NOT NULL,
    failure_reason VARCHAR(255),
    latitude       DECIMAL(10,8),
    longitude      DECIMAL(11,8),
    notes          VARCHAR(500),
    attempted_at   DATETIME(6)   NOT NULL,
    PRIMARY KEY (attempt_id),
    CONSTRAINT fk_attempt_parcel  FOREIGN KEY (parcel_id)  REFERENCES parcel  (parcel_id),
    CONSTRAINT fk_attempt_courier FOREIGN KEY (courier_id) REFERENCES courier (courier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS delivery_otp (
    delivery_otp_id BINARY(16)  NOT NULL,
    parcel_id       BINARY(16)  NOT NULL,
    phone_number    VARCHAR(30) NOT NULL,
    otp_code        VARCHAR(10) NOT NULL,
    created_at      DATETIME(6) NOT NULL,
    expires_at      DATETIME(6) NOT NULL,
    consumed        BIT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (delivery_otp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS scan_event (
    scan_id            BINARY(16)    NOT NULL,
    parcel_id          BINARY(16)    NOT NULL,
    agency_id          BINARY(16),
    agent_id           BINARY(16),
    event_type         VARCHAR(40)   NOT NULL,
    timestamp          DATETIME(6)   NOT NULL,
    location_note      VARCHAR(255),
    latitude           DECIMAL(10,8) NOT NULL,
    longitude          DECIMAL(11,8) NOT NULL,
    location_source    VARCHAR(20)   NOT NULL DEFAULT 'DEVICE_GPS',
    device_timestamp   DATETIME(6),
    actor_id           VARCHAR(64),
    actor_role         VARCHAR(40),
    proof_url          VARCHAR(500),
    comment            VARCHAR(1000),
    source             VARCHAR(50),
    scan_type          VARCHAR(60),
    scanned_by         VARCHAR(64),
    role               VARCHAR(40),
    address            VARCHAR(500),
    is_synced          BIT(1)        NOT NULL DEFAULT 1,
    offline_created_at DATETIME(6),
    synced_at          DATETIME(6),
    PRIMARY KEY (scan_id),
    CONSTRAINT fk_scan_parcel FOREIGN KEY (parcel_id) REFERENCES parcel (parcel_id),
    CONSTRAINT fk_scan_agency FOREIGN KEY (agency_id) REFERENCES agency (agency_id),
    CONSTRAINT fk_scan_agent  FOREIGN KEY (agent_id)  REFERENCES agent  (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pricing_detail (
    pricing_detail_id BINARY(16)  NOT NULL,
    parcel_id         BINARY(16)  NOT NULL,
    tariff_id         BINARY(16)  NOT NULL,
    applied_price     DOUBLE      NOT NULL,
    applied_at        DATETIME(6) NOT NULL,
    PRIMARY KEY (pricing_detail_id),
    CONSTRAINT fk_pd_parcel FOREIGN KEY (parcel_id) REFERENCES parcel  (parcel_id),
    CONSTRAINT fk_pd_tariff FOREIGN KEY (tariff_id) REFERENCES tariff  (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS geolocation_route_log (
    route_log_id BINARY(16)  NOT NULL,
    parcel_id    BINARY(16),
    origin_lat   DECIMAL(9,6),
    origin_lng   DECIMAL(9,6),
    dest_lat     DECIMAL(9,6),
    dest_lng     DECIMAL(9,6),
    distance_km  FLOAT,
    duration_min INT,
    provider     VARCHAR(50),
    created_at   DATETIME(6) NOT NULL,
    PRIMARY KEY (route_log_id),
    CONSTRAINT fk_route_log_parcel FOREIGN KEY (parcel_id) REFERENCES parcel (parcel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 7: TABLES DEPENDING ON parcel + pickup_request
-- =============================================================

CREATE TABLE IF NOT EXISTS notification (
    notification_id BINARY(16)   NOT NULL,
    parcel_id       BINARY(16),
    pickup_id       BINARY(16),
    recipient_phone VARCHAR(30),
    recipient_email VARCHAR(100),
    channel         VARCHAR(20)  NOT NULL,
    type            VARCHAR(40)  NOT NULL,
    status          VARCHAR(20)  NOT NULL,
    subject         VARCHAR(255),
    message         TEXT         NOT NULL,
    error_message   VARCHAR(255),
    retry_count     INT          NOT NULL DEFAULT 0,
    created_at      DATETIME(6)  NOT NULL,
    sent_at         DATETIME(6),
    read_at         DATETIME(6),
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notification_parcel FOREIGN KEY (parcel_id) REFERENCES parcel         (parcel_id),
    CONSTRAINT fk_notification_pickup FOREIGN KEY (pickup_id) REFERENCES pickup_request (pickup_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 8: QR VERIFICATION TOKEN
-- (depends on parcel, pickup_request, user_account)
-- =============================================================

CREATE TABLE IF NOT EXISTS qr_verification_token (
    token_id            BINARY(16)    NOT NULL,
    token               VARCHAR(64)   NOT NULL,
    signature           VARCHAR(255)  NOT NULL,
    token_type          VARCHAR(30)   NOT NULL,
    parcel_id           BINARY(16),
    pickup_id           BINARY(16),
    created_at          DATETIME(6)   NOT NULL,
    expires_at          DATETIME(6),
    last_verified_at    DATETIME(6),
    verification_count  INT           NOT NULL DEFAULT 0,
    valid               BIT(1)        NOT NULL DEFAULT 1,
    revocation_reason   VARCHAR(255),
    last_verified_by    BINARY(16),
    last_client_ip      VARCHAR(45),
    last_user_agent     VARCHAR(255),
    last_latitude       DECIMAL(10,8),
    last_longitude      DECIMAL(11,8),
    PRIMARY KEY (token_id),
    UNIQUE INDEX idx_qr_token  (token),
    INDEX        idx_qr_parcel (parcel_id),
    INDEX        idx_qr_pickup (pickup_id),
    CONSTRAINT fk_qr_token_parcel   FOREIGN KEY (parcel_id)      REFERENCES parcel         (parcel_id),
    CONSTRAINT fk_qr_token_pickup   FOREIGN KEY (pickup_id)      REFERENCES pickup_request (pickup_id),
    CONSTRAINT fk_qr_token_verifier FOREIGN KEY (last_verified_by) REFERENCES user_account (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 9: TABLES DEPENDING ON payment
-- =============================================================

CREATE TABLE IF NOT EXISTS invoice (
    invoice_id     BINARY(16)   NOT NULL,
    payment_id     BINARY(16)   NOT NULL,
    invoice_number VARCHAR(50)  NOT NULL,
    total_amount   DOUBLE       NOT NULL,
    issued_at      DATETIME(6)  NOT NULL,
    pdf_link       VARCHAR(255),
    PRIMARY KEY (invoice_id),
    UNIQUE KEY uq_invoice_payment (payment_id),
    UNIQUE KEY uq_invoice_number  (invoice_number),
    CONSTRAINT fk_invoice_payment FOREIGN KEY (payment_id) REFERENCES payment (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS refund (
    refund_id    BINARY(16)  NOT NULL,
    payment_id   BINARY(16),
    amount       DOUBLE      NOT NULL,
    status       VARCHAR(30) NOT NULL,
    reason       VARCHAR(255),
    created_at   DATETIME(6) NOT NULL,
    processed_at DATETIME(6),
    PRIMARY KEY (refund_id),
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payment (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 10: TABLES DEPENDING ON payment + staff
-- =============================================================

CREATE TABLE IF NOT EXISTS refund_adjustment (
    refund_id              BINARY(16)  NOT NULL,
    payment_id             BINARY(16)  NOT NULL,
    type                   VARCHAR(20) NOT NULL,
    status                 VARCHAR(20) NOT NULL,
    amount                 FLOAT       NOT NULL,
    reason                 VARCHAR(255),
    created_at             DATETIME(6) NOT NULL,
    processed_at           DATETIME(6),
    processed_by_staff_id  BINARY(16),
    PRIMARY KEY (refund_id),
    CONSTRAINT fk_refund_adj_payment FOREIGN KEY (payment_id)           REFERENCES payment (payment_id),
    CONSTRAINT fk_refund_adj_staff   FOREIGN KEY (processed_by_staff_id) REFERENCES staff  (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 11: TABLES DEPENDING ON parcel + payment + staff
-- =============================================================

CREATE TABLE IF NOT EXISTS risk_alert (
    risk_alert_id        BINARY(16)   NOT NULL,
    parcel_id            BINARY(16),
    payment_id           BINARY(16),
    alert_type           VARCHAR(30)  NOT NULL,
    severity             VARCHAR(20)  NOT NULL,
    status               VARCHAR(20)  NOT NULL,
    resolved             BIT(1)       NOT NULL DEFAULT 0,
    description          VARCHAR(500),
    created_at           DATETIME(6)  NOT NULL,
    updated_at           DATETIME(6),
    reviewed_by_staff_id BINARY(16),
    ai_confidence_score  FLOAT,
    ai_reasoning         TEXT,
    PRIMARY KEY (risk_alert_id),
    CONSTRAINT fk_risk_alert_parcel  FOREIGN KEY (parcel_id)            REFERENCES parcel  (parcel_id),
    CONSTRAINT fk_risk_alert_payment FOREIGN KEY (payment_id)           REFERENCES payment (payment_id),
    CONSTRAINT fk_risk_alert_staff   FOREIGN KEY (reviewed_by_staff_id) REFERENCES staff   (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 12: DELIVERY RECEIPT (depends on parcel + delivery_proof)
-- =============================================================

CREATE TABLE IF NOT EXISTS delivery_receipt (
    receipt_id             BINARY(16)   NOT NULL,
    parcel_id              BINARY(16)   NOT NULL,
    proof_id               BINARY(16),
    receipt_number         VARCHAR(50)  NOT NULL,
    receiver_name          VARCHAR(100),
    receiver_signature_url VARCHAR(255),
    delivery_address       VARCHAR(500),
    courier_name           VARCHAR(100),
    total_amount           DOUBLE,
    payment_collected      BIT(1)       NOT NULL DEFAULT 0,
    payment_method         VARCHAR(30),
    pdf_url                VARCHAR(255),
    delivered_at           DATETIME(6)  NOT NULL,
    generated_at           DATETIME(6)  NOT NULL,
    PRIMARY KEY (receipt_id),
    UNIQUE KEY uq_receipt_parcel (parcel_id),
    UNIQUE KEY uq_receipt_number (receipt_number),
    CONSTRAINT fk_receipt_parcel FOREIGN KEY (parcel_id) REFERENCES parcel         (parcel_id),
    CONSTRAINT fk_receipt_proof  FOREIGN KEY (proof_id)  REFERENCES delivery_proof (pod_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 13: AI / ML TABLES (depend on staff)
-- =============================================================

CREATE TABLE IF NOT EXISTS ai_agent_recommendation (
    recommendation_id BINARY(16)   NOT NULL,
    module_type       VARCHAR(20)  NOT NULL,
    subject_type      VARCHAR(20)  NOT NULL,
    subject_id        BINARY(16)   NOT NULL,
    summary           VARCHAR(255),
    payload_json      JSON         NOT NULL,
    created_at        DATETIME(6)  NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    reviewed_at       DATETIME(6),
    reviewed_by       BINARY(16),
    execution_result  VARCHAR(500),
    PRIMARY KEY (recommendation_id),
    CONSTRAINT fk_ai_rec_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_agent_state (
    agent_state_id     BINARY(16)  NOT NULL,
    module_type        VARCHAR(20) NOT NULL,
    subject_type       VARCHAR(20) NOT NULL,
    subject_id         BINARY(16)  NOT NULL,
    confidence_score   FLOAT       NOT NULL DEFAULT 0.5,
    risk_score         FLOAT,
    state_data         JSON,
    last_evaluation_at DATETIME(6),
    evaluation_count   INT         NOT NULL DEFAULT 0,
    created_at         DATETIME(6) NOT NULL,
    updated_at         DATETIME(6),
    PRIMARY KEY (agent_state_id),
    UNIQUE KEY uq_ai_agent_state (module_type, subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_decision_log (
    decision_id      BINARY(16)   NOT NULL,
    module_type      VARCHAR(20)  NOT NULL,
    decision_type    VARCHAR(100) NOT NULL,
    subject_type     VARCHAR(20)  NOT NULL,
    subject_id       BINARY(16)   NOT NULL,
    input_data       JSON,
    decision_outcome VARCHAR(50)  NOT NULL,
    confidence_score FLOAT        NOT NULL,
    reasoning        TEXT,
    was_overridden   BIT(1)       NOT NULL DEFAULT 0,
    overridden_by    BINARY(16),
    override_reason  VARCHAR(500),
    created_at       DATETIME(6)  NOT NULL,
    PRIMARY KEY (decision_id),
    CONSTRAINT fk_ai_dec_overridden_by FOREIGN KEY (overridden_by) REFERENCES staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- ai_execution_log depends on ai_agent_recommendation + ai_decision_log

CREATE TABLE IF NOT EXISTS ai_execution_log (
    execution_id      BINARY(16)   NOT NULL,
    recommendation_id BINARY(16),
    decision_id       BINARY(16),
    action_type       VARCHAR(100) NOT NULL,
    target_type       VARCHAR(30)  NOT NULL,
    target_id         BINARY(16),
    execution_status  VARCHAR(20)  NOT NULL,
    started_at        DATETIME(6)  NOT NULL,
    completed_at      DATETIME(6),
    result_summary    VARCHAR(500),
    error_message     TEXT,
    rollback_data     JSON,
    PRIMARY KEY (execution_id),
    CONSTRAINT fk_ai_exec_recommendation FOREIGN KEY (recommendation_id) REFERENCES ai_agent_recommendation (recommendation_id),
    CONSTRAINT fk_ai_exec_decision       FOREIGN KEY (decision_id)       REFERENCES ai_decision_log        (decision_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS anomaly_event (
    anomaly_id        BINARY(16)   NOT NULL,
    anomaly_type      VARCHAR(30)  NOT NULL,
    severity          VARCHAR(20)  NOT NULL,
    subject_type      VARCHAR(20)  NOT NULL,
    subject_id        BINARY(16),
    description       VARCHAR(500) NOT NULL,
    detection_method  VARCHAR(100),
    raw_data          JSON,
    status            VARCHAR(20)  NOT NULL DEFAULT 'DETECTED',
    escalation_level  TINYINT      NOT NULL DEFAULT 0,
    created_at        DATETIME(6)  NOT NULL,
    acknowledged_at   DATETIME(6),
    acknowledged_by   BINARY(16),
    resolved_at       DATETIME(6),
    resolved_by       BINARY(16),
    resolution_notes  TEXT,
    PRIMARY KEY (anomaly_id),
    CONSTRAINT fk_anomaly_ack_by FOREIGN KEY (acknowledged_by) REFERENCES staff (staff_id),
    CONSTRAINT fk_anomaly_res_by FOREIGN KEY (resolved_by)     REFERENCES staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS compliance_report (
    compliance_report_id  BINARY(16)  NOT NULL,
    period_start          DATE        NOT NULL,
    period_end            DATE        NOT NULL,
    generated_at          DATETIME(6) NOT NULL,
    generated_by_staff_id BINARY(16),
    status                VARCHAR(20) NOT NULL,
    file_url              VARCHAR(255),
    PRIMARY KEY (compliance_report_id),
    CONSTRAINT fk_compliance_staff FOREIGN KEY (generated_by_staff_id) REFERENCES staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS escalation_history (
    escalation_id  BINARY(16)   NOT NULL,
    source_type    VARCHAR(30)  NOT NULL,
    source_id      BINARY(16)   NOT NULL,
    from_level     TINYINT      NOT NULL,
    to_level       TINYINT      NOT NULL,
    escalated_by   BINARY(16),
    reason         VARCHAR(500),
    auto_escalated BIT(1)       NOT NULL DEFAULT 0,
    escalated_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (escalation_id),
    CONSTRAINT fk_escalation_staff FOREIGN KEY (escalated_by) REFERENCES staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- SECTION 14: CONVERSATION TABLES (conversation depends on staff)
-- =============================================================

CREATE TABLE IF NOT EXISTS conversation (
    conversation_id BINARY(16)  NOT NULL,
    user_type       VARCHAR(20) NOT NULL,
    user_id         BINARY(16)  NOT NULL,
    channel         VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    started_at      DATETIME(6) NOT NULL,
    last_message_at DATETIME(6),
    closed_at       DATETIME(6),
    escalated_to    BINARY(16),
    context_data    JSON,
    PRIMARY KEY (conversation_id),
    CONSTRAINT fk_conversation_staff FOREIGN KEY (escalated_to) REFERENCES staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS conversation_message (
    message_id         BINARY(16)   NOT NULL,
    conversation_id    BINARY(16)   NOT NULL,
    role               VARCHAR(20)  NOT NULL,
    content            TEXT         NOT NULL,
    timestamp          DATETIME(6)  NOT NULL,
    detected_intent    VARCHAR(100),
    detected_entities  JSON,
    action_taken       VARCHAR(100),
    action_result      JSON,
    token_count        INT,
    processing_time_ms INT,
    PRIMARY KEY (message_id),
    CONSTRAINT fk_conv_message_conv FOREIGN KEY (conversation_id) REFERENCES conversation (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- END OF SCHEMA — 46 tables total
-- =============================================================
