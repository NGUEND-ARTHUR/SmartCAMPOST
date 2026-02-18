-- =========================================================
-- V3.0 Entity-Schema Alignment Migration
-- Run this on TiDB Cloud BEFORE deploying the updated backend
-- Fixes all mismatches between JPA entities and SQL schema
-- =========================================================

-- ---------------------------------------------------------
-- 1) pickup_request: Add GPS location columns used by entity
-- ---------------------------------------------------------
ALTER TABLE pickup_request ADD COLUMN pickup_latitude DECIMAL(10,8) NULL;
ALTER TABLE pickup_request ADD COLUMN pickup_longitude DECIMAL(11,8) NULL;
ALTER TABLE pickup_request ADD COLUMN location_mode VARCHAR(30) NULL;

-- ---------------------------------------------------------
-- 2) scan_event: Add offline sync columns used by entity
-- ---------------------------------------------------------
ALTER TABLE scan_event ADD COLUMN is_synced BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE scan_event ADD COLUMN offline_created_at TIMESTAMP NULL;
ALTER TABLE scan_event ADD COLUMN synced_at TIMESTAMP NULL;

-- ---------------------------------------------------------
-- 3) courier: Extend ENUM to include Java enum values
-- ---------------------------------------------------------
ALTER TABLE courier MODIFY COLUMN status ENUM('AVAILABLE','BUSY','OFFLINE','ON_ROUTE','INACTIVE') NOT NULL;

-- ---------------------------------------------------------
-- 4) payment: ENUM already includes INIT — no change needed
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 5) notification: ENUM already includes DELAY_WARNING,
--    CONGESTION_ALERT, AI_RECOMMENDATION — no change needed
--    Fix message column: already TEXT — no change needed
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 6) refund_adjustment: ENUM already includes PENDING,
--    COMPLETED — no change needed
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- Done. All JPA entities now align with the database schema.
-- ---------------------------------------------------------
