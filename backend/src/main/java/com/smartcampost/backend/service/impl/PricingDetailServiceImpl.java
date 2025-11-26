package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.pricing.PricingDetailResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.PricingDetail;
import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PricingDetailRepository;
import com.smartcampost.backend.service.PricingDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PricingDetailServiceImpl implements PricingDetailService {

    private final PricingDetailRepository pricingDetailRepository;
    private final ParcelRepository parcelRepository;

    @Override
    public Page<PricingDetailResponse> listByParcel(UUID parcelId, int page, int size) {

        // Vérifier que le colis existe
        parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        return pricingDetailRepository
                .findByParcel_Id(parcelId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Override
    public List<PricingDetailResponse> historyForParcel(UUID parcelId) {

        parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        return pricingDetailRepository
                .findByParcel_IdOrderByAppliedAtAsc(parcelId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private PricingDetailResponse toResponse(PricingDetail detail) {
        Tariff t = detail.getTariff();

        return PricingDetailResponse.builder()
                .id(detail.getId())
                .parcelId(detail.getParcel().getId())
                .tariffId(t.getId())
                .serviceType(t.getServiceType().name())
                .originZone(t.getOriginZone())
                .destinationZone(t.getDestinationZone())
                .weightBracket(t.getWeightBracket())
                .appliedPrice(detail.getAppliedPrice())
                .appliedAt(detail.getAppliedAt())
                .build();
    }
}
