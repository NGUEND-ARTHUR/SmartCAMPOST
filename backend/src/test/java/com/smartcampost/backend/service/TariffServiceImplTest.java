package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.tariff.CreateTariffRequest;
import com.smartcampost.backend.dto.tariff.UpdateTariffRequest;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.model.enums.ServiceType;
import com.smartcampost.backend.repository.TariffRepository;
import com.smartcampost.backend.service.impl.TariffServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TariffServiceImplTest {

    @Mock private TariffRepository tariffRepository;
    @InjectMocks private TariffServiceImpl tariffService;

    @Test
    void createTariff_withNullRequest_shouldThrow() {
        assertThrows(NullPointerException.class, () -> tariffService.createTariff(null));
    }

    @Test
    void createTariff_withDuplicate_shouldThrowConflict() {
        CreateTariffRequest req = new CreateTariffRequest();
        req.setServiceType("STANDARD");
        req.setOriginZone("CENTRE");
        req.setDestinationZone("LITTORAL");
        req.setWeightBracket("0-5kg");
        req.setPrice(BigDecimal.valueOf(1000));
        when(tariffRepository.existsByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                any(), any(), any(), any())).thenReturn(true);
        assertThrows(ConflictException.class, () -> tariffService.createTariff(req));
    }

    @Test
    void createTariff_withValidData_shouldSave() {
        CreateTariffRequest req = new CreateTariffRequest();
        req.setServiceType("EXPRESS");
        req.setOriginZone("CENTRE");
        req.setDestinationZone("LITTORAL");
        req.setWeightBracket("0-5kg");
        req.setPrice(BigDecimal.valueOf(2000));
        when(tariffRepository.existsByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                any(), any(), any(), any())).thenReturn(false);
        Tariff saved = Tariff.builder()
                .id(UUID.randomUUID())
                .serviceType(ServiceType.EXPRESS)
                .originZone("CENTRE")
                .destinationZone("LITTORAL")
                .weightBracket("0-5kg")
                .price(BigDecimal.valueOf(2000))
                .build();
        when(tariffRepository.save(any())).thenReturn(saved);

        var result = tariffService.createTariff(req);
        assertNotNull(result);
        assertEquals("EXPRESS", result.getServiceType());
        assertEquals(BigDecimal.valueOf(2000), result.getPrice());
    }

    @Test
    void getTariffById_notFound_shouldThrow() {
        UUID id = UUID.randomUUID();
        when(tariffRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> tariffService.getTariffById(id));
    }

    @Test
    void updateTariff_shouldUpdatePrice() {
        UUID id = UUID.randomUUID();
        Tariff existing = Tariff.builder().id(id).serviceType(ServiceType.STANDARD)
                .originZone("A").destinationZone("B").weightBracket("0-5kg").price(BigDecimal.valueOf(1000)).build();
        when(tariffRepository.findById(id)).thenReturn(Optional.of(existing));
        when(tariffRepository.save(any())).thenReturn(existing);

        UpdateTariffRequest req = new UpdateTariffRequest();
        req.setPrice(BigDecimal.valueOf(1500));
        var result = tariffService.updateTariff(id, req);
        assertNotNull(result);
    }

    @Test
    void deleteTariff_notFound_shouldThrow() {
        UUID id = UUID.randomUUID();
        when(tariffRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> tariffService.deleteTariff(id));
    }
}
