CREATE TABLE IF NOT EXISTS permission (
    permission_id BINARY(16) PRIMARY KEY,
    code VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permission (
    role_permission_id BINARY(16) PRIMARY KEY,
    role_name VARCHAR(80) NOT NULL,
    permission_code VARCHAR(120) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permission UNIQUE (role_name, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_role_permission_role ON role_permission (role_name, enabled);
CREATE INDEX IF NOT EXISTS idx_role_permission_permission ON role_permission (permission_code);

-- Optional seed data. The application also has safe fallback permissions when this table is empty.
-- UUID values use fixed hex literals for MySQL/H2 compatibility with BINARY(16).
INSERT IGNORE INTO permission (permission_id, code, description) VALUES
(UNHEX('00000000000000000000000000000301'), 'parcel:read', 'Read parcel and tracking data'),
(UNHEX('00000000000000000000000000000302'), 'parcel:assign', 'Assign parcels or pickups to logistics actors'),
(UNHEX('00000000000000000000000000000303'), 'courier:read', 'Read courier availability and assignment data'),
(UNHEX('00000000000000000000000000000304'), 'delivery:write', 'Update delivery workflow state'),
(UNHEX('00000000000000000000000000000305'), 'payment:read', 'Read payment state'),
(UNHEX('00000000000000000000000000000306'), 'payment:verify', 'Verify payment and anomaly state'),
(UNHEX('00000000000000000000000000000307'), 'report:read', 'Generate operational and financial reports'),
(UNHEX('00000000000000000000000000000308'), 'notification:send', 'Send workflow notifications'),
(UNHEX('00000000000000000000000000000309'), 'risk:write', 'Create risk or fraud alerts'),
(UNHEX('0000000000000000000000000000030A'), 'approval:review', 'Approve sensitive AI/tool actions'),
(UNHEX('0000000000000000000000000000030B'), 'rbac:manage', 'Manage role permissions'),
(UNHEX('0000000000000000000000000000030C'), 'ai:operate', 'Use AI runtime tools'),
(UNHEX('0000000000000000000000000000030D'), 'ai:discover', 'Run autonomous automation discovery');
