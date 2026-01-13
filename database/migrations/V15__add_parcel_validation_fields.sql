-- =========================================================
-- SmartCAMPOST - SPRINT 15 Migration
-- Parcel Validation Fields
-- =========================================================
-- This migration adds fields to support the parcel validation workflow
-- where agents/couriers validate parcel details before acceptance.
-- =========================================================

-- Add validation-related columns to parcel table
ALTER TABLE parcel
  ADD COLUMN validated_weight       FLOAT         NULL COMMENT 'Weight confirmed by agent during acceptance',
  ADD COLUMN validated_dimensions   VARCHAR(50)   NULL COMMENT 'Dimensions confirmed by agent during acceptance',
  ADD COLUMN validation_comment     VARCHAR(1000) NULL COMMENT 'Agent notes during validation/acceptance',
  ADD COLUMN description_confirmed  BOOLEAN       NULL COMMENT 'Agent confirmed parcel description is accurate',
  ADD COLUMN validated_at           TIMESTAMP     NULL COMMENT 'Timestamp when parcel was validated/accepted',
  ADD COLUMN validated_by_staff_id  BINARY(16)    NULL COMMENT 'Staff (agent/courier) who validated the parcel';

-- Add foreign key constraint for validated_by_staff_id
ALTER TABLE parcel
  ADD CONSTRAINT fk_parcel_validated_by
    FOREIGN KEY (validated_by_staff_id) REFERENCES staff(staff_id)
    ON UPDATE CASCADE ON DELETE SET NULL;

-- Create index for quick lookup of parcels validated by a specific staff member
CREATE INDEX ix_parcel_validated_by ON parcel(validated_by_staff_id);

-- Optional: Index on validation timestamp for analytics
CREATE INDEX ix_parcel_validated_at ON parcel(validated_at);

-- =========================================================
-- ROLLBACK SCRIPT (if needed):
-- =========================================================
-- ALTER TABLE parcel DROP FOREIGN KEY fk_parcel_validated_by;
-- ALTER TABLE parcel DROP INDEX ix_parcel_validated_by;
-- ALTER TABLE parcel DROP INDEX ix_parcel_validated_at;
-- ALTER TABLE parcel 
--   DROP COLUMN validated_weight,
--   DROP COLUMN validated_dimensions,
--   DROP COLUMN validation_comment,
--   DROP COLUMN description_confirmed,
--   DROP COLUMN validated_at,
--   DROP COLUMN validated_by_staff_id;
