-- =========================================================
-- SmartCAMPOST • MIGRATION SCRIPT v2.0
-- Safe migration from existing schema to evolved schema
-- For TiDB Cloud (MySQL 8.0 Compatible)
-- Date: 2026-02-18
-- =========================================================
-- IMPORTANT: This script is ADDITIVE ONLY - no data is deleted.
-- Run this script against your existing database to upgrade.
-- =========================================================

-- =========================================================
-- STEP 1: ALTER EXISTING TABLES - ADD NEW COLUMNS
-- =========================================================

-- 1.1 AGENCY - Add AI/Analytics fields
ALTER TABLE agency
  ADD COLUMN IF NOT EXISTS capacity_limit INT NULL COMMENT 'Max parcels the agency can handle' AFTER country,
  ADD COLUMN IF NOT EXISTS is_hub BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is this a major hub' AFTER capacity_limit;

-- 1.2 COURIER - Add GPS tracking fields
ALTER TABLE courier
  ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10,8) NULL COMMENT 'Last known GPS latitude' AFTER status,
  ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11,8) NULL COMMENT 'Last known GPS longitude' AFTER current_latitude,
  ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMP NULL COMMENT 'Last GPS update timestamp' AFTER current_longitude;

-- 1.3 PARCEL - Add QR, GPS, and validation fields
-- First, modify status ENUM to include new statuses
ALTER TABLE parcel
  MODIFY COLUMN status ENUM('CREATED','ACCEPTED','TAKEN_IN_CHARGE','IN_TRANSIT','ARRIVED_HUB',
                            'ARRIVED_DEST_AGENCY','OUT_FOR_DELIVERY','DELIVERED',
                            'PICKED_UP_AT_AGENCY','RETURNED','RETURNED_TO_SENDER','CANCELLED')
                       NOT NULL DEFAULT 'CREATED';

-- Add new parcel columns
ALTER TABLE parcel
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(80) NULL COMMENT 'Alias for tracking_ref' AFTER tracking_ref,
  ADD COLUMN IF NOT EXISTS qr_status ENUM('PARTIAL','FINAL','INVALIDATED') NOT NULL DEFAULT 'PARTIAL' AFTER payment_option,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE AFTER qr_status,
  ADD COLUMN IF NOT EXISTS partial_qr_code VARCHAR(500) NULL AFTER is_locked,
  ADD COLUMN IF NOT EXISTS final_qr_code VARCHAR(500) NULL AFTER partial_qr_code,
  ADD COLUMN IF NOT EXISTS creation_latitude DECIMAL(10,8) NULL AFTER final_qr_code,
  ADD COLUMN IF NOT EXISTS creation_longitude DECIMAL(11,8) NULL AFTER creation_latitude,
  ADD COLUMN IF NOT EXISTS location_mode ENUM('GPS_DEFAULT','MANUAL_OVERRIDE','NO_GPS') DEFAULT 'GPS_DEFAULT' AFTER creation_longitude,
  ADD COLUMN IF NOT EXISTS validation_comment VARCHAR(1000) NULL COMMENT 'Agent validation notes' AFTER validated_dimensions,
  ADD COLUMN IF NOT EXISTS description_confirmed BOOLEAN NULL COMMENT 'Agent confirmed description' AFTER validation_comment;

-- Modify description_comment to allow longer text
ALTER TABLE parcel
  MODIFY COLUMN description_comment VARCHAR(1000) NULL COMMENT 'Parcel description from client';

-- Rename validated_by_agent_id to validated_by_staff_id if it exists (compatibility)
-- Note: This needs careful handling - check if column exists first
-- If your schema has validated_by_agent_id, run this manually:
-- ALTER TABLE parcel CHANGE COLUMN validated_by_agent_id validated_by_staff_id BINARY(16) NULL;

