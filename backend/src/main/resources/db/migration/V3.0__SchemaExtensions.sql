-- ============================================================================
-- V3.0 Migration: Schema Extensions for Enhanced Features
-- Date: 2026-02-18
-- Description: Add missing columns for pickup location modes and sync tracking
-- ============================================================================

-- Add location mode support to pickup_request
ALTER TABLE pickup_request ADD COLUMN pickup_latitude DECIMAL(10, 8) NULL;
ALTER TABLE pickup_request ADD COLUMN pickup_longitude DECIMAL(11, 8) NULL;
ALTER TABLE pickup_request ADD COLUMN location_mode VARCHAR(30) NULL;

-- Add offline sync tracking to scan_event
ALTER TABLE scan_event ADD COLUMN is_synced BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE scan_event ADD COLUMN offline_created_at TIMESTAMP NULL;
ALTER TABLE scan_event ADD COLUMN synced_at TIMESTAMP NULL;

-- Extend courier status enum to include new statuses
ALTER TABLE courier MODIFY COLUMN status ENUM('AVAILABLE', 'BUSY', 'OFFLINE', 'ON_ROUTE', 'INACTIVE') NOT NULL;

-- Create indexes for new columns to improve query performance
CREATE INDEX idx_pickup_location_mode ON pickup_request(location_mode);
CREATE INDEX idx_scan_is_synced ON scan_event(is_synced);
CREATE INDEX idx_scan_synced_at ON scan_event(synced_at);
