-- Render production hotfix: add missing verification-tracking columns to qr_verification_token.
-- Uses ADD COLUMN IF NOT EXISTS (MySQL 8.0+). Safe to run multiple times.

ALTER TABLE qr_verification_token
    ADD COLUMN IF NOT EXISTS last_verified_at  DATETIME(6)    NULL,
    ADD COLUMN IF NOT EXISTS verification_count INT           NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS valid              BIT(1)        NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS revocation_reason  VARCHAR(255)  NULL,
    ADD COLUMN IF NOT EXISTS last_verified_by   BINARY(16)    NULL,
    ADD COLUMN IF NOT EXISTS last_client_ip     VARCHAR(45)   NULL,
    ADD COLUMN IF NOT EXISTS last_user_agent    VARCHAR(255)  NULL,
    ADD COLUMN IF NOT EXISTS last_latitude      DECIMAL(10,8) NULL,
    ADD COLUMN IF NOT EXISTS last_longitude     DECIMAL(11,8) NULL;