-- Add index for QR status
CREATE INDEX IF NOT EXISTS ix_parcel_qr_status ON parcel(qr_status);
CREATE INDEX IF NOT EXISTS ix_parcel_created_at ON parcel(created_at);

-- 1.4 SCAN_EVENT - Add GPS, Actor, and Proof fields
-- First, modify event_type ENUM
ALTER TABLE scan_event
  MODIFY COLUMN event_type ENUM(
    'CREATED','ACCEPTED','AT_ORIGIN_AGENCY','TAKEN_IN_CHARGE',
    'IN_TRANSIT','ARRIVED_HUB','DEPARTED_HUB',
    'ARRIVED_DESTINATION','ARRIVED_DEST_AGENCY',
    'OUT_FOR_DELIVERY','DELIVERED','PICKED_UP_AT_AGENCY',
    'RETURNED','RETURNED_TO_SENDER','DELIVERY_FAILED',
    'RESCHEDULED','CANCELLED',
    'OTP_SENT','OTP_VERIFIED','PROOF_CAPTURED'
  ) NOT NULL;

-- Add new scan_event columns
ALTER TABLE scan_event
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) NOT NULL DEFAULT 0.0 COMMENT 'GPS latitude' AFTER location_note,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) NOT NULL DEFAULT 0.0 COMMENT 'GPS longitude' AFTER latitude,
  ADD COLUMN IF NOT EXISTS location_source ENUM('DEVICE_GPS','MANUAL','NETWORK','CACHED') NOT NULL DEFAULT 'DEVICE_GPS' AFTER longitude,
  ADD COLUMN IF NOT EXISTS device_timestamp TIMESTAMP NULL COMMENT 'Timestamp from scanning device' AFTER location_source,
  ADD COLUMN IF NOT EXISTS actor_id VARCHAR(64) NULL COMMENT 'UUID or identifier of actor' AFTER device_timestamp,
  ADD COLUMN IF NOT EXISTS actor_role VARCHAR(40) NULL COMMENT 'AGENT, COURIER, SYSTEM, etc.' AFTER actor_id,
  ADD COLUMN IF NOT EXISTS proof_url VARCHAR(500) NULL COMMENT 'URL to photo/signature proof' AFTER actor_role,
  ADD COLUMN IF NOT EXISTS comment VARCHAR(1000) NULL COMMENT 'Additional notes' AFTER proof_url,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) NULL COMMENT 'Scan source (APP, SCANNER, etc.)' AFTER comment,
  ADD COLUMN IF NOT EXISTS scan_type VARCHAR(60) NULL AFTER source,
  ADD COLUMN IF NOT EXISTS scanned_by VARCHAR(64) NULL AFTER scan_type,
  ADD COLUMN IF NOT EXISTS role VARCHAR(40) NULL AFTER scanned_by,
  ADD COLUMN IF NOT EXISTS address VARCHAR(500) NULL AFTER role;

-- Add index for actor
CREATE INDEX IF NOT EXISTS ix_scan_actor ON scan_event(actor_id, actor_role);

-- 1.5 RISK_ALERT - Extend alert types and add AI fields
ALTER TABLE risk_alert
  MODIFY COLUMN alert_type ENUM('AML_FLAG','HIGH_VALUE','MULTIPLE_FAILED_PAYMENTS',
                                 'DELIVERY_DELAY','REPEATED_DELIVERY_FAILURE',
                                 'ANOMALY_DETECTED','FRAUD_SUSPECTED','OTHER') NOT NULL;

ALTER TABLE risk_alert
  MODIFY COLUMN description VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS ai_confidence_score FLOAT NULL COMMENT 'AI confidence in this alert (0-1)' AFTER reviewed_by_staff_id,
  ADD COLUMN IF NOT EXISTS ai_reasoning TEXT NULL COMMENT 'AI explanation for the alert' AFTER ai_confidence_score;

CREATE INDEX IF NOT EXISTS ix_risk_type ON risk_alert(alert_type);

