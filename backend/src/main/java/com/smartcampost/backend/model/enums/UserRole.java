package com.smartcampost.backend.model.enums;

public enum UserRole {
    CLIENT,
    AGENT,
    COURIER,

    // Base staff role
    STAFF,

    // Staff “advanced” roles (must be supported by UI + backend security)
    ADMIN,
    FINANCE,
    RISK;

    /**
     * True if the role is considered part of internal staff (including advanced staff roles).
     */
    public boolean isStaffLike() {
        return this == STAFF || this == ADMIN || this == FINANCE || this == RISK;
    }

    /**
     * True if the role is an advanced staff role (not STAFF).
     */
    public boolean isAdvancedStaff() {
        return this == ADMIN || this == FINANCE || this == RISK;
    }
}
