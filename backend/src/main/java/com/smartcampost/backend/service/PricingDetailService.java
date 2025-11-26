package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.pricing.PricingDetailResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface PricingDetailService {

    Page<PricingDetailResponse> listByParcel(UUID parcelId, int page, int size);

    List<PricingDetailResponse> historyForParcel(UUID parcelId);
}