-- 1.6 NOTIFICATION - Add new notification types
ALTER TABLE notification
  MODIFY COLUMN type ENUM(
    'PICKUP_REQUESTED','PICKUP_COMPLETED','PARCEL_DELIVERED','MANUAL',
    'PARCEL_CREATED','PARCEL_ACCEPTED','PARCEL_IN_TRANSIT',
    'PARCEL_ARRIVED_DESTINATION','PARCEL_OUT_FOR_DELIVERY',
    'PARCEL_RETURNED','PAYMENT_CONFIRMED','DELIVERY_OPTION_CHANGED',
    'REMINDER_NOT_COLLECTED','DELIVERY_OTP',
    'DELAY_WARNING','CONGESTION_ALERT','AI_RECOMMENDATION'
  ) NOT NULL;

-- 1.7 INTEGRATION_CONFIG - Add AI integration type
ALTER TABLE integration_config
  MODIFY COLUMN integration_type ENUM('PAYMENT','SMS','USSD','MAPS','NPSI','ANALYTICS','AI','OTHER') NOT NULL;


-- =========================================================
-- STEP 2: CREATE NEW TABLES
-- =========================================================

-- 2.1 LOCATIONS (Real-time GPS tracking)
CREATE TABLE IF NOT EXISTS locations (
  id          BIGINT AUTO_INCREMENT NOT NULL,
  user_id     BIGINT        NULL COMMENT 'courier or agent user ID',
  latitude    DECIMAL(10,8) NULL,
  longitude   DECIMAL(11,8) NULL,
  address     VARCHAR(500)  NULL,
  source      VARCHAR(20)   NULL COMMENT 'GPS or MANUAL',
  timestamp   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_locations PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS ix_locations_user ON locations(user_id);
CREATE INDEX IF NOT EXISTS ix_locations_time ON locations(timestamp);


-- 2.2 AI_AGENT_RECOMMENDATION
CREATE TABLE IF NOT EXISTS ai_agent_recommendation (
  recommendation_id  BINARY(16)   NOT NULL,
  module_type        ENUM('COURIER','AGENCY','RISK','PREDICTIVE','GENERAL') NOT NULL,
  subject_type       ENUM('COURIER','AGENCY','PARCEL','PAYMENT','CLIENT','SYSTEM') NOT NULL,
  subject_id         BINARY(16)   NOT NULL COMMENT 'ID of the entity being recommended about',
  summary            VARCHAR(255) NULL COMMENT 'Human-readable summary',
  payload_json       JSON         NOT NULL COMMENT 'Full recommendation payload',
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status             ENUM('PENDING','APPROVED','EXECUTED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  reviewed_at        TIMESTAMP    NULL,
  reviewed_by        BINARY(16)   NULL,
  execution_result   VARCHAR(500) NULL COMMENT 'Result after execution',
  CONSTRAINT pk_ai_recommendation PRIMARY KEY (recommendation_id),
  CONSTRAINT fk_ai_rec_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS ix_ai_rec_module ON ai_agent_recommendation(module_type);
CREATE INDEX IF NOT EXISTS ix_ai_rec_subject ON ai_agent_recommendation(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS ix_ai_rec_status ON ai_agent_recommendation(status);
CREATE INDEX IF NOT EXISTS ix_ai_rec_created ON ai_agent_recommendation(created_at);


-- 2.3 AI_AGENT_STATE
CREATE TABLE IF NOT EXISTS ai_agent_state (
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

CREATE INDEX IF NOT EXISTS ix_ai_state_module ON ai_agent_state(module_type);
CREATE INDEX IF NOT EXISTS ix_ai_state_subject ON ai_agent_state(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS ix_ai_state_confidence ON ai_agent_state(confidence_score);


-- 2.4 AI_DECISION_LOG
CREATE TABLE IF NOT EXISTS ai_decision_log (
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

CREATE INDEX IF NOT EXISTS ix_ai_decision_module ON ai_decision_log(module_type);
CREATE INDEX IF NOT EXISTS ix_ai_decision_subject ON ai_decision_log(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS ix_ai_decision_created ON ai_decision_log(created_at);
CREATE INDEX IF NOT EXISTS ix_ai_decision_type ON ai_decision_log(decision_type);


-- 2.5 AI_EXECUTION_LOG
CREATE TABLE IF NOT EXISTS ai_execution_log (
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

CREATE INDEX IF NOT EXISTS ix_ai_exec_rec ON ai_execution_log(recommendation_id);
CREATE INDEX IF NOT EXISTS ix_ai_exec_decision ON ai_execution_log(decision_id);
CREATE INDEX IF NOT EXISTS ix_ai_exec_status ON ai_execution_log(execution_status);
CREATE INDEX IF NOT EXISTS ix_ai_exec_started ON ai_execution_log(started_at);


-- 2.6 PREDICTIVE_RESULT
CREATE TABLE IF NOT EXISTS predictive_result (
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

CREATE INDEX IF NOT EXISTS ix_pred_type ON predictive_result(prediction_type);
CREATE INDEX IF NOT EXISTS ix_pred_subject ON predictive_result(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS ix_pred_created ON predictive_result(created_at);
CREATE INDEX IF NOT EXISTS ix_pred_valid ON predictive_result(valid_until);


-- 2.7 HISTORICAL_DELIVERY_EVENT
CREATE TABLE IF NOT EXISTS historical_delivery_event (
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

CREATE INDEX IF NOT EXISTS ix_hist_parcel ON historical_delivery_event(parcel_id);
CREATE INDEX IF NOT EXISTS ix_hist_courier ON historical_delivery_event(courier_id);
CREATE INDEX IF NOT EXISTS ix_hist_origin ON historical_delivery_event(origin_agency_id);
CREATE INDEX IF NOT EXISTS ix_hist_dest ON historical_delivery_event(dest_agency_id);
CREATE INDEX IF NOT EXISTS ix_hist_delivered ON historical_delivery_event(delivered_at);


-- 2.8 PERFORMANCE_METRIC
CREATE TABLE IF NOT EXISTS performance_metric (
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

CREATE INDEX IF NOT EXISTS ix_perf_type ON performance_metric(metric_type);
CREATE INDEX IF NOT EXISTS ix_perf_subject ON performance_metric(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS ix_perf_period ON performance_metric(period_type, period_start);


-- 2.9 ANOMALY_EVENT
CREATE TABLE IF NOT EXISTS anomaly_event (
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

CREATE INDEX IF NOT EXISTS ix_anomaly_type ON anomaly_event(anomaly_type);
CREATE INDEX IF NOT EXISTS ix_anomaly_severity ON anomaly_event(severity);
CREATE INDEX IF NOT EXISTS ix_anomaly_status ON anomaly_event(status);
CREATE INDEX IF NOT EXISTS ix_anomaly_subject ON anomaly_event(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS ix_anomaly_created ON anomaly_event(created_at);


-- 2.10 AUDIT_LOG
CREATE TABLE IF NOT EXISTS audit_log (
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

CREATE INDEX IF NOT EXISTS ix_audit_action ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS ix_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ix_audit_actor ON audit_log(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS ix_audit_timestamp ON audit_log(timestamp);


-- 2.11 ESCALATION_HISTORY
CREATE TABLE IF NOT EXISTS escalation_history (
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

CREATE INDEX IF NOT EXISTS ix_escalation_source ON escalation_history(source_type, source_id);
CREATE INDEX IF NOT EXISTS ix_escalation_time ON escalation_history(escalated_at);


-- 2.12 SYSTEM_EVENT (Event-driven architecture)
CREATE TABLE IF NOT EXISTS system_event (
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

CREATE INDEX IF NOT EXISTS ix_event_category ON system_event(event_category);
CREATE INDEX IF NOT EXISTS ix_event_type ON system_event(event_type);
CREATE INDEX IF NOT EXISTS ix_event_entity ON system_event(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ix_event_status ON system_event(processing_status);
CREATE INDEX IF NOT EXISTS ix_event_created ON system_event(created_at);
CREATE INDEX IF NOT EXISTS ix_event_priority ON system_event(priority, created_at);
CREATE INDEX IF NOT EXISTS ix_event_correlation ON system_event(correlation_id);


-- 2.13 EVENT_SUBSCRIPTION
CREATE TABLE IF NOT EXISTS event_subscription (
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

CREATE INDEX IF NOT EXISTS ix_sub_category ON event_subscription(event_category);
CREATE INDEX IF NOT EXISTS ix_sub_active ON event_subscription(active);


-- 2.14 CONVERSATION
CREATE TABLE IF NOT EXISTS conversation (
  conversation_id    BINARY(16)   NOT NULL,
  user_type          ENUM('CLIENT','AGENT','STAFF','COURIER','ADMIN') NOT NULL,
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

CREATE INDEX IF NOT EXISTS ix_conv_user ON conversation(user_type, user_id);
CREATE INDEX IF NOT EXISTS ix_conv_status ON conversation(status);
CREATE INDEX IF NOT EXISTS ix_conv_started ON conversation(started_at);


-- 2.15 CONVERSATION_MESSAGE
CREATE TABLE IF NOT EXISTS conversation_message (
  message_id         BINARY(16)   NOT NULL,
  conversation_id    BINARY(16)   NOT NULL,
  role               ENUM('SYSTEM','USER','ASSISTANT') NOT NULL,
  content            TEXT         NOT NULL,
  timestamp          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detected_intent    VARCHAR(100) NULL,
  detected_entities  JSON         NULL COMMENT 'Extracted entities',
  action_taken       VARCHAR(100) NULL,
  action_result      JSON         NULL,
  token_count        INT          NULL,
  processing_time_ms INT          NULL,
  CONSTRAINT pk_conv_message PRIMARY KEY (message_id),
  CONSTRAINT fk_conv_message_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversation(conversation_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS ix_conv_msg_conversation ON conversation_message(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS ix_conv_msg_role ON conversation_message(role);
CREATE INDEX IF NOT EXISTS ix_conv_msg_intent ON conversation_message(detected_intent);


-- 2.16 INTENT_ACTION_MAPPING
CREATE TABLE IF NOT EXISTS intent_action_mapping (
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

CREATE INDEX IF NOT EXISTS ix_intent_name ON intent_action_mapping(intent_name);
CREATE INDEX IF NOT EXISTS ix_intent_active ON intent_action_mapping(active);


-- =========================================================
-- STEP 3: CREATE VIEWS
-- =========================================================

-- Active parcels with tracking info
CREATE OR REPLACE VIEW v_active_parcels AS
SELECT
  p.parcel_id,
  p.tracking_ref,
  p.status,
  p.service_type,
  p.created_at,
  p.expected_delivery_at,
  c.full_name AS client_name,
  c.phone AS client_phone,
  oa.agency_name AS origin_agency,
  da.agency_name AS destination_agency
FROM parcel p
JOIN client c ON p.client_id = c.client_id
LEFT JOIN agency oa ON p.origin_agency_id = oa.agency_id
LEFT JOIN agency da ON p.destination_agency_id = da.agency_id
WHERE p.status NOT IN ('DELIVERED','PICKED_UP_AT_AGENCY','RETURNED','RETURNED_TO_SENDER','CANCELLED');


-- Agency congestion status
CREATE OR REPLACE VIEW v_agency_congestion AS
SELECT
  a.agency_id,
  a.agency_name,
  a.region,
  a.capacity_limit,
  COUNT(p.parcel_id) AS parcel_count,
  CASE
    WHEN a.capacity_limit IS NOT NULL AND a.capacity_limit > 0
    THEN COUNT(p.parcel_id) / a.capacity_limit
    ELSE NULL
  END AS congestion_level
FROM agency a
LEFT JOIN parcel p ON p.destination_agency_id = a.agency_id
  AND p.status IN ('ARRIVED_DEST_AGENCY','ARRIVED_HUB')
GROUP BY a.agency_id, a.agency_name, a.region, a.capacity_limit;


-- Courier performance summary
CREATE OR REPLACE VIEW v_courier_performance AS
SELECT
  c.courier_id,
  c.full_name,
  c.status,
  COUNT(DISTINCT da.parcel_id) AS total_deliveries,
  SUM(CASE WHEN da.result = 'SUCCESS' THEN 1 ELSE 0 END) AS successful_deliveries,
  SUM(CASE WHEN da.result != 'SUCCESS' THEN 1 ELSE 0 END) AS failed_deliveries
FROM courier c
LEFT JOIN delivery_attempt da ON c.courier_id = da.courier_id
GROUP BY c.courier_id, c.full_name, c.status;


-- =========================================================
-- STEP 4: SEED DATA FOR NEW TABLES
-- =========================================================

-- Default intent-action mappings for AI assistant
INSERT IGNORE INTO intent_action_mapping (mapping_id, intent_name, action_name, required_entities, is_automated, requires_confirmation, active)
VALUES
  (UNHEX(REPLACE('10000000-0000-0000-0000-000000000001', '-', '')), 'TRACK_PARCEL', 'lookup_parcel_status', '["tracking_ref"]', TRUE, FALSE, TRUE),
  (UNHEX(REPLACE('10000000-0000-0000-0000-000000000002', '-', '')), 'DELIVERY_ISSUE', 'create_support_ticket', '["tracking_ref", "issue_description"]', TRUE, TRUE, TRUE),
  (UNHEX(REPLACE('10000000-0000-0000-0000-000000000003', '-', '')), 'PAYMENT_INQUIRY', 'lookup_payment_status', '["tracking_ref"]', TRUE, FALSE, TRUE),
  (UNHEX(REPLACE('10000000-0000-0000-0000-000000000004', '-', '')), 'PICKUP_REQUEST', 'create_pickup_request', '["address", "date", "time_window"]', TRUE, TRUE, TRUE),
  (UNHEX(REPLACE('10000000-0000-0000-0000-000000000005', '-', '')), 'ACCOUNT_HELP', 'get_account_info', '[]', TRUE, FALSE, TRUE);

-- Default event subscriptions for AI agents
INSERT IGNORE INTO event_subscription (subscription_id, subscriber_name, event_category, event_type_filter, active, handler_class)
VALUES
  (UNHEX(REPLACE('20000000-0000-0000-0000-000000000001', '-', '')), 'CourierAgentSubscriber', 'SCAN', 'DELIVERED,DELIVERY_FAILED', TRUE, 'com.smartcampost.backend.ai.listeners.CourierAgentListener'),
  (UNHEX(REPLACE('20000000-0000-0000-0000-000000000002', '-', '')), 'AgencyAgentSubscriber', 'SCAN', 'ARRIVED_HUB,ARRIVED_DEST_AGENCY', TRUE, 'com.smartcampost.backend.ai.listeners.AgencyAgentListener'),
  (UNHEX(REPLACE('20000000-0000-0000-0000-000000000003', '-', '')), 'RiskAgentSubscriber', 'ALL', NULL, TRUE, 'com.smartcampost.backend.ai.listeners.RiskAgentListener');


-- =========================================================
-- MIGRATION COMPLETE
-- =========================================================
-- To verify, run:
-- SHOW TABLES;
-- SELECT COUNT(*) FROM ai_agent_recommendation;
-- SELECT COUNT(*) FROM system_event;
-- =========================================================
