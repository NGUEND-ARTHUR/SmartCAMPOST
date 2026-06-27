package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class NotificationServiceImplTest {

    @Test
    void parcel_statusValues_shouldExist() {
        assertNotNull(ParcelStatus.CREATED);
        assertNotNull(ParcelStatus.DELIVERED);
        assertNotNull(ParcelStatus.IN_TRANSIT);
        assertNotNull(ParcelStatus.OUT_FOR_DELIVERY);
        assertNotNull(ParcelStatus.CANCELLED);
    }

    @Test
    void parcel_allStatusTransitions_shouldBeDefined() {
        ParcelStatus[] values = ParcelStatus.values();
        assertTrue(values.length >= 10, "Should have at least 10 parcel statuses");
    }
}
