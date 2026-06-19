CREATE TABLE IF NOT EXISTS gps_tracker (
    tracker_id BINARY(16) PRIMARY KEY,
    device_id VARCHAR(80) NOT NULL UNIQUE,
    imei VARCHAR(80) UNIQUE,
    label VARCHAR(150),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_type VARCHAR(40),
    assigned_id VARCHAR(80),
    vehicle_id VARCHAR(80),
    last_latitude DECIMAL(10,8),
    last_longitude DECIMAL(11,8),
    last_speed DOUBLE,
    last_heading DOUBLE,
    last_seen_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gps_tracker_assigned ON gps_tracker (assigned_type, assigned_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracker_vehicle ON gps_tracker (vehicle_id);
