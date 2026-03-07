-- V4.0: Add denormalized current location fields to parcel table
-- These fields are updated on every scan event to track parcel's last known GPS position

ALTER TABLE parcel
    ADD COLUMN current_latitude DECIMAL(10,8) DEFAULT NULL,
    ADD COLUMN current_longitude DECIMAL(11,8) DEFAULT NULL,
    ADD COLUMN location_updated_at TIMESTAMP NULL DEFAULT NULL;

-- Backfill existing parcels with their last scan event GPS
UPDATE parcel p
    INNER JOIN (
        SELECT se.parcel_id, se.latitude, se.longitude, se.timestamp
        FROM scan_event se
        INNER JOIN (
            SELECT parcel_id, MAX(timestamp) AS max_ts
            FROM scan_event
            GROUP BY parcel_id
        ) latest ON se.parcel_id = latest.parcel_id AND se.timestamp = latest.max_ts
    ) last_scan ON p.parcel_id = last_scan.parcel_id
SET p.current_latitude = last_scan.latitude,
    p.current_longitude = last_scan.longitude,
    p.location_updated_at = last_scan.timestamp;
