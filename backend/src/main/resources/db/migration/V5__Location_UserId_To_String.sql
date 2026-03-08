-- V5: Location userId conversion from BIGINT to VARCHAR(64)
-- Supports UUID-based principal names instead of legacy Long IDs
ALTER TABLE locations MODIFY COLUMN user_id VARCHAR(64) NULL;
