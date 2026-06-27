package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.parcel.CreateParcelRequest;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Address;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ServiceType;
import com.smartcampost.backend.model.enums.DeliveryOption;
import com.smartcampost.backend.repository.AddressRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.impl.ParcelServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParcelServiceImplTest {

    @Mock private ParcelRepository parcelRepository;
    @Mock private AddressRepository addressRepository;

    @InjectMocks private ParcelServiceImpl parcelService;

    @Test
    void createParcel_withNullRequest_shouldThrow() {
        assertThrows(NullPointerException.class, () -> parcelService.createParcel(null));
    }

    @Test
    void getParcelById_withNonExistentId_shouldThrow() {
        UUID id = UUID.randomUUID();
        when(parcelRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> parcelService.getParcelById(id));
    }

    @Test
    void getParcelByTracking_withNonExistentRef_shouldThrow() {
        when(parcelRepository.findByTrackingRef("INVALID")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> parcelService.getParcelByTracking("INVALID"));
    }

    @Test
    void acceptParcel_shouldRequireGps() {
        UUID id = UUID.randomUUID();
        assertThrows(Exception.class, () -> parcelService.acceptParcel(id));
    }
}
