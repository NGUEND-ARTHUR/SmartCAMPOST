-- Render production hotfix: create approval_requests table if missing.
-- This script is idempotent and safe to run multiple times.

CREATE TABLE IF NOT EXISTS approval_requests (
    id            BINARY(16)   NOT NULL,
    tool_name     VARCHAR(255),
    actor_id      VARCHAR(255),
    actor_role    VARCHAR(255),
    parameters_json LONGTEXT,
    reason        VARCHAR(255),
    approved      BIT(1)       NOT NULL DEFAULT 0,
    processed     BIT(1)       NOT NULL DEFAULT 0,
    handled       BIT(1)       NOT NULL DEFAULT 0,
    created_at    DATETIME(6),
    processed_at  DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
