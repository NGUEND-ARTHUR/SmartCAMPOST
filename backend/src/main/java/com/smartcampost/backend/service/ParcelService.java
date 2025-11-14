package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.parcel.ParcelCreateRequest;
import com.smartcampost.backend.dto.parcel.ParcelDetailResponse;
import com.smartcampost.backend.dto.parcel.ParcelSummaryResponse;

import java.util.List;
import java.util.UUID;

public interface ParcelService {

    ParcelDetailResponse createParcel(ParcelCreateRequest request);

    ParcelDetailResponse getParcel(UUID parcelId);

    ParcelDetailResponse getByTrackingRef(String trackingRef);

    List<ParcelSummaryResponse> listClientParcels(UUID clientId);

    void updateParcelStatus(UUID parcelId, String status);
}
