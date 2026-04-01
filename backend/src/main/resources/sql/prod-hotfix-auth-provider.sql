-- Render production hotfix: ensure OAuth-related columns exist before Hibernate validate.
-- This script is idempotent and safe to run multiple times.

SET @table_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'user_account'
);

SET @has_auth_provider := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_account'
      AND column_name = 'auth_provider'
);

SET @sql := IF(
    @table_exists = 1 AND @has_auth_provider = 0,
    "ALTER TABLE user_account ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL'",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_email := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_account'
      AND column_name = 'email'
);

SET @sql := IF(
    @table_exists = 1 AND @has_email = 0,
    'ALTER TABLE user_account ADD COLUMN email VARCHAR(255) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_google_id := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_account'
      AND column_name = 'google_id'
);

SET @sql := IF(
    @table_exists = 1 AND @has_google_id = 0,
    "ALTER TABLE user_account ADD COLUMN google_id VARCHAR(255) NULL",
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_google_id_idx := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user_account'
      AND index_name = 'uq_user_google_id'
);

SET @sql := IF(
    @table_exists = 1 AND @has_google_id = 1 AND @has_google_id_idx = 0,
    'CREATE UNIQUE INDEX uq_user_google_id ON user_account(google_id)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_auth_provider_idx := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user_account'
      AND index_name = 'ix_user_auth_provider'
);

SET @sql := IF(
    @table_exists = 1 AND @has_auth_provider_idx = 0,
    'CREATE INDEX ix_user_auth_provider ON user_account(auth_provider)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_email_idx := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'user_account'
      AND index_name = 'uq_user_email'
);

SET @sql := IF(
    @table_exists = 1 AND @has_email_idx = 0,
    'CREATE UNIQUE INDEX uq_user_email ON user_account(email)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
