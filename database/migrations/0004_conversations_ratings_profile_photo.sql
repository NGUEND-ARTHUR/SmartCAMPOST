ALTER TABLE user_account
    ADD COLUMN IF NOT EXISTS photo_url VARCHAR(1000);

CREATE TABLE IF NOT EXISTS operational_rating (
    rating_id BINARY(16) PRIMARY KEY,
    rated_by_user_id BINARY(16) NOT NULL,
    rated_entity_id BINARY(16) NOT NULL,
    rated_role VARCHAR(30) NOT NULL,
    parcel_id BINARY(16) NULL,
    tracking_ref VARCHAR(80) NULL,
    score INT NOT NULL,
    comment VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_operational_rating_user
        FOREIGN KEY (rated_by_user_id) REFERENCES user_account(id)
);

CREATE INDEX IF NOT EXISTS idx_operational_rating_entity
    ON operational_rating (rated_entity_id, rated_role);

CREATE INDEX IF NOT EXISTS idx_operational_rating_tracking
    ON operational_rating (tracking_ref);
